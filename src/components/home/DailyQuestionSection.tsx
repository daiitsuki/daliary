import { motion, AnimatePresence } from "framer-motion";
import { Smile, Heart, Unlock, Lock, History, Send, Loader2 } from "lucide-react";
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
      // 상대방 ID 찾기
      const { data: partner } = await supabase
        .from('profiles')
        .select('id')
        .eq('couple_id', coupleId)
        .neq('id', currentUserId)
        .maybeSingle();

      if (partner) {
        const { error } = await supabase.from('notifications').insert({
          user_id: partner.id,
          couple_id: coupleId,
          type: 'question_request',
          title: '답변 요청',
          content: `${myProfile?.nickname || '상대방'}님이 오늘의 질문에 답변하라고 요청했어요!`
        });
        
        if (error) throw error;
        alert('상대방에게 답변 요청 알림을 보냈습니다!');
      }
    } catch (err) {
      console.error(err);
      alert('알림 보내기 실패');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
          오늘의 질문
        </h2>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-rose-400 transition-all bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm"
        >
          <History size={10} />
          지난 기록
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!myAnswer ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50/30 rounded-full blur-2xl" />
            
            <p className="relative z-10 text-gray-800 font-bold text-[14px] mb-5 leading-tight tracking-tight pr-4">
              Q. {todayQuestion?.content || "로딩 중..."}
            </p>
            <textarea
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              placeholder="서로에게 들려주고 싶은 대답을 남겨주세요..."
              className="w-full bg-gray-50/50 p-4 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none min-h-[100px] mb-4 text-[13px] font-medium placeholder:text-gray-300 transition-all"
            />
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !todayQuestion}
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-[13px] transition-all disabled:opacity-30 active:scale-[0.98] shadow-lg shadow-gray-200"
            >
              {isSubmitting ? "저장하는 중..." : "답변 완료"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden"
          >
            <div className="mb-6">
              <p className="text-gray-800 font-bold text-[14px] leading-tight tracking-tight">
                Q. {todayQuestion?.content}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <p className="text-[9px] text-rose-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 pl-1">
                  <Smile size={10} className="text-rose-300" /> My Answer
                </p>
                <div className="bg-rose-50/40 p-4 rounded-2xl rounded-tl-none text-gray-700 text-[13px] font-medium leading-relaxed border border-rose-100/30">
                  {myAnswer.content}
                </div>
              </div>

              <div className="pt-5 border-t border-gray-50/80">
                <div className="flex items-center justify-between mb-2.5 pl-1">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <Heart size={10} className="text-gray-300" /> Partner's Answer
                  </p>
                  <div
                    className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest flex items-center gap-1 shadow-sm border ${bothAnswered ? "bg-green-50 text-green-500 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}
                  >
                    {bothAnswered ? <Unlock size={8} /> : <Lock size={8} />}
                    {bothAnswered ? "OPENED" : "LOCKED"}
                  </div>
                </div>

                {bothAnswered ? (
                  <div className="bg-gray-50/80 p-4 rounded-2xl rounded-tr-none text-gray-600 text-[13px] font-medium leading-relaxed border border-gray-100/50 italic">
                    "{partnerAnswer?.content}"
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-100">
                    <p className="text-[12px] text-gray-300 font-medium italic mb-4">
                      상대방의 답변을 기다리고 있어요
                    </p>
                    {myAnswer && (
                      <button
                        onClick={handleRequestAnswer}
                        disabled={isRequesting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-100 text-rose-400 rounded-full text-[11px] font-bold shadow-sm hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isRequesting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        답변 요청하기
                      </button>
                    )}
                  </div>
                )}
              </div>
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