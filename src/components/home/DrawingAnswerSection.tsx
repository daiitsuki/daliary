import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { DrawingAnswer, Profile } from "../../types";
import { DrawingCanvas } from "./DrawingCanvas";
import { useToast } from "../../context/ToastContext";
import BaseModal from "../common/BaseModal";

import {
  Lock,
  Unlock,
  Smile,
  Heart,
  Palette,
  ChevronDown,
  ChevronUp,
  Share2,
  Image as ImageIcon,
  Send,
  Loader2,
} from "lucide-react";

interface DrawingAnswerSectionProps {
  drawingQuestion: string;
  myDrawing: DrawingAnswer | null;
  partnerDrawing: DrawingAnswer | null;
  coupleId: string | undefined;
  currentUserId: string | null;
  partnerProfile: Profile | null;
  myProfile: Profile | null;
  onComplete: () => Promise<void>;
}

export const DrawingAnswerSection: React.FC<DrawingAnswerSectionProps> = ({
  drawingQuestion,
  myDrawing,
  partnerDrawing,
  coupleId,
  currentUserId,
  partnerProfile,
  myProfile,
  onComplete,
}) => {
  const { showToast } = useToast();
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("drawing_section_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.question === drawingQuestion) {
          return parsed.isExpanded;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem(
      "drawing_section_state",
      JSON.stringify({ isExpanded, question: drawingQuestion }),
    );
  }, [isExpanded, drawingQuestion]);

  if (!coupleId || !currentUserId) return null;

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
    const uniqueId = crypto.randomUUID().split("-")[0]; // ex: 123e4567

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

  const handleRequestAnswer = async () => {
    if (!coupleId || !currentUserId || isRequesting) return;

    const cooldownKey = `last_drawing_request_${coupleId}_${currentUserId}`;
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
          content: `${myProfile?.nickname || "상대방"}님이 오늘의 드로잉 질문에 답변하라고 요청했어요!`,
        });

        if (error) throw error;

        localStorage.setItem(cooldownKey, Date.now().toString());
        showToast(
          "오늘의 드로잉 질문에 답변하라는 알림을 보냈어요!",
          "success",
        );
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
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const width = option === "both" ? 1000 : 600;

      // Calculate dynamic height based on text lines
      ctx.font = "bold 32px sans-serif";
      const maxWidth = width - 120; // 60px padding on each side

      const wrapText = (
        context: CanvasRenderingContext2D,
        text: string,
        maxW: number,
      ) => {
        const lines: string[] = [];
        let currentLine = "";
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
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

      const titleText = `"${drawingQuestion}"`;
      const lines = wrapText(ctx, titleText, maxWidth);
      const lineHeight = 44;
      const textHeight = lines.length * lineHeight;

      const headerTopPadding = 70;
      const headerBottomPadding = 40;
      const imageSize = 400;
      const footerPadding = 120; // space for the label and padding

      const height =
        headerTopPadding +
        textHeight +
        headerBottomPadding +
        imageSize +
        footerPadding;

      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = "#fff1f2"; // rose-50
      ctx.fillRect(0, 0, width, height);

      // Card
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      // manual roundRect
      const r = 32;
      const x = 40;
      const y = 40;
      const w = width - 80;
      const h = height - 80;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Draw Title Lines
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          width / 2,
          headerTopPadding + 32 + index * lineHeight,
        );
      });

      const imageStartY = headerTopPadding + textHeight + headerBottomPadding;

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous"; // Important for Supabase URLs
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const drawImageWithLabel = async (
        url: string,
        label: string,
        cx: number,
        color: string,
      ) => {
        const img = await loadImage(url);

        ctx.fillStyle = color;
        const ix = cx - imageSize / 2;
        const iy = imageStartY;

        // Image BG
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(ix, iy, imageSize, imageSize, 24);
        } else {
          ctx.rect(ix, iy, imageSize, imageSize);
        }
        ctx.fill();

        ctx.drawImage(img, ix, iy, imageSize, imageSize);

        ctx.fillStyle = "#4b5563";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(label, cx, iy + imageSize + 50);
      };

      if (option === "both") {
        await drawImageWithLabel(
          myDrawing!.image_url,
          "나의 그림",
          width / 4 + 20,
          "#fff1f2",
        );
        await drawImageWithLabel(
          partnerDrawing!.image_url,
          `${partnerNickname}의 그림`,
          (width / 4) * 3 - 20,
          "#f3f4f6",
        );
      } else if (option === "my") {
        await drawImageWithLabel(
          myDrawing!.image_url,
          "나의 그림",
          width / 2,
          "#fff1f2",
        );
      } else if (option === "partner") {
        await drawImageWithLabel(
          partnerDrawing!.image_url,
          `${partnerNickname}의 그림`,
          width / 2,
          "#f3f4f6",
        );
      }

      // Convert to blob and share
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Blob creation failed");
        const file = new File([blob], "drawing.png", { type: "image/png" });

        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              title: "달이어리 드로잉",
              text: `🎨 오늘의 드로잉 질문: "${drawingQuestion}"`,
              files: [file],
            });
            showToast("공유되었습니다.", "success");
          } catch (e) {
            console.error(e);
          }
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "drawing.png";
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
                  {drawingQuestion}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-1">
                <div className="p-1.5 rounded-full text-gray-300 group-hover/header:bg-rose-50 group-hover/header:text-rose-400 transition-colors">
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
                  <div className="space-y-6 pt-6">
                    {/* My Drawing Box */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between pl-1">
                        <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                          <Smile size={12} className="text-rose-300" /> 나의
                          그림
                        </p>
                        {/*  {myDrawing && (
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
                        )} */}
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
                            {partnerDrawing.image_url === 'hidden' ? (
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-rose-100 to-indigo-100 blur-xl opacity-60 scale-110 select-none pointer-events-none" />
                            ) : (
                              <img
                                src={partnerDrawing.image_url}
                                alt="블러 처리된 상대 그림"
                                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110 select-none pointer-events-none"
                              />
                            )}
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
                            <p className="text-[12px] text-gray-500 font-bold mb-3 px-4 tracking-tight">
                              {partnerNickname}님이 아직 답변하지 않았어요
                            </p>
                            {myDrawing && (
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
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsShareMenuOpen(true); }}
                        disabled={isSharing || !myDrawing}
                        className="w-9 h-9 flex items-center justify-center bg-rose-50/50 text-rose-400 rounded-xl hover:bg-rose-100/60 transition-colors disabled:opacity-50"
                        title="그림 공유하기"
                        aria-label="그림 공유하기"
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
      </AnimatePresence>

      <DrawingCanvas
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onComplete={handleCanvasComplete}
        questionText={drawingQuestion}
      />

      <BaseModal
        isOpen={isShareMenuOpen}
        onClose={() => setIsShareMenuOpen(false)}
        title="어떤 그림을 공유할까요?"
        icon={Share2}
        contentClassName="p-6 pb-8 md:pb-6 flex flex-col gap-3"
      >
        <button
          disabled={!myDrawing}
          onClick={() => handleShareOption("my")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-rose-50/50 hover:bg-rose-100/60 transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-rose-50/50 disabled:active:scale-100 border border-rose-100"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Smile size={20} className="text-rose-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-[15px]">
              내 그림 공유하기
            </p>
          </div>
        </button>

        <button
          disabled={!partnerDrawing || !bothAnswered}
          onClick={() => handleShareOption("partner")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-gray-50 disabled:active:scale-100 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Heart size={20} className="text-gray-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-[15px]">
              {partnerNickname}님의 그림 공유하기
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
              두 그림 모두 공유하기
            </p>
          </div>
        </button>
      </BaseModal>
    </section>
  );
};
