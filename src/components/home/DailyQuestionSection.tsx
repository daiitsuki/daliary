import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Heart,
  Unlock,
  Lock,
  History,
  Send,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { useState, useEffect } from "react";
import QuestionHistoryModal from "./QuestionHistoryModal";
import BaseModal from "../common/BaseModal";
import Textarea from "../common/Textarea";
import { useHomeData } from "../../hooks";
import { useDailyQuestionActions } from "../../hooks/features/useDailyQuestionActions";
import { useShareAnswerImage } from "../../hooks/features/useShareAnswerImage";

interface DailyQuestionSectionProps {}

const DailyQuestionSection: React.FC<DailyQuestionSectionProps> = () => {
  const {
    todayQuestion,
    myAnswer,
    partnerAnswer,
    couple,
    currentUserId,
    partnerProfile,
  } = useHomeData();
  const { submitAnswer, isSubmitting, requestAnswer, isRequesting } =
    useDailyQuestionActions();
  const { shareImage, isSharing } = useShareAnswerImage();

  const [inputAnswer, setInputAnswer] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const onSubmit = async () => {
    const success = await submitAnswer(inputAnswer);
    if (success) setInputAnswer("");
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("daily_section_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (todayQuestion && parsed.question === todayQuestion.content) {
          return parsed.isExpanded;
        }
      }
    } catch (e) {}
    return true;
  });

  useEffect(() => {
    if (todayQuestion) {
      localStorage.setItem(
        "daily_section_state",
        JSON.stringify({ isExpanded, question: todayQuestion.content }),
      );
    }
  }, [isExpanded, todayQuestion]);

  const bothAnswered = !!(myAnswer && partnerAnswer);
  const partnerNickname = partnerProfile?.nickname || "상대방";

  const handleShareOption = (option: "my" | "partner" | "both") => {
    setIsShareMenuOpen(false);
    shareImage(option);
  };

  const shareOptions = [
    {
      id: "my" as const,
      icon: Smile,
      label: "내 답변 공유하기",
      disabled: !myAnswer,
      colorClass: "text-rose-400",
      bgClass: "bg-rose-50/50",
      hoverClass: "hover:bg-rose-100/60",
      borderClass: "border-rose-100",
    },
    {
      id: "partner" as const,
      icon: Heart,
      label: `${partnerNickname}님의 답변 공유하기`,
      disabled: !partnerAnswer || !bothAnswered,
      colorClass: "text-gray-400",
      bgClass: "bg-gray-50",
      hoverClass: "hover:bg-gray-100/80",
      borderClass: "border-gray-100",
    },
    {
      id: "both" as const,
      icon: ImageIcon,
      label: "두 답변 모두 공유하기",
      disabled: !bothAnswered,
      colorClass: "text-indigo-400",
      bgClass: "bg-indigo-50/50",
      hoverClass: "hover:bg-indigo-100/60",
      borderClass: "border-indigo-100",
    },
  ];

  return (
    <section className="mb-6 px-6">
      <AnimatePresence mode="wait">
        {!todayQuestion ? (
          <motion.div
            key="no-question"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col items-center justify-center space-y-3 overflow-hidden rounded-[32px] border border-rose-50/50 bg-white p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
          >
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-rose-50/30 blur-3xl" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-300">
              <Lock size={20} />
            </div>
            <p className="text-[14px] font-bold text-gray-500">
              아직 오늘의 질문이 준비되지 않았어요.
            </p>
            <p className="text-[12px] text-gray-400">
              새로운 질문을 기다려주세요!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={myAnswer ? "result" : "input"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-[32px] border border-rose-50/50 bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
          >
            <div className="relative z-10">
              <div
                className="group/header flex cursor-pointer items-start justify-between gap-3 px-1 select-none"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className="mt-1 flex gap-3 pr-2">
                  <p className="pt-0.5 pl-2 text-[13px] leading-relaxed font-bold tracking-tight text-gray-800">
                    {todayQuestion.content}
                  </p>
                </div>
                <div className="mt-1 flex shrink-0 items-center gap-1">
                  <div className="rounded-full p-1.5 text-gray-300 transition-colors group-hover/header:bg-rose-50 group-hover/header:text-rose-400">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-1 pt-2 pb-1">
                      {!myAnswer ? (
                        <div className="group/input relative">
                          <Textarea
                            value={inputAnswer}
                            onChange={(e: any) =>
                              setInputAnswer(e.target.value)
                            }
                            placeholder={`${partnerNickname}님에게 들려주고 싶은 대답을 남겨주세요...`}
                            className="min-h-[120px] pb-12 placeholder:text-xs"
                          />
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <button
                              onClick={onSubmit}
                              disabled={isSubmitting || !inputAnswer.trim()}
                              className={`flex items-center justify-center rounded-xl p-2.5 shadow-md transition-all active:scale-90 disabled:scale-100 disabled:opacity-30 disabled:shadow-none ${
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
                                  fill={
                                    inputAnswer.trim() ? "currentColor" : "none"
                                  }
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="flex flex-col gap-1.5">
                            <p className="flex items-center gap-1.5 pl-1 text-[11px] font-bold text-rose-400">
                              <Smile size={11} className="text-rose-300" /> 나의
                              답변
                            </p>
                            <div className="rounded-2xl rounded-tl-none border border-rose-100/30 bg-rose-50/40 p-4 text-[13px] leading-relaxed font-medium text-gray-700 shadow-sm">
                              {myAnswer.content}
                            </div>
                          </div>

                          <div className="border-t border-gray-50 pt-5">
                            <div className="mb-2.5 flex items-center justify-between pl-1">
                              <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                <Heart size={11} className="text-gray-300" />
                                {partnerNickname}의 답변
                              </p>
                              {bothAnswered && (
                                <div className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[8px] font-bold tracking-widest text-green-500">
                                  <Unlock size={8} />
                                  OPENED
                                </div>
                              )}
                            </div>

                            {bothAnswered ? (
                              <div className="rounded-2xl rounded-tr-none border border-gray-100/50 bg-gray-50/80 p-4 text-[13px] leading-relaxed font-medium text-gray-600 italic shadow-sm">
                                "{partnerAnswer?.content}"
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50/30 py-6 text-center">
                                <p className="mb-3 text-[12px] font-medium tracking-tight text-gray-400">
                                  {partnerNickname}님의 답변을 기다리고 있어요
                                </p>
                                <button
                                  onClick={requestAnswer}
                                  disabled={isRequesting}
                                  className="flex items-center gap-1.5 rounded-full bg-rose-50/80 px-4 py-2 text-[12px] font-semibold text-rose-400 transition-colors hover:bg-rose-100/80 active:scale-95 disabled:opacity-50"
                                >
                                  {isRequesting ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Send size={13} />
                                  )}
                                  답변 요청하기
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsHistoryOpen(true);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
                          title="지난 기록 보기"
                          aria-label="지난 기록 보기"
                        >
                          <History size={17} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsShareMenuOpen(true);
                          }}
                          disabled={isSharing || !myAnswer}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50/50 text-rose-400 transition-colors hover:bg-rose-100/60 disabled:opacity-50"
                          title="공유하기"
                          aria-label="공유하기"
                        >
                          <Share2 size={17} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        coupleId={couple?.id}
        currentUserId={currentUserId}
        createdAt={couple?.created_at}
        partnerNickname={partnerNickname}
      />

      <BaseModal
        isOpen={isShareMenuOpen}
        onClose={() => setIsShareMenuOpen(false)}
        title="어떤 답변을 공유할까요?"
        icon={Share2}
        contentClassName="p-6 pb-8 md:pb-6 flex flex-col gap-3"
      >
        {shareOptions.map((opt) => (
          <button
            key={opt.id}
            disabled={opt.disabled}
            onClick={() => handleShareOption(opt.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${opt.borderClass} ${opt.bgClass} ${opt.hoverClass} disabled:hover:${opt.bgClass}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <opt.icon size={20} className={opt.colorClass} />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-gray-800">{opt.label}</p>
            </div>
          </button>
        ))}
      </BaseModal>
    </section>
  );
};

export default DailyQuestionSection;
