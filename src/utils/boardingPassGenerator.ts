import { Trip } from "../types";
import { parseTripTitle } from "./tripHelpers";
import { ShareTemplates } from "./shareUtils";

export const generateAndShareBoardingPass = async (
  trip: Trip,
  showToast: (msg: string, type: "success" | "error" | "info") => void
) => {
  showToast("보딩 패스를 발권하는 중입니다...", "info");

  try {
    const { rawTitle } = parseTripTitle(trip.title);
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const width = 1000;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // 1. Background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    // 2. Ticket Shape
    const ticketX = 40;
    const ticketY = 40;
    const ticketW = width - 80;
    const ticketH = height - 80;
    const r = 24;
    const cutoutY = ticketH / 2 + ticketY;

    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(ticketX + r, ticketY);
    ctx.lineTo(ticketX + ticketW - r, ticketY);
    ctx.arcTo(ticketX + ticketW, ticketY, ticketX + ticketW, ticketY + r, r);
    ctx.lineTo(ticketX + ticketW, cutoutY - 20);
    ctx.arc(ticketX + ticketW, cutoutY, 20, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(ticketX + ticketW, ticketY + ticketH - r);
    ctx.arcTo(
      ticketX + ticketW,
      ticketY + ticketH,
      ticketX + ticketW - r,
      ticketY + ticketH,
      r,
    );
    ctx.lineTo(ticketX + r, ticketY + ticketH);
    ctx.arcTo(ticketX, ticketY + ticketH, ticketX, ticketY + ticketH - r, r);
    ctx.lineTo(ticketX, cutoutY + 20);
    ctx.arc(ticketX, cutoutY, 20, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(ticketX, ticketY + r);
    ctx.arcTo(ticketX, ticketY, ticketX + r, ticketY, r);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // 3. Header
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.moveTo(ticketX + r, ticketY);
    ctx.lineTo(ticketX + ticketW - r, ticketY);
    ctx.arcTo(ticketX + ticketW, ticketY, ticketX + ticketW, ticketY + r, r);
    ctx.lineTo(ticketX + ticketW, ticketY + 80);
    ctx.lineTo(ticketX, ticketY + 80);
    ctx.lineTo(ticketX, ticketY + r);
    ctx.arcTo(ticketX, ticketY, ticketX + r, ticketY, r);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 28px Pretendard, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("BOARDING PASS", ticketX + 40, ticketY + 40);
    ctx.textAlign = "right";
    ctx.fillText("DALIARY AIRLINES", ticketX + ticketW - 40, ticketY + 40);

    // 4. Perforated Line
    ctx.beginPath();
    ctx.setLineDash([12, 12]);
    ctx.moveTo(ticketX + ticketW - 280, ticketY + 80);
    ctx.lineTo(ticketX + ticketW - 280, ticketY + ticketH);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Content
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#111827";
    let titleFont = 64;
    ctx.font = `900 ${titleFont}px Pretendard, sans-serif`;
    const maxTitleWidth = ticketW - 360;
    while (
      ctx.measureText(rawTitle).width > maxTitleWidth &&
      titleFont > 30
    ) {
      titleFont -= 2;
      ctx.font = `900 ${titleFont}px Pretendard, sans-serif`;
    }
    ctx.fillText(rawTitle, ticketX + 40, ticketY + 180);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 18px Pretendard, sans-serif";
    ctx.fillText("DEPARTURE", ticketX + 40, ticketY + 260);
    ctx.fillText("RETURN", ticketX + 280, ticketY + 260);
    ctx.fillText("DURATION", ticketX + 500, ticketY + 260);

    ctx.fillStyle = "#111827";
    ctx.font = "900 32px Pretendard, sans-serif";
    ctx.fillText(trip.start_date, ticketX + 40, ticketY + 300);
    ctx.fillText(trip.end_date, ticketX + 280, ticketY + 300);

    ctx.fillStyle = "#f43f5e";
    ctx.fillText(`${daysCount} Days`, ticketX + 500, ticketY + 300);

    ctx.fillStyle = "#111827";
    ctx.font = "28px sans-serif";
    ctx.fillText("✈️", ticketX + 225, ticketY + 300);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 16px Pretendard, sans-serif";
    ctx.fillText("PASSENGER", ticketX + 40, ticketY + 360);
    ctx.fillText("FLIGHT", ticketX + 280, ticketY + 360);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 24px Pretendard, sans-serif";
    ctx.fillText("V.I.P COUPLE", ticketX + 40, ticketY + 385);
    ctx.fillText(
      `DA-${Math.floor(Math.random() * 9000) + 1000}`,
      ticketX + 280,
      ticketY + 385,
    );

    // 6. Stub
    const stubX = ticketX + ticketW - 240;

    ctx.fillStyle = "#111827";
    ctx.font = "900 28px Pretendard, sans-serif";
    let stubTitle = rawTitle;
    if (ctx.measureText(stubTitle).width > 200) {
      stubTitle = stubTitle.substring(0, 8) + "...";
    }
    ctx.fillText(stubTitle, stubX, ticketY + 140);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 14px Pretendard, sans-serif";
    ctx.fillText("DEPARTURE", stubX, ticketY + 190);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 20px Pretendard, sans-serif";
    ctx.fillText(trip.start_date, stubX, ticketY + 215);

    ctx.fillStyle = "#111827";
    let bx = stubX;
    for (let i = 0; i < 20; i++) {
      const bw = Math.random() * 6 + 2;
      if (bx + bw > ticketX + ticketW - 40) break;
      ctx.fillRect(bx, ticketY + 280, bw, 80);
      bx += bw + (Math.random() * 4 + 2);
    }

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Blob failed"));
          return;
        }
        const file = new File([blob], "boarding_pass.png", {
          type: "image/png",
        });
        const template = ShareTemplates.trip(rawTitle, trip.id);

        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              title: template.title,
              text: `✈️ 우리의 새로운 여행!\n\n[${rawTitle}]\n${trip.start_date} ~ ${trip.end_date}`,
              files: [file],
            });
            showToast("보딩 패스가 발권 및 공유되었습니다.", "success");
          } catch (e) {
            console.error(e);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `boarding_pass_${rawTitle}.png`;
          a.click();
          URL.revokeObjectURL(url);
          showToast("기기에 보딩 패스가 저장되었습니다.", "success");
        }
        resolve();
      }, "image/png");
    });
  } catch (err) {
    console.error(err);
    showToast("보딩 패스 생성에 실패했습니다.", "error");
  }
};
