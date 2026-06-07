/**
 * fix-remaining-jpg.mjs
 * visits.image_url에 남아있는 diary-images 버킷의 .jpg 1건을 처리합니다.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
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

// diary-images 버킷의 visits/ 경로 전체 마이그레이션
async function migrateDiaryImagesVisits() {
  console.log('\n📂 [diary-images/visits] 파일 목록 조회 중...');

  const { data, error } = await supabase.storage
    .from('diary-images')
    .list('visits', { limit: 1000 });

  if (error) throw new Error(`목록 조회 실패: ${error.message}`);

  const jpgFiles = (data ?? [])
    .filter(f => f.metadata && /\.(jpg|jpeg)$/i.test(f.name))
    .map(f => `visits/${f.name}`);

  console.log(`   발견된 .jpg: ${jpgFiles.length}건`);

  let success = 0, fail = 0;

  for (const filePath of jpgFiles) {
    try {
      process.stdout.write(`   ⏳ ${filePath} 변환 중...`);

      const { data: blob, error: dlErr } = await supabase.storage.from('diary-images').download(filePath);
      if (dlErr) throw dlErr;

      const webpBuffer = await sharp(Buffer.from(await blob.arrayBuffer()))
        .webp({ quality: 80 }).toBuffer();

      const newFilePath = filePath.replace(/\.(jpg|jpeg)$/i, '.webp');

      const { error: upErr } = await supabase.storage.from('diary-images')
        .upload(newFilePath, webpBuffer, { contentType: 'image/webp', upsert: true });
      if (upErr) throw upErr;

      const oldUrl = supabase.storage.from('diary-images').getPublicUrl(filePath).data.publicUrl;
      const newUrl = supabase.storage.from('diary-images').getPublicUrl(newFilePath).data.publicUrl;

      const { error: updateErr } = await supabase.from('visits')
        .update({ image_url: newUrl }).eq('image_url', oldUrl);
      if (updateErr) throw updateErr;

      const { error: delErr } = await supabase.storage.from('diary-images').remove([filePath]);
      if (delErr) throw delErr;

      console.log(` ✅ 완료 → ${newFilePath}`);
      success++;
    } catch (err) {
      console.log(` ❌ 실패: ${err.message}`);
      fail++;
    }
  }

  return { success, fail };
}

async function verify() {
  const { data } = await supabase.from('visits').select('id, image_url')
    .or('image_url.like.%.jpg,image_url.like.%.jpeg');
  if (!data || data.length === 0) {
    console.log('\n✅ 검증 완료 — visits.image_url에 .jpg 잔존 없음');
  } else {
    console.log(`\n⚠️  아직 ${data.length}건 남아있습니다:`);
    data.forEach(r => console.log(`   - id: ${r.id}, url: ${r.image_url}`));
  }
}

async function main() {
  console.log('🔧 잔존 .jpg 보완 마이그레이션 시작');
  const result = await migrateDiaryImagesVisits();
  console.log(`\n📊 결과: 성공 ${result.success}건 / 실패 ${result.fail}건`);
  await verify();
}

main().catch(err => { console.error('❌ 오류:', err); process.exit(1); });
