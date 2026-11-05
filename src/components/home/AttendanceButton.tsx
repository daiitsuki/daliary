import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { useAttendance } from "../../hooks";
import { useToast } from "../../context/ToastContext";

const AttendanceButton = () => {
  const { hasCheckedIn, loading, checkIn } = useAttendance();
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const handleCheckIn = async () => {
    if (hasCheckedIn || actionLoading) return;
    setActionLoading(true);
    try {
      const success = await checkIn();
      if (success) {
        showToast("오늘의 출석체크가 완료되었어요.", "success");
      } else {
        showToast("출석체크에 실패했어요.", "error");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      showToast("출석체크 중 오류가 발생했어요.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;

  return (
    <AnimatePresence>
      {!hasCheckedIn && (
        <motion.div
          initial={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCheckIn}
            disabled={actionLoading}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all bg-rose-400 text-white shadow-sm shadow-rose-100 hover:bg-rose-500 font-bold text-xs"
          >
            {actionLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <CalendarCheck2 size={16} />
                <span>오늘의 출석체크 (+50 PT)</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceButton;
