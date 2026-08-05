import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

/**
 * Canvas API를 사용해 이미지 Blob을 WebP 형식으로 변환합니다.
 * browser-image-compression으로 리사이즈/용량 압축 후 이 함수로 WebP 변환하는
 * 두 단계 파이프라인으로 사용하세요.
 *
 * @param blob - 변환할 이미지 Blob (JPEG, PNG 등 모든 형식 가능)
 * @param quality - WebP 품질 (0.0 ~ 1.0, 기본값 0.8)
 * @returns WebP 형식의 Blob
 */
export const convertToWebP = (blob: Blob, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas 2D context를 가져올 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('WebP 변환에 실패했습니다. 브라우저가 WebP를 지원하지 않을 수 있습니다.'));
          }
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    img.src = objectUrl;
  });
};

/**
 * 파일을 리사이즈/압축하고 WebP로 변환한 뒤 Supabase에 업로드합니다.
 * @param file 원본 이미지 파일
 * @param bucket 업로드할 스토리지 버킷 이름 (기본값: 'visit-photos')
 * @returns 업로드된 이미지의 publicUrl
 */
export const uploadOptimizedImage = async (file: File, bucket: string = 'visit-photos') => {
  try {
    // 1. Resize and compress
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);

    // 2. Convert to WebP (quality 0.8)
    const webpBlob = await convertToWebP(compressedFile, 0.8);

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, webpBlob, { contentType: 'image/webp' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err: any) {
    throw new Error(`이미지 업로드 실패: ${err.message}`);
  }
};

