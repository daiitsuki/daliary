import { X, Smile, Heart, Lock, Unlock } from "lucide-react";
import { useQuestionHistory } from "../../hooks/useQuestionHistory";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface QuestionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string | undefined;
  currentUserId: string | null;
  createdAt?: string;
}

export default function QuestionHistoryModal({
  isOpen,
  onClose,
  coupleId,
  currentUserId,
  createdAt,
}: QuestionHistoryModalProps) {
  const { history, loading, initialLoading, hasMore, loadMore } = useQuestionHistory(coupleId, currentUserId, createdAt);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 뒤로가기 시 모달 닫기 로직
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "question-history" }, "");
      
      const handlePopState = () => {
        onClose();
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "question-history") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-lg bg-[#F9F9FB] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform-gpu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-800">질문 기록</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  OUR MEMORIES
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar flex-1">
              {initialLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
                  <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">기록을 불러오고 있어요...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 py-20">
                  <p className="text-gray-400 text-sm font-medium">아직 답변한 질문이 없어요.</p>
                </div>
              ) : (
                <>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-50 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-rose-400 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          {item.publish_date}
                        </span>
                      </div>
                      
                      <h3 className="text-gray-800 font-bold text-sm leading-tight">
                        Q. {item.content}
                      </h3>

                      <div className="space-y-4 pt-2">
                        {/* My Answer */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1">
                            <Smile size={10} /> My Answer
                          </p>
                          <div className="bg-rose-50/50 p-4 rounded-2xl text-gray-700 text-xs leading-relaxed">
                            {item.myAnswer ? item.myAnswer.content : (
                              <span className="text-gray-300 italic">답변을 남기지 않았습니다.</span>
                            )}
                          </div>
                        </div>

                        {/* Partner Answer */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1">
                              <Heart size={10} /> Partner's Answer
                            </p>
                            {item.myAnswer && item.partnerAnswer ? (
                              <div className="text-[9px] font-bold text-green-400 flex items-center gap-1">
                                <Unlock size={9} /> OPEN
                              </div>
                            ) : (
                              <div className="text-[9px] font-bold text-gray-300 flex items-center gap-1">
                                <Lock size={9} /> LOCKED
                              </div>
                            )}
                          </div>
                          <div className="bg-gray-50/50 p-4 rounded-2xl text-gray-600 text-xs leading-relaxed">
                            {item.myAnswer && item.partnerAnswer ? (
                              item.partnerAnswer.content
                            ) : !item.myAnswer ? (
                              <span className="text-gray-300 italic">나의 답변을 먼저 작성해야 볼 수 있습니다.</span>
                            ) : (
                              <span className="text-gray-300 italic">상대방이 아직 답변하지 않았습니다.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <button
                      onClick={() => loadMore()}
                      disabled={loading}
                      className="w-full py-4 bg-white border border-gray-100 rounded-[24px] text-xs font-bold text-gray-400 hover:text-rose-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
                      ) : (
                        "이전 질문 더보기"
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 text-center shrink-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {history.length} Questions Loaded
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
