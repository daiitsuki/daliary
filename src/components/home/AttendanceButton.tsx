import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarCheck2, Loader2 } from "lucide-react";
import { useAttendance } from "../../hooks/useAttendance";
import { useCouplePoints } from "../../hooks/useCouplePoints";

const AttendanceButton = () => {
  const { hasCheckedIn, loading, checkIn } = useAttendance();
  const { refresh: refreshPoints } = useCouplePoints();
  const [actionLoading, setActionLoading] = useState(false);

  const handleCheckIn = async () => {
    if (hasCheckedIn || actionLoading) return;
    setActionLoading(true);
    const success = await checkIn();
    if (success) {
      // 포인트 데이터 즉시 갱신
      await refreshPoints();
    } else {
      alert("출석체크 실패");
    }
    setActionLoading(false);
  };

  if (loading) return null;

  return (
    <div className="px-6 mb-8">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCheckIn}
        disabled={hasCheckedIn || actionLoading}
        className={`w-full py-4 rounded-[24px] flex items-center justify-center gap-3 transition-all ${
          hasCheckedIn 
            ? "bg-gray-50 text-gray-400 cursor-default" 
            : "bg-white border border-rose-100 text-rose-500 shadow-sm hover:shadow-md"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : hasCheckedIn ? (
          <>
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">오늘의 출석 완료 (+50 PT)</span>
          </>
        ) : (
          <>
            <CalendarCheck2 size={20} />
            <span className="text-sm font-black">오늘의 출석체크하고 50 PT 받기</span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default AttendanceButton;
