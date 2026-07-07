import {
  Smile,
  Heart,
  Lock,
  Unlock,
  Ticket,
  Send,
  History,
} from "lucide-react";
import { useQuestionHistory } from "../../hooks/useQuestionHistory";
import { useCouplePointsContext } from "../../context/CouplePointsContext";
import { supabase } from "../../lib/supabase";
import { useState } from "react";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";

interface QuestionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string | undefined;
  currentUserId: string | null;
  createdAt?: string;
  partnerNickname?: string;
}

export default function QuestionHistoryModal({
  isOpen,
  onClose,
  coupleId,
  currentUserId,
  createdAt,
  partnerNickname = "상대방",
}: QuestionHistoryModalProps) {
  const { history, loading, initialLoading, hasMore, loadMore, refresh } =
    useQuestionHistory(coupleId, currentUserId, createdAt);
  const { items, useItem } = useCouplePointsContext();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(
    null,
  );
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketCount =
    items.find((i) => i.item_type === "past_question_ticket")?.quantity || 0;

  const handleAnswerSubmit = async (questionId: string) => {
    if (!answerText.trim() || !coupleId || !currentUserId) return;

    if (ticketCount <= 0) {
      showToast(
        "보유하신 '지난 질문 답변 티켓'이 없어요. 포인트 상점에서 구매해주세요!",
        "error",
      );
      return;
    }

    const isConfirmed = await confirm({
      title: "티켓 사용",
      message: "티켓 1개를 소모하여 답변할까요?",
      confirmText: "답변하기",
      isDanger: true,
    });

    if (!isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Use ticket
      const useResult = await useItem("past_question_ticket");
      if (!useResult.success) {
        showToast(useResult.error || "티켓 사용에 실패했어요.", "error");
        return;
      }

      // 2. Insert answer
      const { error: insertError } = await supabase.from("answers").insert({
        question_id: questionId,
        couple_id: coupleId,
        writer_id: currentUserId,
        content: answerText.trim(),
      });

      if (insertError) throw insertError;

      showToast("답변이 등록되었어요.", "success");
      setAnsweringQuestionId(null);
      setAnswerText("");
      refresh(); // Refresh history
    } catch (error) {
      console.error("Submit answer error:", error);
      showToast("답변 등록 중 오류가 발생했어요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = (
    <div className="flex items-center gap-2">
      <span>오늘의 질문 아카이브</span>
      {ticketCount > 0 && (
        <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
          <Ticket size={12} className="text-rose-400" />
          <span className="text-[10px] font-black text-rose-500">
            {ticketCount}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={History}
      contentClassName="bg-[#F9F9FB] flex flex-col p-4 space-y-4"
    >
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
          <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">
            기록을 불러오고 있어요...
          </p>
        </div>
      ) : history.filter(
          (item) =>
            item.publish_date !== new Date().toLocaleDateString("en-CA"),
        ).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 py-20">
          <p className="text-gray-400 text-sm font-medium">
            아직 답변한 질문이 없어요.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {history
            .filter(
              (item) =>
                item.publish_date !== new Date().toLocaleDateString("en-CA"),
            )
            .map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-50 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-rose-400 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {item.publish_date}
                  </span>
                  {!item.myAnswer && answeringQuestionId !== item.id && (
                    <button
                      onClick={() => {
                        if (ticketCount <= 0) {
                          showToast(
                            "보유하신 '지난 질문 답변 티켓'이 없어요. 포인트 상점에서 구매해주세요!",
                            "error",
                          );
                          return;
                        }
                        setAnsweringQuestionId(item.id);
                        setAnswerText("");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                        ticketCount > 0
                          ? "bg-rose-500 text-white shadow-sm shadow-rose-100 active:scale-95"
                          : "bg-gray-200 text-gray-400 grayscale opacity-70"
                      }`}
                    >
                      <Ticket size={12} />
                      답변하기
                    </button>
                  )}
                </div>

                <h3 className="text-gray-800 font-bold text-sm leading-tight">
                  Q. {item.content}
                </h3>

                {answeringQuestionId === item.id ? (
                  <div className="space-y-3 pt-2">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="이 질문에 어떤 답을 남길까요?"
                      className="w-full p-4 bg-gray-50 rounded-2xl text-xs border-none focus:ring-2 focus:ring-rose-200 resize-none min-h-[100px] font-medium"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnsweringQuestionId(null)}
                        className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-black active:scale-95 transition-all"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleAnswerSubmit(item.id)}
                        disabled={isSubmitting || !answerText.trim()}
                        className="flex-[2] py-3 bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send size={14} />
                            티켓 사용해서 등록
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {/* My Answer */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <Smile size={11} /> 나의 답변
                      </p>
                      <div className="bg-rose-50/50 p-4 rounded-2xl text-gray-700 text-xs leading-relaxed">
                        {item.myAnswer ? (
                          item.myAnswer.content
                        ) : (
                          <span className="text-gray-300 italic">
                            답변을 남기지 않았습니다.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Partner Answer */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          <Heart size={11} /> {partnerNickname}의 답변
                        </p>
                        {item.myAnswer && item.partnerAnswer ? (
                          <div className="text-[9px] font-bold text-green-400 flex items-center gap-1">
                            <Unlock size={9} /> OPEN
                          </div>
                        ) : item.partnerAnswer ? (
                          <div className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                            <Lock size={9} /> LOCKED
                          </div>
                        ) : null}
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl text-gray-600 text-xs leading-relaxed">
                        {item.myAnswer && item.partnerAnswer ? (
                          item.partnerAnswer.content
                        ) : !item.myAnswer && item.partnerAnswer ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-400 font-bold">
                              내용이 잠겨있습니다.
                            </span>
                            <span className="text-gray-300 text-[10px] italic">
                              상대방이 답변을 완료했습니다! 내용을 보려면 나의
                              답변을 먼저 작성해주세요.
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">
                            {partnerNickname}님이 아직 답변하지 않았습니다.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {hasMore && (
            <Button
              type="button"
              onClick={() => loadMore()}
              disabled={loading}
              variant="secondary"
              className="mt-4"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                "이전 질문 더보기"
              )}
            </Button>
          )}
        </div>
      )}
    </BaseModal>
  );
}
