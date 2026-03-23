import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Heart,
  Unlock,
  Lock,
  History,
  Send,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import QuestionHistoryModal from "./QuestionHistoryModal";
import { supabase } from "../../lib/supabase";

interface DailyQuestionSectionProps {
  todayQuestion: any;
  myAnswer: any;
  partnerAnswer: any;
  inputAnswer: string;
  setInputAnswer: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  coupleId: string | undefined;
  currentUserId: string | null;
  couple?: any;
  myProfile?: any;
}

const DailyQuestionSection: React.FC<DailyQuestionSectionProps> = ({
  todayQuestion,
  myAnswer,
  partnerAnswer,
  inputAnswer,
  setInputAnswer,
  isSubmitting,
  onSubmit,
  coupleId,
  currentUserId,
  couple,
  myProfile,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const bothAnswered = !!(myAnswer && partnerAnswer);

  const handleRequestAnswer = async () => {
    if (!coupleId || !currentUserId || isRequesting) return;

    setIsRequesting(true);
    try {
      const { data: partner } = await supabase
        .from("profiles")
        .select("id")
        .eq("couple_id", coupleId)
        .neq("id", currentUserId)
        .maybeSingle();

      if (partner) {
        const { error } = await supabase.from("notifications").insert({
          user_id: partner.id,
          couple_id: coupleId,
          type: "question_request",
          title: "답변 요청",
          content: `${myProfile?.nickname || "상대방"}님이 오늘의 질문에 답변하라고 요청했어요!`,
        });

        if (error) throw error;
        alert("상대방에게 답변 요청 알림을 보냈습니다!");
      }
    } catch (err) {
      console.error(err);
      alert("알림 보내기 실패");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <section className="px-6 mb-6">
      <AnimatePresence mode="wait">
        {!todayQuestion ? (
          <motion.div
            key="no-question"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden"
          >
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-50/30 rounded-full blur-3xl" />
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-300">
              <Lock size={20} />
            </div>
            <p className="text-gray-500 font-bold text-[14px]">
              아직 오늘의 질문이 준비되지 않았어요.
            </p>
            <p className="text-gray-400 text-[12px]">
              새로운 질문을 기다려주세요!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={myAnswer ? "result" : "input"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden group"
          >
            {/* Floating History Action */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="absolute top-6 right-6 w-6.5 h-6.5 flex items-center justify-center bg-gray-50/80 hover:bg-rose-50 text-gray-300 hover:text-rose-400 rounded-full transition-all active:scale-90 border border-gray-100/50 z-19"
              title="지난 기록 보기"
            >
              <History size={14} />
            </button>

            <div className="relative z-10">
              <div className="flex gap-3 mb-4 pr-10 ">
                <span className="text-3xl font-black text-rose-200/60 leading-none select-none italic">
                  Q.
                </span>
                <p className="text-gray-800 font-bold text-[14px] leading-relaxed tracking-tight pt-1">
                  {todayQuestion.content}
                </p>
              </div>

              {!myAnswer ? (
                <div className="relative group/input">
                  <textarea
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    placeholder="서로에게 들려주고 싶은 대답을 남겨주세요..."
                    className="w-full bg-gray-50/50 p-4 pb-12 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none min-h-[120px] text-[13px] font-medium placeholder:text-gray-300 transition-all border border-transparent focus:border-rose-100 shadow-inner custom-scrollbar"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      onClick={onSubmit}
                      disabled={isSubmitting || !inputAnswer.trim()}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-center shadow-md active:scale-90 disabled:opacity-30 disabled:scale-100 disabled:shadow-none ${
                        inputAnswer.trim()
                          ? "bg-rose-400 text-white shadow-rose-200/50"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send
                          size={16}
                          fill={inputAnswer.trim() ? "currentColor" : "none"}
                        />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[9px] text-rose-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 pl-1">
                      <Smile size={10} className="text-rose-300" /> My Answer
                    </p>
                    <div className="bg-rose-50/40 p-4 rounded-2xl rounded-tl-none text-gray-700 text-[13px] font-medium leading-relaxed border border-rose-100/30 shadow-sm">
                      {myAnswer.content}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-2.5 pl-1">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1.5">
                        <Heart size={10} className="text-gray-300" /> Partner's
                        Answer
                      </p>
                      <div
                        className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest flex items-center gap-1 border ${bothAnswered ? "bg-green-50 text-green-500 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}
                      >
                        {bothAnswered ? <Unlock size={8} /> : <Lock size={8} />}
                        {bothAnswered ? "OPENED" : "LOCKED"}
                      </div>
                    </div>

                    {bothAnswered ? (
                      <div className="bg-gray-50/80 p-4 rounded-2xl rounded-tr-none text-gray-600 text-[13px] font-medium leading-relaxed border border-gray-100/50 italic shadow-sm">
                        "{partnerAnswer?.content}"
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-100">
                        <p className="text-[12px] text-gray-300 font-medium italic mb-4">
                          상대방의 답변을 기다리고 있어요
                        </p>
                        <button
                          onClick={handleRequestAnswer}
                          disabled={isRequesting}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-rose-100 text-rose-400 rounded-full text-[11px] font-bold shadow-sm hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isRequesting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          답변 요청하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        coupleId={coupleId}
        currentUserId={currentUserId}
        createdAt={couple?.created_at}
      />
    </section>
  );
};

export default DailyQuestionSection;
