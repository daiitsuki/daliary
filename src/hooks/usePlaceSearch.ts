import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
  distance: string;
}

export const usePlaceSearch = () => {
  const { couple } = useCouple();
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback((keyword: string) => {
    if (!keyword.trim()) return;

    setIsSearching(true);
    setError(null);

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      setError('카카오맵 API가 로드되지 않았습니다.');
      setIsSearching(false);
      return;
    }

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(data);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        setResults([]);
        // setError('검색 결과가 존재하지 않습니다.'); // Optional: don't treat zero results as error
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        setError('검색 중 오류가 발생했습니다.');
        setResults([]);
      }
      setIsSearching(false);
    });
  }, []);

  const savePlace = async (place: KakaoPlace, status: 'wishlist' | 'visited' = 'wishlist') => {
    if (!couple?.id) {
      const msg = '커플 연결이 필요합니다.';
      setError(msg);
      throw new Error(msg);
    }

    setIsSaving(true);
    try {
      const { data, error: dbError } = await supabase.from('places').insert({
        couple_id: couple.id,
        kakao_place_id: place.id,
        name: place.place_name,
        address: place.road_address_name || place.address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        status: status
      }).select().single();

      if (dbError) {
        if (dbError.code === '23505') { // Unique violation
          // Fetch the existing place to return its ID
          const { data: existingPlace, error: fetchError } = await supabase
            .from('places')
            .select('id, name, address, lat, lng, status')
            .eq('couple_id', couple.id)
            .eq('kakao_place_id', place.id)
            .single();
            
          if (fetchError) throw fetchError;
          return existingPlace;
        }
        throw dbError;
      }
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { searchPlaces, results, savePlace, isSearching, isSaving, error };
};
