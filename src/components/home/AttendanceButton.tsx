import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarCheck2, Loader2 } from "lucide-react";
import { useAttendance } from "../../hooks/useAttendance";

const AttendanceButton = () => {
  const { hasCheckedIn, loading, checkIn } = useAttendance();
  const [actionLoading, setActionLoading] = useState(false);

  const handleCheckIn = async () => {
    if (hasCheckedIn || actionLoading) return;
    setActionLoading(true);
    const success = await checkIn();
    if (!success) {
      alert("출석체크 실패");
    }
    setActionLoading(false);
  };

  if (loading || hasCheckedIn) return null;

  return (
    <div className="px-6 mb-8">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleCheckIn}
        disabled={hasCheckedIn || actionLoading}
        className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md ${
          hasCheckedIn 
            ? "bg-gray-50 text-gray-300 shadow-none border border-gray-100/50" 
            : "bg-rose-400 text-white shadow-rose-100 hover:bg-rose-500"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : hasCheckedIn ? (
          <>
            <CheckCircle2 size={16} />
            <span className="text-[12px] font-bold tracking-tight">오늘 출석 완료</span>
          </>
        ) : (
          <>
            <CalendarCheck2 size={16} />
            <span className="text-[12px] font-bold tracking-tight">오늘의 출석체크 (+50 PT)</span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default AttendanceButton;
