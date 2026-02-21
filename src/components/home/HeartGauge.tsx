import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { useCouplePoints } from "../../hooks/useCouplePoints";
import { useAttendance } from "../../hooks/useAttendance";
import PointHistoryModal from "./PointHistoryModal";

const HeartGauge = () => {
  const { totalPoints, currentPoints, history, levelInfo, loading } =
    useCouplePoints();
  const { hasCheckedIn } = useAttendance();
  const [showHistory, setShowHistory] = useState(false);
  const [initialTab, setInitialTab] = useState<"history" | "guide" | "shop">(
    "history",
  );

  if (loading || !levelInfo) return null;

  const handleOpenModal = (tab: "history" | "guide" | "shop") => {
    setInitialTab(tab);
    setShowHistory(true);
  };

  return (
    <div className="px-6 mb-8">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 cursor-pointer group relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-50/50 rounded-full blur-3xl" />

        <div
          onClick={() => handleOpenModal("history")}
          className="relative z-10"
        >
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-3 rounded-[18px] shadow-sm">
                <Sparkles size={18} className="text-rose-400" />
              </div>
              <div>
                <p
                  className={`text-[9px] font-bold uppercase tracking-[0.15em] leading-none mb-1.5 ${hasCheckedIn ? "text-rose-400" : "text-gray-300"}`}
                >
                  {hasCheckedIn ? "● 출석체크 완료" : "○ 출석체크 안함"}
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-800 tracking-tight">
                    Level {levelInfo.level}
                  </h3>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-lg font-bold text-rose-500 mb-0.5 tracking-tighter">
                {Math.round(levelInfo.progress)}
                <span className="text-[10px] ml-0.5">%</span>
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {levelInfo.currentExp} / {levelInfo.nextLevelExp} PT
              </p>
            </div>
          </div>

          {/* Gauge Bar */}
          <div className="w-full h-2.5 bg-gray-50/80 rounded-full overflow-hidden border border-gray-100/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-rose-300 via-rose-400 to-rose-500 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.2)]"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-gray-500 font-medium">
              누적{" "}
              <span className="text-rose-400 font-bold">{totalPoints}</span> PT
              · 다음 레벨까지{" "}
              <span className="text-gray-800 font-bold">
                {levelInfo.nextLevelExp - levelInfo.currentExp}
              </span>{" "}
              PT
            </p>
            <div className="bg-gray-50 p-1.5 rounded-full group-hover:bg-rose-50 transition-colors">
              <ChevronRight
                size={14}
                className="text-gray-300 group-hover:text-rose-300 transition-colors"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <PointHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        currentPoints={currentPoints}
        history={history}
        initialTab={initialTab}
      />
    </div>
  );
};

export default HeartGauge;
