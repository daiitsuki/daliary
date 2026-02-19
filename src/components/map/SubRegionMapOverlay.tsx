import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { usePlaces, VisitWithPlace } from "../../context/PlacesContext";
import ProvinceMap from "./ProvinceMap";

interface SubRegionMapOverlayProps {
  region: string;
  onBack: () => void;
  onSubRegionClick: (subRegion: string) => void;
  onVisitClick: (visit: VisitWithPlace) => void;
}

const SubRegionMapOverlay: React.FC<SubRegionMapOverlayProps> = ({
  region,
  onBack,
  onSubRegionClick,
}) => {
  const { subRegionStats, visits } = usePlaces();

  const stats = subRegionStats[region] || {};

  // 해당 시/도에 속하지만 시/군/구가 지정되지 않은 방문 기록 개수 확인
  const unassignedCount = useMemo(() => {
    return visits.filter(
      (v) => v.region === region && (!v.sub_region || v.sub_region === ""),
    ).length;
  }, [visits, region]);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between shadow-sm z-10">
        <button
          onClick={onBack}
          className="p-2.5 hover:bg-gray-50 rounded-full transition-colors text-gray-800 -ml-2"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800">{region}</h2>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Content - 지도로 가득 채움 */}
      <div className="flex-1 relative bg-white overflow-hidden">
        <ProvinceMap
          region={region}
          stats={stats}
          onSubRegionClick={onSubRegionClick}
        />

        {/* 상단 안내 문구 */}
        <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-gray-100"
          >
            <p className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              지도를 확대/축소하여 세부 지역을 선택하세요
            </p>
          </motion.div>
        </div>

        {/* 미분류 방문 기록 소형 버튼 (왼쪽 하단 배치) */}
        {unassignedCount > 0 && (
          <div className="absolute bottom-24 left-4">
            <button
              onClick={() => onSubRegionClick("미분류")}
              className="bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-2 rounded-xl shadow-sm flex items-center gap-2 active:scale-[0.95] transition-all group"
            >
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                미분류 기록 ({unassignedCount})
              </span>
              <ChevronRight size={12} className="text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SubRegionMapOverlay;
