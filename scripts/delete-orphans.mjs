/**
 * delete-orphans.mjs
 * check-orphans.mjs에서 발견된 고립 파일을 실제로 삭제합니다.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
    const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllFiles(bucket, prefix = '') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw new Error(`목록 조회 실패 (${bucket}/${prefix}): ${error.message}`);

  const files = [];
  for (const item of data ?? []) {
    if (item.metadata) {
      files.push(prefix ? `${prefix}/${item.name}` : item.name);
    } else {
      const sub = await listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      files.push(...sub);
    }
  }
  return files;
}

async function getOrphans(bucket, prefixes, dbUrlSet, bucketUrlBase) {
  let allFiles = [];
  if (prefixes.length === 0) {
    allFiles = await listAllFiles(bucket);
  } else {
    for (const prefix of prefixes) {
      allFiles.push(...await listAllFiles(bucket, prefix));
    }
  }
  return allFiles.filter(f => !dbUrlSet.has(f));
}

async function deleteFiles(bucket, files) {
  if (files.length === 0) return { success: 0, fail: 0 };
  let success = 0, fail = 0;
  // Supabase는 최대 1000개씩 배치 삭제 가능
  const chunkSize = 100;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) {
      console.log(`   ❌ 배치 삭제 실패: ${error.message}`);
      fail += chunk.length;
    } else {
      chunk.forEach(f => console.log(`   🗑️  삭제: ${f}`));
      success += chunk.length;
    }
  }
  return { success, fail };
}

async function main() {
  console.log('🗑️  고립 파일 삭제 시작\n');

  const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const visitPhotosBucketBase = `${SUPABASE_URL}/storage/v1/object/public/visit-photos/`;
  const diaryImagesBucketBase = `${SUPABASE_URL}/storage/v1/object/public/diary-images/`;

  // DB 참조 URL 수집
  const { data: visits } = await supabase.from('visits').select('image_url').not('image_url', 'is', null);
  const { data: profiles } = await supabase.from('profiles').select('avatar_url').not('avatar_url', 'is', null);

  const dbVisitFileNames = new Set(
    (visits ?? [])
      .filter(v => v.image_url?.includes('/visit-photos/'))
      .map(v => decodeURIComponent(v.image_url.replace(visitPhotosBucketBase, '').split('?')[0]))
  );
  const dbDiaryFileNames = new Set([
    ...(visits ?? [])
      .filter(v => v.image_url?.includes('/diary-images/'))
      .map(v => decodeURIComponent(v.image_url.replace(diaryImagesBucketBase, '').split('?')[0])),
    ...(profiles ?? [])
      .filter(p => p.avatar_url?.includes('/diary-images/'))
      .map(p => decodeURIComponent(p.avatar_url.replace(diaryImagesBucketBase, '').split('?')[0])),
  ]);

  // visit-photos 고립 파일
  console.log('📂 [visit-photos] 고립 파일 삭제 중...');
  const visitOrphans = await getOrphans('visit-photos', [], dbVisitFileNames, visitPhotosBucketBase);
  console.log(`   고립 파일 ${visitOrphans.length}건 발견`);
  const visitResult = await deleteFiles('visit-photos', visitOrphans);

  // diary-images/avatars 고립 파일
  console.log('\n📂 [diary-images/avatars] 고립 파일 삭제 중...');
  const avatarAllFiles = await listAllFiles('diary-images', 'avatars');
  const avatarOrphans = avatarAllFiles.filter(f => !dbDiaryFileNames.has(f));
  console.log(`   고립 파일 ${avatarOrphans.length}건 발견`);
  const avatarResult = await deleteFiles('diary-images', avatarOrphans);

  // diary-images/visits 고립 파일
  console.log('\n📂 [diary-images/visits] 고립 파일 삭제 중...');
  const diaryVisitAllFiles = await listAllFiles('diary-images', 'visits');
  const diaryVisitOrphans = diaryVisitAllFiles.filter(f => !dbDiaryFileNames.has(f));
  console.log(`   고립 파일 ${diaryVisitOrphans.length}건 발견`);
  const diaryVisitResult = await deleteFiles('diary-images', diaryVisitOrphans);

  const totalSuccess = visitResult.success + avatarResult.success + diaryVisitResult.success;
  const totalFail = visitResult.fail + avatarResult.fail + diaryVisitResult.fail;

  console.log(`\n📊 결과: 삭제 성공 ${totalSuccess}건 / 실패 ${totalFail}건`);
  if (totalFail === 0) {
    console.log('🎉 모든 고립 파일이 정리됐습니다.');
  } else {
    console.log('⚠️  일부 파일 삭제에 실패했습니다. 위 로그를 확인하세요.');
    process.exit(1);
  }
}

main().catch(err => { console.error('❌ 오류:', err); process.exit(1); });
