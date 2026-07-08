import { useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useCouple } from "../";

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

const getCategory = (place: KakaoPlace): string => {
  const group = place.category_group_name;
  const cat = place.category_name;

  // 1. 카페 (베이커리, 디저트 포함)
  if (
    group === "카페" ||
    cat.includes("카페") ||
    cat.includes("베이커리") ||
    cat.includes("디저트") ||
    cat.includes("커피") ||
    cat.includes("빵집") ||
    cat.includes("제과") ||
    cat.includes("브런치")
  ) {
    return "카페";
  }

  // 2. 숙소
  if (
    group === "숙박" ||
    cat.includes("숙박") ||
    cat.includes("호텔") ||
    cat.includes("펜션") ||
    cat.includes("모텔") ||
    cat.includes("스테이") ||
    cat.includes("리조트") ||
    cat.includes("게스트하우스") ||
    cat.includes("콘도") ||
    cat.includes("숙소")
  ) {
    return "숙소";
  }

  // 3. 여행지 & 놀거리 (관광명소, 공원, 영화관, 테마파크 등)
  if (
    group === "관광명소" ||
    group === "문화시설" ||
    cat.includes("관광") ||
    cat.includes("명소") ||
    cat.includes("문화") ||
    cat.includes("공원") ||
    cat.includes("테마파크") ||
    cat.includes("영화관") ||
    cat.includes("레저") ||
    cat.includes("놀거리") ||
    cat.includes("박물관") ||
    cat.includes("박람회") ||
    cat.includes("공연장") ||
    cat.includes("도서관")
  ) {
    return "관광지";
  }

  // 4. 맛집 (음식점 및 술집)
  if (
    group === "음식점" ||
    cat.includes("음식점") ||
    cat.includes("주점") ||
    cat.includes("요리") ||
    cat.includes("술집") ||
    cat.includes("식당")
  ) {
    return "맛집";
  }

  // 5. 쇼핑 (마트, 편의점)
  if (group === "대형마트" || group === "편의점") {
    return "쇼핑";
  }

  return "기타";
};

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
      setError("카카오맵 API가 로드되지 않았습니다.");
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
        setError("검색 중 오류가 발생했습니다.");
        setResults([]);
      }
      setIsSearching(false);
    });
  }, []);

  const savePlace = async (
    place: KakaoPlace,
    status: "wishlist" | "visited" = "wishlist",
  ) => {
    if (isSaving) throw new Error("현재 저장 중입니다. 잠시만 기다려주세요.");
    if (!couple?.id) {
      const msg = "커플 연결이 필요합니다.";
      setError(msg);
      throw new Error(msg);
    }

    setIsSaving(true);
    try {
      const category = getCategory(place);
      const { data, error: dbError } = await supabase
        .from("places")
        .insert({
          couple_id: couple.id,
          kakao_place_id: place.id,
          name: place.place_name,
          address: place.road_address_name || place.address_name,
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          status: status,
          category: category,
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === "23505") {
          if (status === "wishlist") {
            throw new Error("이미 추가된 장소입니다.");
          }
          // Unique violation
          // Fetch the existing place to return its ID
          const { data: existingPlace, error: fetchError } = await supabase
            .from("places")
            .select("id, name, address, lat, lng, status, category")
            .eq("couple_id", couple.id)
            .eq("kakao_place_id", place.id)
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
