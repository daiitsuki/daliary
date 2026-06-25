import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck2,
  Loader2,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { useCouplePoints } from "../../hooks/useCouplePoints";
import { useAttendance } from "../../hooks/useAttendance";
import { useToast } from "../../context/ToastContext";
import PointHistoryModal from "./PointHistoryModal";

const HeartGauge = () => {
  const { totalPoints, currentPoints, history, levelInfo, loading, refresh } =
    useCouplePoints();
  const { hasCheckedIn, checkIn } = useAttendance();
  const { showToast } = useToast();
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
      showToast("출석체크에 실패했어요.", "error");
    } else {
      refresh();
    }
    setActionLoading(false);
  };

  return (
    <div className="px-6 mb-6">
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => handleOpenModal("history")}
        className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-rose-50/50 cursor-pointer group relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Top Row: Level Info & Attendance Button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-rose-50 p-1.5 rounded-full">
                <Heart className="text-rose-400 fill-rose-400" size={14} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight">
                  Lv. {levelInfo.level}
                </h3>
                <span className="text-[11px] font-bold text-rose-500">
                  {Math.round(levelInfo.progress)}%
                </span>
                <span className="text-[10px] font-medium text-gray-400 ml-0.5">
                  ({totalPoints.toLocaleString()} PT)
                </span>
              </div>
            </div>

            {/* Attendance Button or Done Badge */}
            {!hasCheckedIn ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-full font-bold text-[11px] flex items-center gap-1 shadow-sm shadow-rose-200 transition-all"
              >
                {actionLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <CalendarCheck2 size={12} />
                    출석체크
                  </>
                )}
              </motion.button>
            ) : (
              <div className="flex items-center gap-1 text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100/50">
                <CheckCircle2 size={10} />
                <span className="text-[10px] font-bold">출석 완료</span>
              </div>
            )}
          </div>

          {/* Gauge Bar */}
          <div className="w-full h-5 bg-gray-50/80 rounded-full overflow-hidden border border-gray-100/50 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-rose-300 via-rose-400 to-rose-500 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[9px] text-gray-700 font-bold uppercase tracking-wider">
                {levelInfo.currentExp.toLocaleString()} /{" "}
                {levelInfo.nextLevelExp.toLocaleString()} PT
              </p>
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
