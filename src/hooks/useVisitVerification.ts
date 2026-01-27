import { useState } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export const KOREA_REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

interface VerifyVisitParams {
  placeId: string;
  date: Date;
  file: File | null;
  comment: string;
  region: string;
}

export const useVisitVerification = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visit-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      throw new Error(`이미지 업로드 실패: ${err.message}`);
    }
  };

  const verifyVisit = async ({ placeId, date, file, comment, region }: VerifyVisitParams) => {
    setIsSubmitting(true);
    setError(null);

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
        p_comment: comment,
        p_region: region
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
