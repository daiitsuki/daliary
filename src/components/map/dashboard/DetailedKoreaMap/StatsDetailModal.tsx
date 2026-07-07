import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, MapPin, ChevronRight, BarChart2 } from "lucide-react";
import BaseModal from "../../../common/BaseModal";

interface StatsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvince: string | null;
  stats: Record<string, number>;
  subRegionStats: Record<string, Record<string, number>>;
  onSelectRegion: (province: string, subRegion?: string) => void;
}

const StatsDetailModal: React.FC<StatsDetailModalProps> = ({
  isOpen,
  onClose,
  selectedProvince,
  stats,
  subRegionStats,
  onSelectRegion,
}) => {
  // Compute data for modal content
  const data = useMemo(() => {
    if (selectedProvince) {
      // Sub-region statistics for a specific province
      const subStats = subRegionStats[selectedProvince] || {};
      return Object.entries(subStats)
        .map(([name, count]) => ({ name, count }))
        .filter((item) => item.count > 0) // Filter only visited sub-regions to keep lists clean
        .sort((a, b) => b.count - a.count);
    } else {
      // Nationwide province statistics
      return Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }
  }, [selectedProvince, stats, subRegionStats]);

  const maxCount = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const totalVisits = useMemo(() => {
    if (selectedProvince) {
      return data.reduce((sum, item) => sum + item.count, 0);
    } else {
      return Object.values(stats).reduce((sum, count) => sum + count, 0);
    }
  }, [data, stats, selectedProvince]);

  const visitedCount = useMemo(() => {
    if (selectedProvince) {
      return data.length;
    } else {
      return Object.values(stats).filter((count) => count > 0).length;
    }
  }, [data, stats, selectedProvince]);

  const handleItemClick = (name: string) => {
    if (selectedProvince) {
      onSelectRegion(selectedProvince, name);
    } else {
      onSelectRegion(name);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedProvince ? `${selectedProvince} 방문 현황` : "전국 방문 현황"}
      subtitle={
        selectedProvince
          ? `방문한 지역: ${visitedCount}곳 (총 ${totalVisits}회)`
          : `방문한 시·도: ${visitedCount}개 지역 (총 ${totalVisits}곳)`
      }
      icon={BarChart2}
      contentClassName="bg-white p-5 sm:p-6 space-y-3"
    >
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 mb-3">
            <MapPin size={20} />
          </div>
          <p className="text-sm font-bold text-gray-500">아직 방문 기록이 없습니다.</p>
          <p className="text-xs text-gray-300 mt-1">지도를 클릭해 첫 방문을 기록해보세요!</p>
        </div>
      ) : (
        data.map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          const isTop = index === 0 && item.count > 0;

          return (
            <button
              key={item.name}
              onClick={() => handleItemClick(item.name)}
              className="w-full text-left flex items-center justify-between p-3.5 rounded-[20px] bg-gray-50/60 border border-gray-100/50 transition-all active:scale-[0.98] active:bg-rose-50/20 group"
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  {isTop ? (
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center text-[10px] font-bold shadow-sm">
                      <Trophy size={11} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-700">{item.name}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`h-full rounded-full ${
                      isTop ? "bg-amber-400" : "bg-rose-400"
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                  {item.count}
                  <span className="text-[10px] ml-0.5 font-normal text-gray-400">
                    {selectedProvince ? "회" : "곳"}
                  </span>
                </span>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </button>
          );
        })
      )}
    </BaseModal>
  );
};

export default StatsDetailModal;
