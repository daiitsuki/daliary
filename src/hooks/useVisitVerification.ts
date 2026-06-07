import { useState } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { convertToWebP } from '../utils/imageUtils';

interface VerifyVisitParams {
  placeId: string;
  date: Date;
  file: File | null;
  region: string;
  subRegion?: string;
}

export const useVisitVerification = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    try {
      // 1단계: 리사이즈 / 용량 압축
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // 2단계: WebP 변환 (quality 0.8)
      const webpBlob = await convertToWebP(compressedFile, 0.8);

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(fileName, webpBlob, { contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visit-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err: any) {
      throw new Error(`이미지 업로드 실패: ${err.message}`);
    }
  };

  const verifyVisit = async ({ placeId, date, file, region, subRegion }: VerifyVisitParams) => {
    setIsSubmitting(true);
    setError(null);

    // requestAnimationFrame을 활용해 브라우저가 로딩 UI를 완전히 페인트하도록 양보
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    try {
      if (!region) throw new Error('행정구역을 선택해주세요.');
      if (!date) throw new Error('방문 날짜를 선택해주세요.');

      let imageUrl = null;
      if (file) {
        imageUrl = await uploadImage(file);
      }

      // Format date to YYYY-MM-DD for SQL date type
      const dateStr = date.toISOString().split('T')[0];

      const { error: rpcError } = await supabase.rpc('verify_visit', {
        p_place_id: placeId,
        p_visited_at: dateStr,
        p_image_url: imageUrl,
        p_comment: "", // Still pass empty string or null if DB function requires it
        p_region: region,
        p_sub_region: subRegion
      });

      if (rpcError) throw rpcError;

      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || '방문 인증 처리 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { verifyVisit, isSubmitting, error };
};
