import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useHomeData } from "../../hooks";

export const useShareAnswerImage = () => {
  const { todayQuestion, myAnswer, partnerAnswer, partnerProfile } = useHomeData();
  const { showToast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const partnerNickname = partnerProfile?.nickname || "상대방";

  const shareImage = async (option: "my" | "partner" | "both", onComplete?: () => void) => {
    setIsSharing(true);
    showToast("이미지를 생성 중입니다...", "info");

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas not supported");

      const width = 800;

      const wrapText = (context: CanvasRenderingContext2D, text: string, maxW: number) => {
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
          if (context.measureText(testLine).width > maxW && currentLine !== "") {
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
      const titleLines = wrapText(ctx, `"${todayQuestion?.content || ''}"`, maxWidth);
      const titleHeight = titleLines.length * 44;

      ctx.font = "500 24px sans-serif";
      const answerMaxWidth = width - 160;
      let myLines: string[] = [];
      let partnerLines: string[] = [];

      if (option === "my" || option === "both") {
        myLines = wrapText(ctx, myAnswer?.content || '', answerMaxWidth);
      }
      if (option === "partner" || option === "both") {
        partnerLines = wrapText(ctx, partnerAnswer?.content || '', answerMaxWidth);
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

      const drawAnswerBox = (label: string, lines: string[], bgColor: string, textColor: string) => {
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
        drawAnswerBox(`${partnerNickname}의 답변`, partnerLines, "#f3f4f6", "#374151");
      }

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Blob creation failed");
        const file = new File([blob], "answer.png", { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "달이어리 질문",
              text: `📝 오늘의 질문: "${todayQuestion?.content || ''}"`,
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
        if (onComplete) onComplete();
      }, "image/png");
    } catch (err) {
      console.error(err);
      showToast("이미지 생성에 실패했습니다.", "error");
      setIsSharing(false);
      if (onComplete) onComplete();
    }
  };

  return { shareImage, isSharing };
};
