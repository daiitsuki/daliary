/**
 * check-orphans.mjs
 * Storage에 있는 파일 중 DB(visits.image_url)에 참조가 없는 고립 파일을 찾아 출력합니다.
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

async function main() {
  console.log('🔍 고립 파일 검사 시작\n');

  // ── visit-photos 버킷 ──────────────────────────────────
  console.log('📂 [visit-photos] 버킷 검사 중...');
  const visitFiles = await listAllFiles('visit-photos');

  // DB에서 visit-photos 버킷에 해당하는 image_url 전체 조회
  const { data: visits, error: visitErr } = await supabase
    .from('visits')
    .select('id, image_url')
    .not('image_url', 'is', null);
  if (visitErr) throw visitErr;

  // DB에 저장된 파일명 Set 생성
  const visitPhotosBucketBase = `${env.SUPABASE_URL || env.VITE_SUPABASE_URL}/storage/v1/object/public/visit-photos/`;
  const dbVisitFileNames = new Set(
    visits
      .filter(v => v.image_url?.includes('/visit-photos/'))
      .map(v => decodeURIComponent(v.image_url.replace(visitPhotosBucketBase, '').split('?')[0]))
  );

  const orphanVisitPhotos = visitFiles.filter(f => !dbVisitFileNames.has(f));
  console.log(`   Storage 파일: ${visitFiles.length}개`);
  console.log(`   DB 참조 파일: ${dbVisitFileNames.size}개`);
  console.log(`   고립 파일: ${orphanVisitPhotos.length}개`);
  if (orphanVisitPhotos.length > 0) {
    orphanVisitPhotos.forEach(f => console.log(`   ❌ ${f}`));
  } else {
    console.log('   ✅ 고립 파일 없음');
  }

  // ── diary-images/avatars 버킷 ──────────────────────────
  console.log('\n📂 [diary-images/avatars] 버킷 검사 중...');
  const avatarFiles = await listAllFiles('diary-images', 'avatars');

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .not('avatar_url', 'is', null);
  if (profileErr) throw profileErr;

  const diaryImagesBucketBase = `${env.SUPABASE_URL || env.VITE_SUPABASE_URL}/storage/v1/object/public/diary-images/`;
  const dbAvatarFileNames = new Set(
    profiles
      .filter(p => p.avatar_url?.includes('/diary-images/'))
      .map(p => decodeURIComponent(p.avatar_url.replace(diaryImagesBucketBase, '').split('?')[0]))
  );

  const orphanAvatars = avatarFiles.filter(f => !dbAvatarFileNames.has(f));
  console.log(`   Storage 파일: ${avatarFiles.length}개`);
  console.log(`   DB 참조 파일: ${dbAvatarFileNames.size}개`);
  console.log(`   고립 파일: ${orphanAvatars.length}개`);
  if (orphanAvatars.length > 0) {
    orphanAvatars.forEach(f => console.log(`   ❌ ${f}`));
  } else {
    console.log('   ✅ 고립 파일 없음');
  }

  // ── diary-images/visits 버킷 ──────────────────────────
  console.log('\n📂 [diary-images/visits] 버킷 검사 중...');
  const diaryVisitFiles = await listAllFiles('diary-images', 'visits');

  const dbDiaryVisitFileNames = new Set(
    visits
      .filter(v => v.image_url?.includes('/diary-images/'))
      .map(v => decodeURIComponent(v.image_url.replace(diaryImagesBucketBase, '').split('?')[0]))
  );

  const orphanDiaryVisits = diaryVisitFiles.filter(f => !dbDiaryVisitFileNames.has(f));
  console.log(`   Storage 파일: ${diaryVisitFiles.length}개`);
  console.log(`   DB 참조 파일: ${dbDiaryVisitFileNames.size}개`);
  console.log(`   고립 파일: ${orphanDiaryVisits.length}개`);
  if (orphanDiaryVisits.length > 0) {
    orphanDiaryVisits.forEach(f => console.log(`   ❌ ${f}`));
  } else {
    console.log('   ✅ 고립 파일 없음');
  }

  // ── 요약 ──────────────────────────────────────────────
  const totalOrphans = [...orphanVisitPhotos, ...orphanAvatars, ...orphanDiaryVisits];
  console.log(`\n📊 요약: 총 고립 파일 ${totalOrphans.length}건`);
  if (totalOrphans.length > 0) {
    console.log('   → 고립 파일 목록:');
    orphanVisitPhotos.forEach(f => console.log(`      [visit-photos] ${f}`));
    orphanAvatars.forEach(f => console.log(`      [diary-images] ${f}`));
    orphanDiaryVisits.forEach(f => console.log(`      [diary-images] ${f}`));
  }
}

main().catch(err => { console.error('❌ 오류:', err); process.exit(1); });
