import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCouple } from "../../hooks";

interface FlashbackVisit {
  id: string;
  visited_at: string;
  image_url: string;
  comment: string | null;
  region: string;
  place_name: string;
}

export default function MemoryFlashbackCard() {
  const { couple } = useCouple();
  const navigate = useNavigate();

  // 1회 쿼리로 사진 있는 방문 목록을 최대 20개 가져와 30분간 메모리에 캐싱
  const { data: visitsList = [], isLoading } = useQuery({
    queryKey: ["flashback_pool", couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];

      const { data: places, error: placesError } = await supabase
        .from("places")
        .select("id, name")
        .eq("couple_id", couple.id);

      if (placesError || !places || places.length === 0) return [];

      const placeIds = places.map((p) => p.id);
      const placeMap = new Map(places.map((p) => [p.id, p.name]));

      const { data: visits, error: visitsError } = await supabase
        .from("visits")
        .select("id, place_id, visited_at, image_url, comment, region")
        .in("place_id", placeIds)
        .not("image_url", "is", null)
        .order("visited_at", { ascending: false })
        .limit(20);

      if (visitsError || !visits || visits.length === 0) return [];

      return visits.map((v) => ({
        id: v.id,
        visited_at: v.visited_at,
        image_url: v.image_url,
        comment: v.comment,
        region: v.region,
        place_name: placeMap.get(v.place_id) || "",
      })) as FlashbackVisit[];
    },
    enabled: !!couple?.id,
    staleTime: 1000 * 60 * 30, // 30분 동안 캐시 유지 (추가 DB 호출 0)
  });

  // 방문 풀(최대 20개)을 30분간 캐싱하고, 페이지를 새로고침하거나 열 때마다 무작위로 다른 사진 선택
  // React Rules of Hooks 준수: 조기 return(early return)보다 먼저 호출
  const selectedIndex = React.useMemo(() => {
    if (visitsList.length === 0) return 0;
    return Math.floor(Math.random() * visitsList.length);
  }, [visitsList]);

  if (isLoading || visitsList.length === 0) {
    return null;
  }

  const flashback = visitsList[selectedIndex] || visitsList[0];

  const formattedDate = new Date(flashback.visited_at).toLocaleDateString(
    "ko-KR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <section className="mb-4 px-6">
      <div
        onClick={() => navigate(`/places?tab=memory&visitId=${flashback.id}`)}
        className="group cursor-pointer overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xs transition-all hover:border-gray-200"
      >
        {/* Photo Container */}
        <div className="relative h-44 w-full overflow-hidden bg-gray-100">
          <img
            src={flashback.image_url}
            alt={flashback.place_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Place & Date on Photo */}
          <div className="absolute right-4 bottom-3 left-4 text-white">
            <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-white/80">
              <MapPin size={11} className="text-rose-300" />
              <span>{flashback.region}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
            <h4 className="truncate text-base font-bold tracking-tight">
              {flashback.place_name}
            </h4>
          </div>
        </div>

        {/* Comment footer only if real comment exists */}
        <div className="flex items-center justify-between bg-white px-4 py-2.5">
          <p className="truncate text-xs text-gray-600">
            {flashback.comment ? (
              <span>"{flashback.comment}"</span>
            ) : (
              <span className="text-gray-400">사진 기록</span>
            )}
          </p>
          <div className="flex items-center text-xs font-semibold text-gray-400 transition-colors group-hover:text-rose-500">
            <span>추억</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </section>
  );
}
