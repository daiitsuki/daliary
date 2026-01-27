import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Copy, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useHomeData } from "../hooks/useHomeData";

// Sub Components
import HomeHeader from "../components/home/HomeHeader";
import HeartGauge from "../components/home/HeartGauge";
import AttendanceButton from "../components/home/AttendanceButton";
import DailyQuestionSection from "../components/home/DailyQuestionSection";
import RecentDiarySection from "../components/home/RecentDiarySection";

export default function Home() {
  const {
    couple,
    currentUserId,
    loading,
    dDay,
    recentDiary,
    todayQuestion,
    partnerProfile,
    myProfile,
    myAnswer,
    partnerAnswer,
    refresh,
  } = useHomeData();

  const [inputAnswer, setInputAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = async () => {
    if (!inputAnswer.trim() || !couple || !currentUserId || !todayQuestion) return;
    
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
      refresh();
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="flex-1 bg-[#F9F9FB] text-gray-800 pb-24 overflow-y-auto custom-scrollbar relative">
      <HomeHeader 
        currentUserId={currentUserId}
        myProfile={myProfile}
        partnerProfile={partnerProfile}
        dDay={dDay}
        couple={couple}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-xl mx-auto"
      >
        <motion.div variants={itemVariants}>
          <HeartGauge />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AttendanceButton />
        </motion.div>

        <main className="px-6 space-y-10">
          {/* Invite Code Section (Partner missing case) */}
          {!partnerProfile && couple?.invite_code && (
            <motion.div variants={itemVariants}>
              <div className="bg-white border border-gray-100 rounded-[32px] p-8 text-center shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                  <Sparkles size={100} className="text-rose-400" />
                </div>
                <h3 className="text-gray-800 text-lg font-black mb-1">우리만의 공간을 완성하세요</h3>
                <p className="text-gray-400 text-[11px] font-bold mb-6 uppercase tracking-widest">Share this code with your partner</p>
                <button
                  onClick={copyInviteCode}
                  className="bg-gray-50 rounded-2xl px-6 py-4 flex items-center justify-center space-x-3 mx-auto hover:bg-rose-50 transition-all w-full group border border-gray-100"
                >
                  <span className="text-xl font-mono font-black text-rose-400 tracking-[0.2em]">{couple.invite_code}</span>
                  <Copy size={16} className="text-gray-300 group-hover:text-rose-300 transition-colors" />
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
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <RecentDiarySection recentDiary={recentDiary} />
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
