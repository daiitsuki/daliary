export interface ParsedTripTitle {
  rawTitle: string;
  themeIndex: number;
  iconIndex: number;
}

export const TRIP_ICONS = [
  { id: "plane", label: "비행기" },
  { id: "tent", label: "캠핑" },
  { id: "map", label: "여행" },
  { id: "heart", label: "데이트" },
  { id: "palmtree", label: "휴양지" },
  { id: "building", label: "도시" },
];

export function parseTripTitle(title: string): ParsedTripTitle {
  if (!title) {
    return { rawTitle: "", themeIndex: 0, iconIndex: 0 };
  }

  const parts = title.split("|theme:");
  if (parts.length > 1) {
    const rawTitle = parts[0];
    const themeAndIcon = parts[1].split("|icon:");
    const themeIndex = parseInt(themeAndIcon[0], 10);
    const iconIndex = parseInt(themeAndIcon[1], 10);
    return {
      rawTitle,
      themeIndex: isNaN(themeIndex) ? 0 : themeIndex,
      iconIndex: isNaN(iconIndex) ? 0 : iconIndex % TRIP_ICONS.length,
    };
  }

  // 폴백: 해싱을 통해 결정론적인 아이콘 지정
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const iconIndex = Math.abs(hash >> 3) % TRIP_ICONS.length;

  return { rawTitle: title, themeIndex: 0, iconIndex };
}

export function serializeTripTitle(
  title: string,
  iconIndex: number,
): string {
  const sanitizedTitle = title.replace(/\|/g, ""); // 구분 문자 중복 방지
  // DB 호환성을 위해 theme:0 고정값으로 전달
  return `${sanitizedTitle}|theme:0|icon:${iconIndex}`;
}
