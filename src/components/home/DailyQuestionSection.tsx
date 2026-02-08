import { motion, AnimatePresence } from "framer-motion";
import { Smile, Heart, Unlock, Lock, History } from "lucide-react";
import { useState } from "react";
import QuestionHistoryModal from "./QuestionHistoryModal";

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
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const bothAnswered = !!(myAnswer && partnerAnswer);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
          오늘의 질문
        </h2>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-rose-400 transition-colors bg-gray-50 px-3 py-1.5 rounded-full"
        >
          <History size={12} />
          기록 보기
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!myAnswer ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 relative overflow-hidden"
          >
            <p className="text-gray-800 font-bold text-sm mb-5 leading-tight tracking-tight">
              Q. {todayQuestion?.content || "로딩 중..."}
            </p>
            <textarea
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              placeholder="여기에 대답을 남겨주세요..."
              className="w-full bg-gray-50/50 p-4 rounded-2xl text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-100 resize-none min-h-[100px] mb-4 text-sm placeholder:text-gray-300"
            />
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !todayQuestion}
              className="w-full py-3.5 bg-gray-800 hover:bg-black text-white rounded-xl font-bold text-sm transition-all disabled:opacity-30"
            >
              {isSubmitting ? "저장 중..." : "답변 완료"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100"
          >
            <div className="mb-6">
              <p className="text-gray-800 font-bold text-base leading-tight tracking-tight">
                Q. {todayQuestion?.content}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Smile size={10} /> My Answer
                </p>
                <div className="bg-rose-50/30 p-4 rounded-2xl text-gray-700 text-sm leading-relaxed">
                  {myAnswer.content}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Heart size={10} /> Partner's Answer
                  </p>
                  <div
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${bothAnswered ? "text-green-400" : "text-gray-300"}`}
                  >
                    {bothAnswered ? <Unlock size={10} /> : <Lock size={10} />}
                    {bothAnswered ? "OPEN" : "LOCKED"}
                  </div>
                </div>

                {bothAnswered ? (
                  <div className="bg-gray-50 p-4 rounded-2xl text-gray-600 text-sm leading-relaxed italic">
                    "{partnerAnswer?.content}"
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-gray-300 font-medium italic">
                      상대방의 답변을 기다리고 있어요
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryOpen && (
          <QuestionHistoryModal
            onClose={() => setIsHistoryOpen(false)}
            coupleId={coupleId}
            currentUserId={currentUserId}
            createdAt={couple?.created_at}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default DailyQuestionSection;