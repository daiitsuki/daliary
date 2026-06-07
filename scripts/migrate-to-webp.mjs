/**
 * migrate-to-webp.mjs
 *
 * Supabase Storage에 저장된 기존 .jpg / .jpeg 이미지를 .webp로 변환하고
 * DB의 image_url / avatar_url 컬럼을 새 URL로 갱신하는 일괄 마이그레이션 스크립트.
 *
 * 실행 전 필수:
 *   npm install sharp @supabase/supabase-js  (이미 설치돼 있으면 생략)
 *
 * 실행 방법:
 *   node scripts/migrate-to-webp.mjs
 *
 * 주의:
 *   - 이 스크립트는 SERVICE_ROLE_KEY를 사용합니다. 절대 외부에 노출하지 마세요.
 *   - .env 파일에서 환경변수를 읽습니다.
 *   - 마이그레이션 중 방문 사진/아바타 기능이 일시적으로 불안정할 수 있습니다.
 *     (신규 업로드는 계속 가능, 기존 이미지 URL이 변환 직후 교체됨)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// .env 수동 파싱 (dotenv 미설치 환경 대응)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const WEBP_QUALITY = 80; // sharp quality (0–100)

// ─────────────────────────────────────────────
// 유틸: 파일 다운로드 → Sharp WebP 변환 → Buffer
// ─────────────────────────────────────────────
async function downloadAndConvert(bucket, filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) throw new Error(`다운로드 실패 (${filePath}): ${error.message}`);

  const arrayBuffer = await data.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const webpBuffer = await sharp(inputBuffer)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return webpBuffer;
}

// ─────────────────────────────────────────────
// 유틸: 버킷에서 모든 파일 목록 재귀 조회
// ─────────────────────────────────────────────
async function listAllFiles(bucket, prefix = '') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (error) throw new Error(`파일 목록 조회 실패 (${bucket}/${prefix}): ${error.message}`);

  const files = [];
  for (const item of data ?? []) {
    if (item.metadata) {
      // 파일
      files.push(prefix ? `${prefix}/${item.name}` : item.name);
    } else {
      // 폴더 — 재귀
      const sub = await listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      files.push(...sub);
    }
  }
  return files;
}

// ─────────────────────────────────────────────
// visit-photos 버킷 마이그레이션
// ─────────────────────────────────────────────
async function migrateVisitPhotos() {
  console.log('\n📂 [visit-photos] 파일 목록 조회 중...');
  const allFiles = await listAllFiles('visit-photos');
  const jpgFiles = allFiles.filter((f) => /\.(jpg|jpeg)$/i.test(f));

  console.log(`   전체 파일: ${allFiles.length}개 | 변환 대상 .jpg: ${jpgFiles.length}개`);

  let success = 0;
  let fail = 0;

  for (const filePath of jpgFiles) {
    try {
      process.stdout.write(`   ⏳ ${filePath} 변환 중...`);

      // 1. 다운로드 & WebP 변환
      const webpBuffer = await downloadAndConvert('visit-photos', filePath);

      // 2. 새 파일명 (.webp)
      const newFilePath = filePath.replace(/\.(jpg|jpeg)$/i, '.webp');

      // 3. 업로드
      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(newFilePath, webpBuffer, { contentType: 'image/webp', upsert: true });
      if (uploadError) throw uploadError;

      // 4. 기존/신규 publicUrl 계산
      const oldUrl = supabase.storage.from('visit-photos').getPublicUrl(filePath).data.publicUrl;
      const newUrl = supabase.storage.from('visit-photos').getPublicUrl(newFilePath).data.publicUrl;

      // 5. visits.image_url 갱신
      const { error: updateError } = await supabase
        .from('visits')
        .update({ image_url: newUrl })
        .eq('image_url', oldUrl);
      if (updateError) throw updateError;

      // 6. 원본 삭제
      const { error: deleteError } = await supabase.storage
        .from('visit-photos')
        .remove([filePath]);
      if (deleteError) throw deleteError;

      console.log(` ✅ 완료 → ${newFilePath}`);
      success++;
    } catch (err) {
      console.log(` ❌ 실패: ${err.message}`);
      fail++;
    }
  }

  return { success, fail };
}

// ─────────────────────────────────────────────
// diary-images 버킷 (avatars/) 마이그레이션
// ─────────────────────────────────────────────
async function migrateAvatars() {
  console.log('\n📂 [diary-images/avatars] 파일 목록 조회 중...');
  const allFiles = await listAllFiles('diary-images', 'avatars');
  const jpgFiles = allFiles.filter((f) => /\.(jpg|jpeg)$/i.test(f));

  console.log(`   전체 파일: ${allFiles.length}개 | 변환 대상 .jpg: ${jpgFiles.length}개`);

  let success = 0;
  let fail = 0;

  for (const filePath of jpgFiles) {
    try {
      process.stdout.write(`   ⏳ ${filePath} 변환 중...`);

      // 1. 다운로드 & WebP 변환
      const webpBuffer = await downloadAndConvert('diary-images', filePath);

      // 2. 새 파일명 (.webp)
      const newFilePath = filePath.replace(/\.(jpg|jpeg)$/i, '.webp');

      // 3. 업로드
      const { error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(newFilePath, webpBuffer, { contentType: 'image/webp', upsert: true });
      if (uploadError) throw uploadError;

      // 4. 기존/신규 publicUrl 계산
      const oldUrl = supabase.storage.from('diary-images').getPublicUrl(filePath).data.publicUrl;
      const newUrl = supabase.storage.from('diary-images').getPublicUrl(newFilePath).data.publicUrl;

      // 5. profiles.avatar_url 갱신
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('avatar_url', oldUrl);
      if (updateError) throw updateError;

      // 6. 원본 삭제
      const { error: deleteError } = await supabase.storage
        .from('diary-images')
        .remove([filePath]);
      if (deleteError) throw deleteError;

      console.log(` ✅ 완료 → ${newFilePath}`);
      success++;
    } catch (err) {
      console.log(` ❌ 실패: ${err.message}`);
      fail++;
    }
  }

  return { success, fail };
}

// ─────────────────────────────────────────────
// 검증: .jpg가 DB에 남아있는지 확인
// ─────────────────────────────────────────────
async function verifyMigration() {
  console.log('\n🔍 마이그레이션 검증 중...');

  const { data: visitJpg, error: e1 } = await supabase
    .from('visits')
    .select('id, image_url')
    .or('image_url.like.%.jpg,image_url.like.%.jpeg');

  if (e1) {
    console.log('   ⚠️  visits 테이블 검증 실패:', e1.message);
  } else {
    if (visitJpg && visitJpg.length > 0) {
      console.log(`   ⚠️  visits.image_url에 .jpg가 ${visitJpg.length}건 남아있습니다:`);
      visitJpg.forEach((r) => console.log(`      - id: ${r.id}, url: ${r.image_url}`));
    } else {
      console.log('   ✅ visits.image_url — .jpg 잔존 없음');
    }
  }

  const { data: profileJpg, error: e2 } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .or('avatar_url.like.%.jpg,avatar_url.like.%.jpeg');

  if (e2) {
    console.log('   ⚠️  profiles 테이블 검증 실패:', e2.message);
  } else {
    if (profileJpg && profileJpg.length > 0) {
      console.log(`   ⚠️  profiles.avatar_url에 .jpg가 ${profileJpg.length}건 남아있습니다:`);
      profileJpg.forEach((r) => console.log(`      - id: ${r.id}, url: ${r.avatar_url}`));
    } else {
      console.log('   ✅ profiles.avatar_url — .jpg 잔존 없음');
    }
  }
}

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────
async function main() {
  console.log('🚀 WebP 마이그레이션 시작');
  console.log(`   Supabase URL : ${SUPABASE_URL}`);
  console.log(`   WebP Quality : ${WEBP_QUALITY}`);
  console.log('   ────────────────────────────────────');

  const visitResult = await migrateVisitPhotos();
  const avatarResult = await migrateAvatars();

  console.log('\n📊 마이그레이션 결과');
  console.log(`   visit-photos : 성공 ${visitResult.success}건 / 실패 ${visitResult.fail}건`);
  console.log(`   diary-images (avatars) : 성공 ${avatarResult.success}건 / 실패 ${avatarResult.fail}건`);

  await verifyMigration();

  const totalFail = visitResult.fail + avatarResult.fail;
  if (totalFail > 0) {
    console.log(`\n⚠️  실패한 파일이 ${totalFail}건 있습니다. 위 로그를 확인해 수동 처리 또는 재실행하세요.`);
    process.exit(1);
  } else {
    console.log('\n🎉 마이그레이션 완료! 모든 이미지가 성공적으로 .webp로 변환됐습니다.');
  }
}

main().catch((err) => {
  console.error('❌ 마이그레이션 중 예외 발생:', err);
  process.exit(1);
});
