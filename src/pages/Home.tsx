import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Copy, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useHomeData } from "../hooks/useHomeData";
import { useCouplePoints } from "../hooks/useCouplePoints";

// Sub Components
import HomeHeader from "../components/home/HomeHeader";
import HeartGauge from "../components/home/HeartGauge";
import AttendanceButton from "../components/home/AttendanceButton";
import DailyQuestionSection from "../components/home/DailyQuestionSection";
import QuickLinksSection from "../components/home/QuickLinksSection";

export default function Home() {
  const {
    couple,
    currentUserId,
    loading,
    dDay,
    todayQuestion,
    partnerProfile,
    myProfile,
    myAnswer,
    partnerAnswer,
    refresh,
  } = useHomeData();

  const { refresh: refreshPoints } = useCouplePoints();

  const [inputAnswer, setInputAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = async () => {
    if (!inputAnswer.trim() || !couple || !currentUserId || !todayQuestion)
      return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("answers").insert({
        couple_id: couple.id,
        question_id: todayQuestion.id,
        writer_id: currentUserId,
        content: inputAnswer,
      });
      if (error) throw error;

      setInputAnswer("");
      // 데이터 즉시 갱신
      await refresh();
      refreshPoints();
    } catch (err) {
      alert("답변 저장 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code);
      alert("초대 코드가 복사되었습니다!");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F9F9FB]" />;

  // Stagger Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="flex-1 bg-[#FDFDFE] text-gray-800 pb-24 overflow-y-auto custom-scrollbar relative">
      <HomeHeader
        myProfile={myProfile}
        partnerProfile={partnerProfile}
        dDay={dDay}
        couple={couple}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-xl mx-auto space-y-2"
      >
        <motion.div variants={itemVariants}>
          <HeartGauge />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AttendanceButton />
        </motion.div>

        <main className="px-6 space-y-12 pb-10">
          {/* Invite Code Section (Partner missing case) */}
          {!partnerProfile && couple?.invite_code && (
            <motion.div variants={itemVariants}>
              <div className="bg-white border border-rose-100/50 rounded-[38px] p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                  <Sparkles size={100} className="text-rose-400" />
                </div>
                <h3 className="text-gray-800 text-lg font-black mb-1">
                  초대 코드를 공유해보세요!
                </h3>
                <p className="text-gray-400 text-[11px] font-bold mb-6 uppercase tracking-widest">
                  둘만의 다이어리를 시작할 시간
                </p>
                <button
                  onClick={copyInviteCode}
                  className="bg-rose-50/50 rounded-[22px] px-6 py-4 flex items-center justify-center space-x-3 mx-auto hover:bg-rose-50 transition-all w-full group border border-rose-100/30"
                >
                  <span className="text-xl font-mono font-black text-rose-400 tracking-[0.2em]">
                    {couple.invite_code}
                  </span>
                  <Copy
                    size={16}
                    className="text-rose-300 group-hover:text-rose-400 transition-colors"
                  />
                </button>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <DailyQuestionSection
              todayQuestion={todayQuestion}
              myAnswer={myAnswer}
              partnerAnswer={partnerAnswer}
              inputAnswer={inputAnswer}
              setInputAnswer={setInputAnswer}
              isSubmitting={isSubmitting}
              onSubmit={handleAnswerSubmit}
              coupleId={couple?.id}
              currentUserId={currentUserId}
              couple={couple}
              myProfile={myProfile}
            />
          </motion.div>

          {/* Quick Links Section */}
          <motion.div variants={itemVariants}>
            <QuickLinksSection />
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
