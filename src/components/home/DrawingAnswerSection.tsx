import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { DrawingAnswer, Profile } from "../../types";
import { DrawingCanvas } from "./DrawingCanvas";
import { useToast } from "../../context/ToastContext";
import {
  Lock,
  Unlock,
  Smile,
  Heart,
  Palette,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DrawingAnswerSectionProps {
  drawingQuestion: string;
  myDrawing: DrawingAnswer | null;
  partnerDrawing: DrawingAnswer | null;
  coupleId: string | undefined;
  currentUserId: string | null;
  partnerProfile: Profile | null;
  onComplete: () => Promise<void>;
}

export const DrawingAnswerSection: React.FC<DrawingAnswerSectionProps> = ({
  drawingQuestion,
  myDrawing,
  partnerDrawing,
  coupleId,
  currentUserId,
  partnerProfile,
  onComplete,
}) => {
  const { showToast } = useToast();
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    // 상대방만 그림을 그렸을 때 기본적으로 펼쳐둠
    return !!(partnerDrawing && !myDrawing);
  });

  if (!coupleId || !currentUserId) return null;

  const handleDelete = async () => {
    if (!myDrawing) return;
    if (!confirm("제출한 그림을 삭제하고 다시 그리시겠어요?")) return;

    setIsDeleting(true);
    try {
      // 1. DB 레코드 삭제
      const { error: dbError } = await supabase
        .from("drawing_answers")
        .delete()
        .eq("id", myDrawing.id);

      if (dbError) throw dbError;

      // 2. 스토리지(버킷) 파일 삭제 (찌꺼기 방지)
      const urlParts = myDrawing.image_url.split("/drawings/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split("?")[0];
        await supabase.storage.from("drawings").remove([filePath]);
      }

      showToast("그림이 삭제되었습니다. 다시 그려보세요!", "success");
      await onComplete();
    } catch (error) {
      showToast("삭제에 실패했어요.", "error");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCanvasComplete = async (blob: Blob) => {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(
      now.getTime() + now.getTimezoneOffset() * 60000 + kstOffset,
    );
    const year = kstNow.getFullYear();
    const month = String(kstNow.getMonth() + 1).padStart(2, "0");
    const day = String(kstNow.getDate()).padStart(2, "0");
    const todayDate = `${year}-${month}-${day}`;
    const uniqueId = crypto.randomUUID().split('-')[0]; // ex: 123e4567

    const fileName = `${coupleId}/${todayDate}_${currentUserId}_${uniqueId}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("drawings")
      .upload(fileName, blob, { contentType: "image/webp", upsert: true });

    if (uploadError) {
      showToast("이미지 업로드에 실패했어요.", "error");
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("drawings").getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("drawing_answers").insert({
      couple_id: coupleId,
      writer_id: currentUserId,
      question_date: todayDate,
      question_text: drawingQuestion,
      image_url: publicUrl,
    });

    if (dbError) {
      await supabase.storage.from("drawings").remove([fileName]);
      if (dbError.code === "23505") {
        showToast("이미 제출된 그림이 있어요!", "info");
        await onComplete();
        return;
      }
      showToast("그림 저장에 실패했어요.", "error");
      throw dbError;
    }

    showToast("그림이 성공적으로 등록되었어요!", "success");
    await onComplete();
  };

  const partnerNickname = partnerProfile?.nickname || "상대방";
  const bothAnswered = !!(myDrawing && partnerDrawing);

  return (
    <section className="px-6 mb-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="drawing-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white via-white to-rose-50/40 p-6 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden group"
        >
          <div className="relative z-10">
            {/* Header / Question (Clickable for Expand/Collapse) */}
            <div
              className="flex items-start justify-between gap-3 px-1 cursor-pointer group/header select-none"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex gap-3 pr-2 mt-1">
                <div className="text-rose-200/60 shrink-0">
                  <Palette size={26} strokeWidth={2.5} />
                </div>
                <p className="text-gray-800 font-bold text-[14px] leading-relaxed tracking-tight pt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 bg-rose-400 text-white text-[9px] font-black tracking-wider rounded-full align-text-bottom mr-2 shadow-[0_2px_8px_rgba(251,113,133,0.3)]">
                    NEW
                  </span>
                  {drawingQuestion}
                </p>
              </div>
              <div className="p-1.5 rounded-full text-gray-300 group-hover/header:bg-rose-50 group-hover/header:text-rose-400 transition-colors shrink-0 mt-1">
                {isExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
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
                  <div className="space-y-6 pt-6">
                    {/* My Drawing Box */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between pl-1">
                        <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                          <Smile size={12} className="text-rose-300" /> 나의
                          그림
                        </p>
                        {myDrawing && (
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-[10px] text-gray-400 hover:text-red-500 font-medium flex items-center gap-1 bg-gray-50 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Trash2 size={10} />
                            )}
                            다시 그리기
                          </button>
                        )}
                      </div>

                      <div className="flex justify-center w-full">
                        {!myDrawing ? (
                          // Blank Canvas Placeholder
                          <button
                            onClick={() => setIsCanvasOpen(true)}
                            className="w-full max-w-[240px] aspect-square bg-[url('/checkers.png')] bg-white bg-repeat rounded-2xl border-2 border-dashed border-rose-200/60 hover:border-rose-300 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden shadow-sm"
                            style={{ backgroundSize: "16px 16px" }}
                          >
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center shadow-sm">
                              <Palette className="text-rose-400" size={20} />
                            </div>
                            <div className="text-center">
                              <span className="font-bold text-rose-400 text-[13px] block mb-0.5">
                                캔버스 열기
                              </span>
                              <span className="text-[10px] text-gray-400">
                                터치해서 그림을 그려보세요!
                              </span>
                            </div>
                          </button>
                        ) : (
                          // Submitted Drawing
                          <div className="w-full max-w-[240px] aspect-square bg-rose-50/40 p-4 rounded-2xl border border-rose-100/30 shadow-sm flex items-center justify-center">
                            <img
                              src={myDrawing.image_url}
                              alt="내 그림"
                              className="w-full h-full object-contain"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Partner Drawing Box */}
                    <div className="pt-6 border-t border-gray-50 flex flex-col gap-2">
                      <div className="flex items-center justify-between pl-1">
                        <p className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5">
                          <Heart size={12} className="text-gray-300" />{" "}
                          {partnerNickname}의 그림
                        </p>
                        {bothAnswered && (
                          <div className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest flex items-center gap-1 border bg-green-50 text-green-500 border-green-100">
                            <Unlock size={9} />
                            OPENED
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center w-full">
                        {bothAnswered ? (
                          // Both Submitted
                          <div className="w-full max-w-[240px] aspect-square bg-gray-50/80 p-4 rounded-2xl border border-gray-100/50 shadow-sm flex items-center justify-center">
                            <img
                              src={partnerDrawing!.image_url}
                              alt="상대 그림"
                              className="w-full h-full object-contain"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </div>
                        ) : partnerDrawing && !myDrawing ? (
                          // Partner submitted, but I haven't -> Blurred Silhouette
                          <div className="relative w-full max-w-[240px] aspect-square rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/50 flex flex-col items-center justify-center">
                            <img
                              src={partnerDrawing.image_url}
                              alt="블러 처리된 상대 그림"
                              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110 select-none pointer-events-none"
                            />
                            <div className="relative z-10 flex flex-col items-center text-center p-4">
                              <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm mb-3">
                                <Lock size={20} className="text-rose-400" />
                              </div>
                              <p className="text-[13px] text-gray-700 font-bold mb-1 leading-tight">
                                {partnerNickname}님이 먼저
                                <br />
                                그림을 완성했어요!
                              </p>
                              <p className="text-[11px] text-gray-500">
                                내 그림을 그려서 잠금을 해제하세요 ✨
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Neither submitted, or I submitted but partner hasn't
                          <div className="w-full max-w-[240px] aspect-square flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                            <div className="w-10 h-10 bg-gray-100/80 rounded-full flex items-center justify-center mb-3">
                              <Lock size={16} className="text-gray-400" />
                            </div>
                            <p className="text-[12px] text-gray-500 font-bold mb-1 px-4">
                              {partnerNickname}님이 아직 답변하지 않았어요
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      <DrawingCanvas
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onComplete={handleCanvasComplete}
        questionText={drawingQuestion}
      />
    </section>
  );
};
