import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Heart,
  Unlock,
  Lock,
  History,
  Send,
  Loader2,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import QuestionHistoryModal from "./QuestionHistoryModal";
import BaseModal from "../common/BaseModal";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../context/ToastContext";

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
  partnerProfile?: any;
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
  partnerProfile,
}) => {
  const { showToast } = useToast();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const bothAnswered = !!(myAnswer && partnerAnswer);
  const partnerNickname = partnerProfile?.nickname || "상대방";

  const handleRequestAnswer = async () => {
    if (!coupleId || !currentUserId || isRequesting) return;

    const cooldownKey = `last_answer_request_${coupleId}_${currentUserId}`;
    const lastRequestTime = localStorage.getItem(cooldownKey);
    if (lastRequestTime) {
      const timeDiff = Date.now() - parseInt(lastRequestTime, 10);
      if (timeDiff < 5 * 60 * 1000) {
        showToast("이미 알림을 보냈어요. 잠시 후 다시 시도해주세요.", "error");
        return;
      }
    }

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

        localStorage.setItem(cooldownKey, Date.now().toString());
        showToast("오늘의 질문에 답변하라는 알림을 보냈어요!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("알림 보내기에 실패했어요.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleShareOption = async (option: "my" | "partner" | "both") => {
    setIsShareMenuOpen(false);
    setIsSharing(true);
    showToast("이미지를 생성 중입니다...", "info");

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas not supported");

      const width = 800;

      const wrapText = (
        context: CanvasRenderingContext2D,
        text: string,
        maxW: number,
      ) => {
        const lines: string[] = [];
        let currentLine = "";
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === "\n") {
            lines.push(currentLine);
            currentLine = "";
            continue;
          }
          const testLine = currentLine + char;
          if (
            context.measureText(testLine).width > maxW &&
            currentLine !== ""
          ) {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      ctx.font = "bold 32px sans-serif";
      const maxWidth = width - 120;
      const titleLines = wrapText(ctx, `"${todayQuestion.content}"`, maxWidth);
      const titleHeight = titleLines.length * 44;

      ctx.font = "500 24px sans-serif";
      const answerMaxWidth = width - 160;
      let myLines: string[] = [];
      let partnerLines: string[] = [];

      if (option === "my" || option === "both") {
        myLines = wrapText(ctx, myAnswer.content, answerMaxWidth);
      }
      if (option === "partner" || option === "both") {
        partnerLines = wrapText(ctx, partnerAnswer.content, answerMaxWidth);
      }

      const myHeight = myLines.length * 36 + 60;
      const partnerHeight = partnerLines.length * 36 + 60;

      let totalHeight = 120 + titleHeight + 60;
      if (option === "both") {
        totalHeight += myHeight + 80 + partnerHeight;
      } else if (option === "my") {
        totalHeight += myHeight;
      } else {
        totalHeight += partnerHeight;
      }
      totalHeight += 100;

      canvas.width = width;
      canvas.height = totalHeight;

      ctx.fillStyle = "#fff1f2";
      ctx.fillRect(0, 0, width, totalHeight);

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      const r = 32;
      const x = 40;
      const y = 40;
      const w = width - 80;
      const h = totalHeight - 80;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      titleLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, 120 + index * 44);
      });

      let currentY = 120 + titleHeight + 60;

      const drawAnswerBox = (
        label: string,
        lines: string[],
        bgColor: string,
        textColor: string,
      ) => {
        ctx.textAlign = "left";
        const boxHeight = lines.length * 36 + 60;
        const boxWidth = answerMaxWidth + 60;
        const bx = (width - boxWidth) / 2;
        const by = currentY;

        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(label, bx + 10, by - 15);

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx, by, boxWidth, boxHeight, 20);
        } else {
          ctx.rect(bx, by, boxWidth, boxHeight);
        }
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = "500 24px sans-serif";
        ctx.textBaseline = "middle";
        
        const textStartY = by + boxHeight / 2 - ((lines.length - 1) * 36) / 2;

        lines.forEach((line, idx) => {
          ctx.fillText(line, bx + 30, textStartY + idx * 36);
        });
        
        ctx.textBaseline = "alphabetic";

        currentY += boxHeight + 80;
      };

      if (option === "my" || option === "both") {
        drawAnswerBox("나의 답변", myLines, "#fff1f2", "#1f2937");
      }
      if (option === "partner" || option === "both") {
        drawAnswerBox(
          `${partnerNickname}의 답변`,
          partnerLines,
          "#f3f4f6",
          "#374151",
        );
      }

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Blob creation failed");
        const file = new File([blob], "answer.png", { type: "image/png" });

        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              title: "달이어리 질문",
              text: `📝 오늘의 질문: "${todayQuestion.content}"`,
              files: [file],
            });
            showToast("공유되었습니다.", "success");
          } catch (e) {
            console.error(e);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "answer.png";
          a.click();
          URL.revokeObjectURL(url);
          showToast("기기에 이미지가 저장되었습니다.", "success");
        }
        setIsSharing(false);
      }, "image/png");
    } catch (err) {
      console.error(err);
      showToast("이미지 생성에 실패했습니다.", "error");
      setIsSharing(false);
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
            <div className="absolute top-6 right-6 flex items-center gap-2 z-19">
              <button
                disabled={isSharing}
                onClick={() => setIsShareMenuOpen(true)}
                className="w-6.5 h-6.5 flex items-center justify-center bg-gray-50/80 hover:bg-rose-50 text-gray-300 hover:text-rose-400 rounded-full transition-all active:scale-90 border border-gray-100/50 disabled:opacity-50"
                title="공유하기"
              >
                <Share2 size={13} />
              </button>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="w-6.5 h-6.5 flex items-center justify-center bg-gray-50/80 hover:bg-rose-50 text-gray-300 hover:text-rose-400 rounded-full transition-all active:scale-90 border border-gray-100/50"
                title="지난 기록 보기"
              >
                <History size={14} />
              </button>
            </div>

            <div className="relative z-10">
              <div className="flex gap-3 mb-4 pr-16">
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
                    <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5 pl-1">
                      <Smile size={11} className="text-rose-300" /> 나의 답변
                    </p>
                    <div className="bg-rose-50/40 p-4 rounded-2xl rounded-tl-none text-gray-700 text-[13px] font-medium leading-relaxed border border-rose-100/30 shadow-sm">
                      {myAnswer.content}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-2.5 pl-1">
                      <p className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5">
                        <Heart size={11} className="text-gray-300" />
                        {partnerNickname}의 답변
                      </p>
                      {bothAnswered && (
                        <div className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest flex items-center gap-1 border bg-green-50 text-green-500 border-green-100">
                          <Unlock size={8} />
                          OPENED
                        </div>
                      )}
                    </div>

                    {bothAnswered ? (
                      <div className="bg-gray-50/80 p-4 rounded-2xl rounded-tr-none text-gray-600 text-[13px] font-medium leading-relaxed border border-gray-100/50 italic shadow-sm">
                        "{partnerAnswer?.content}"
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-2xl">
                        <p className="text-[12px] text-gray-400 font-medium mb-3 tracking-tight">
                          {partnerNickname}님의 답변을 기다리고 있어요
                        </p>
                        <button
                          onClick={handleRequestAnswer}
                          disabled={isRequesting}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50/80 text-rose-400 hover:bg-rose-100/80 rounded-full text-[12px] font-semibold transition-colors active:scale-95 disabled:opacity-50"
                        >
                          {isRequesting ? (
                            <Loader2 size={13} className="animate-spin" />
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
        partnerNickname={partnerNickname}
      />

      <BaseModal
        isOpen={isShareMenuOpen}
        onClose={() => setIsShareMenuOpen(false)}
        title="어떤 답변을 공유할까요?"
        icon={Share2}
        contentClassName="p-6 pb-8 md:pb-6 flex flex-col gap-3"
      >
        <button
          disabled={!myAnswer}
          onClick={() => handleShareOption("my")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-rose-50/50 hover:bg-rose-100/60 transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-rose-50/50 disabled:active:scale-100 border border-rose-100"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Smile size={20} className="text-rose-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-[15px]">
              내 답변 공유하기
            </p>
          </div>
        </button>

        <button
          disabled={!partnerAnswer || !bothAnswered}
          onClick={() => handleShareOption("partner")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-gray-50 disabled:active:scale-100 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Heart size={20} className="text-gray-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-[15px]">
              {partnerNickname}님의 답변 공유하기
            </p>
          </div>
        </button>

        <button
          disabled={!bothAnswered}
          onClick={() => handleShareOption("both")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 hover:bg-indigo-100/60 transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-indigo-50/50 disabled:active:scale-100 border border-indigo-100"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ImageIcon size={20} className="text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-[15px]">
              두 답변 모두 공유하기
            </p>
          </div>
        </button>
      </BaseModal>
    </section>
  );
};

export default DailyQuestionSection;
