import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  CalendarCheck2,
  Loader2,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { useCouplePoints } from "../../hooks/useCouplePoints";
import { useAttendance } from "../../hooks/useAttendance";
import PointHistoryModal from "./PointHistoryModal";

const HeartGauge = () => {
  const { totalPoints, currentPoints, history, levelInfo, loading } =
    useCouplePoints();
  const { hasCheckedIn, checkIn } = useAttendance();
  const [showHistory, setShowHistory] = useState(false);
  const [initialTab, setInitialTab] = useState<"history" | "guide" | "shop">(
    "history",
  );
  const [actionLoading, setActionLoading] = useState(false);

  if (loading || !levelInfo) return null;

  const handleOpenModal = (tab: "history" | "guide" | "shop") => {
    setInitialTab(tab);
    setShowHistory(true);
  };

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCheckedIn || actionLoading) return;
    setActionLoading(true);
    const success = await checkIn();
    if (!success) {
      alert("출석체크 실패");
    }
    setActionLoading(false);
  };

  return (
    <div className="px-6 mb-6">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 cursor-pointer group relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-50/50 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div
            onClick={() => handleOpenModal("history")}
            className="flex justify-between items-end mb-2"
          >
            <div className="flex items-center gap-3.5">
              <Heart className="text-rose-400 fill-rose-400" size={16} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-800 tracking-tight">
                    Lv. {levelInfo.level}
                  </h3>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-rose-500">
                {Math.round(levelInfo.progress)}
                <span className="text-xs ml-0.5">%</span>
              </p>
            </div>
          </div>

          {/* Gauge Bar */}
          <div
            onClick={() => handleOpenModal("history")}
            className="w-full h-7 bg-gray-50/80 rounded-full overflow-hidden border border-gray-100/50 mb-3 relative"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-rose-300 via-rose-400 to-rose-500 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.2)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[11px] text-gray-700 font-bold uppercase tracking-wider">
                {levelInfo.currentExp.toLocaleString()} /{" "}
                {levelInfo.nextLevelExp.toLocaleString()} PT
              </p>
            </div>
          </div>

          {/* Attendance Action Button or Progress Info */}
          {!hasCheckedIn ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full py-3.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-[18px] font-bold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-rose-100/50 mb-4 transition-all"
            >
              {actionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CalendarCheck2 size={16} />
                  오늘의 출석체크 (+50 PT)
                </>
              )}
            </motion.button>
          ) : (
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs text-gray-500 font-medium">
                누적{" "}
                <span className="text-rose-400 font-bold">
                  {totalPoints.toLocaleString()}
                </span>{" "}
                PT
              </p>
              <div className="flex items-center gap-1.5 text-green-500">
                <CheckCircle2 size={12} />
                <span className="text-[11px] font-bold">출석 완료</span>
              </div>
            </div>
          )}

          <div
            onClick={() => handleOpenModal("history")}
            className="flex items-center justify-between  border-t border-gray-50/80 pt-1"
          >
            <span className="text-[11px] text-gray-500 font-semibold tracking-tight">
              포인트 내역 | 상점
            </span>
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
