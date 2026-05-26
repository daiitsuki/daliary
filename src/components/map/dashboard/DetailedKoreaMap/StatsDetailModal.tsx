import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, MapPin, ChevronRight } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 뒤로가기 시 모달 닫기 로직 (앱 공통 모달 규정 준수)
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "statsDetail" }, "");
      
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "statsDetail") {
          onClose();
        }
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "statsDetail") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  // Compute data for modal content
  const data = React.useMemo(() => {
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

  const maxCount = React.useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const totalVisits = React.useMemo(() => {
    if (selectedProvince) {
      return data.reduce((sum, item) => sum + item.count, 0);
    } else {
      return Object.values(stats).reduce((sum, count) => sum + count, 0);
    }
  }, [data, stats, selectedProvince]);

  const visitedCount = React.useMemo(() => {
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

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/50 rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[80vh] md:max-h-[75vh] overflow-hidden transform-gpu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-white/20 bg-white/40 backdrop-blur-md shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                  {selectedProvince ? `${selectedProvince} 방문 현황` : "전국 방문 현황"}
                </h2>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                  {selectedProvince 
                    ? `방문한 지역: ${visitedCount}곳 (총 ${totalVisits}회)` 
                    : `방문한 시·도: ${visitedCount}개 지역 (총 ${totalVisits}곳)`
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl hover:bg-white/60 text-gray-400 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* List Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-3 custom-scrollbar bg-white flex-1">
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StatsDetailModal;
