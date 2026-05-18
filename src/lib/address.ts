import { KOREA_REGIONS } from "../constants/regions";

/**
 * 주소 문자열에서 주요 지역(도/특별시/광역시) 명칭을 추출합니다.
 */
export const getRegionFromAddress = (address: string | null): string => {
  if (!address) return "기타";

  for (const region of KOREA_REGIONS) {
    if (address.includes(region)) return region;
  }

  // 충청북도, 전라남도 등 전체 명칭 대응
  if (address.includes("충청북도")) return "충북";
  if (address.includes("충청남도")) return "충남";
  if (address.includes("전라북도")) return "전북";
  if (address.includes("전라남도")) return "전남";
  if (address.includes("경상북도")) return "경북";
  if (address.includes("경상남도")) return "경남";

  return "기타";
};

/**
 * 주소 문자열에서 '시' 또는 '군' 단위를 추출합니다.
 * 특별시/광역시의 경우 '시'를 붙여서 반환합니다.
 */
export const extractCityCounty = (address: string | null): string => {
  if (!address) return "";

  // 1. 시, 군을 찾는 정규표현식 (ex: 전주시, 구례군)
  const match = address.match(/([가-힣]+(?:시|군))/);
  if (match) return match[1];

  // 2. 특별시/광역시/특별자치시 처리
  const cityMap: Record<string, string> = {
    서울: "서울시",
    부산: "부산시",
    대구: "대구시",
    인천: "인천시",
    광주: "광주시",
    대전: "대전시",
    울산: "울산시",
    세종: "세종시",
  };

  for (const [key, value] of Object.entries(cityMap)) {
    if (address.includes(key)) return value;
  }

  // 3. 도 단위가 주소 처음에 나오는 경우 처리 (ex: 경기도 -> 경기도)
  const doMatch = address.match(/^([가-힣]+(?:도))/);
  if (doMatch) return doMatch[1];

  return address.split(" ")[0] || "";
};
