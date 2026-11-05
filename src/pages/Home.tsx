import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "../constants/animations";
import { Copy } from "lucide-react";
import { useHomeData } from "../hooks";

// Sub Components
import HomeHeader from "../components/home/HomeHeader";
import TodayScheduleCard from "../components/home/TodayScheduleCard";
import MemoryFlashbackCard from "../components/home/MemoryFlashbackCard";
import DailyQuestionMiniCard from "../components/home/DailyQuestionMiniCard";
import AttendanceButton from "../components/home/AttendanceButton";
import { useToast } from "../context/ToastContext";
import { HomeHeaderSkeleton } from "../components/home/HomeSkeletons";

export default function Home() {
  const { couple, loading, partnerProfile } = useHomeData();
  const { showToast } = useToast();

  const copyInviteCode = () => {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code);
      showToast("초대 코드가 복사되었어요.", "success");
    }
  };

  return (
    <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-[#FDFDFE] pb-24 text-gray-800">
      {loading ? <HomeHeaderSkeleton /> : <HomeHeader />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-xl space-y-0 pt-2"
      >
        <main className="space-y-0 pb-4">
          {/* Partner missing case */}
          {!loading && !partnerProfile && couple?.invite_code && (
            <motion.div variants={itemVariants} className="mb-6 px-6">
              <div className="rounded-[24px] border border-gray-100 bg-white p-6 text-center shadow-xs">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  초대 코드를 공유해보세요
                </h3>
                <p className="mb-4 text-xs text-gray-400">
                  상대방이 코드를 입력하면 둘만의 공간이 열립니다
                </p>
                <button
                  type="button"
                  onClick={copyInviteCode}
                  className="mx-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-50 px-5 py-3 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-mono text-lg font-bold tracking-widest text-rose-500">
                    {couple.invite_code}
                  </span>
                  <Copy size={15} className="text-gray-400" />
                </button>
              </div>
            </motion.div>
          )}

          {/* 1. Attendance Button (출석 시 부드럽게 높이가 0으로 축소되며 사라짐) */}
          <motion.div variants={itemVariants} className="px-6 mb-4">
            <AttendanceButton />
          </motion.div>

          {/* 2. Today's Schedules */}
          <motion.div variants={itemVariants}>
            <TodayScheduleCard />
          </motion.div>

          {/* 3. Flashback Memory Photo Card */}
          <motion.div variants={itemVariants}>
            <MemoryFlashbackCard />
          </motion.div>

          {/* 4. Daily Question & Drawing Micro Card (Inline Accordion) */}
          <motion.div variants={itemVariants}>
            <DailyQuestionMiniCard />
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
