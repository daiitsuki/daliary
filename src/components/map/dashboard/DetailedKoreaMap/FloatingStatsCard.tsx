import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Trophy } from "lucide-react";
import { CurrentStats } from "./types";

interface FloatingStatsCardProps {
  selectedProvince: string | null;
  currentStats: CurrentStats;
  onTopRegionClick: () => void;
}

const FloatingStatsCard: React.FC<FloatingStatsCardProps> = ({
  selectedProvince,
  currentStats,
  onTopRegionClick,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedProvince || "global"}
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -20, x: 20 }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xl z-20 flex flex-col gap-2 sm:gap-3 min-w-[140px] sm:min-w-[160px]"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
            <MapPin size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
              {currentStats.label} 방문
            </p>
            <p className="text-sm sm:text-base font-black text-gray-900 leading-none">
              {currentStats.total}<span className="text-[10px] sm:text-xs ml-0.5 font-bold text-gray-500">곳</span>
            </p>
          </div>
        </div>
        
        {currentStats.topName && (
          <button
            onClick={onTopRegionClick}
            className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-100 text-left w-full"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm">
              <Trophy size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                최다 방문
              </p>
              <p className="text-sm sm:text-base font-black text-gray-900 leading-none truncate max-w-[80px] sm:max-w-[100px]">
                {currentStats.topName}
              </p>
            </div>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingStatsCard;
