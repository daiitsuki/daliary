import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Undo2,
  Trash2,
  Check,
  Loader2,
  Eraser,
  Pen,
  Palette,
  Maximize2,
  Minimize2,
  Redo2,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import BaseModal from "../common/BaseModal";

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (blob: Blob) => Promise<void>;
  questionText: string;
}

const COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];
const PEN_THICKNESS_LEVELS = [2, 4, 8, 16];
const ERASER_THICKNESS_LEVELS = [8, 16, 32, 64];

type ToolMode = "pen" | "eraser";

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isOpen,
  onClose,
  onComplete,
  questionText,
}) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<ToolMode>("pen");
  const [activePanel, setActivePanel] = useState<ToolMode | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [thickness, setThickness] = useState(PEN_THICKNESS_LEVELS[1]);
  const [eraserThickness, setEraserThickness] = useState(
    ERASER_THICKNESS_LEVELS[1],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const isTouchDevice = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches,
  );

  // Init canvas and restore state on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const canvas = canvasRef.current;
      const container = containerRef.current;

      const size = container.clientWidth;
      setCanvasScale(size / 400);

      if (canvas.width !== size || canvas.height !== size) {
        const tempImg = new Image();
        tempImg.src = canvas.toDataURL();

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.imageSmoothingEnabled = false;

        tempImg.onload = () => {
          ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        };
      }
    };

    const timer = setTimeout(() => {
      handleResize();
      if (canvasRef.current) {
        if (history.length > 0) {
          const img = new Image();
          img.src = history[history.length - 1];
          img.onload = () => {
            const ctx = canvasRef.current!.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.clearRect(
                0,
                0,
                canvasRef.current!.width,
                canvasRef.current!.height,
              );
              ctx.drawImage(
                img,
                0,
                0,
                canvasRef.current!.width,
                canvasRef.current!.height,
              );
            }
          };
        } else {
          setHistory([canvasRef.current.toDataURL()]);
        }
      }
    }, 50);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : "#000";
      ctx.lineWidth =
        (tool === "pen" ? thickness : eraserThickness) * canvasScale;
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [tool, color, thickness, eraserThickness, canvasScale]);

  // Native dynamic SVG cursor to avoid React state lag
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const baseThickness = tool === "pen" ? thickness : eraserThickness;
    const size = baseThickness * canvasScale;
    const isEraser = tool === "eraser";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
      <circle cx="${size / 2 + 2}" cy="${size / 2 + 2}" r="${size / 2}" 
        fill="${isEraser ? "rgba(255,255,255,0.7)" : color}" 
        stroke="${isEraser ? "rgba(244,63,94,0.8)" : "rgba(0,0,0,0.3)"}" 
        stroke-width="1.5" 
        stroke-dasharray="${isEraser ? "2,2" : "none"}" />
    </svg>`;

    const url = `data:image/svg+xml;base64,${btoa(svg)}`;
    const hotspot = Math.round(size / 2 + 2);

    canvas.style.cursor = `url("${url}") ${hotspot} ${hotspot}, crosshair`;
  }, [tool, thickness, eraserThickness, color, canvasScale]);

  const getNormalizedPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const zoom = parseFloat((document.body.style as any).zoom || "1");
    const rect = canvas.getBoundingClientRect();
    
    // e.clientX와 rect는 모두 브라우저 뷰포트 기준 동일한 스케일의 좌표계입니다.
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // 캔버스 드로잉 내부 좌표 (원래 방식이 가장 정확함)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      cssX: offsetX / zoom, // 오버레이용 CSS 픽셀 좌표 (zoom으로 나누어 정규화)
      cssY: offsetY / zoom,
      x: offsetX * scaleX,  // 캔버스 내부 드로잉 좌표
      y: offsetY * scaleY,
    };
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getNormalizedPos(e);
    return pos ? { x: pos.x, y: pos.y } : null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setActivePanel(null);

    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.strokeStyle = tool === "pen" ? color : "#000";
      ctx.lineWidth =
        (tool === "pen" ? thickness : eraserThickness) * canvasScale;
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.imageSmoothingEnabled = false;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsDrawing(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (isTouchDevice.current) {
      const pos = getNormalizedPos(e);
      if (pos) {
        setPointerPos({ x: pos.cssX, y: pos.cssY });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    if (isDrawing) {
      const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
      if (isTouchDevice.current) {
        const pos = getNormalizedPos(e);
        if (pos) {
          setPointerPos({ x: pos.cssX, y: pos.cssY });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary) return;

    if (isDrawing) {
      setIsDrawing(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
      if (ctx) ctx.closePath();

      if (canvasRef.current) {
        setHistory((prev) => [...prev, canvasRef.current!.toDataURL()]);
        setRedoHistory([]);
      }
    }
    if (isTouchDevice.current) setPointerPos(null);
  };

  const handlePointerLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
      if (ctx) ctx.closePath();
      if (canvasRef.current) {
        setHistory((prev) => [...prev, canvasRef.current!.toDataURL()]);
        setRedoHistory([]);
      }
    }
    if (isTouchDevice.current) setPointerPos(null);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;

    const newHistory = [...history];
    const undoneState = newHistory.pop();
    if (undoneState) {
      setRedoHistory((prev) => [...prev, undoneState]);
    }
    const previousState = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      const img = new Image();
      img.src = previousState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const currentOp = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = currentOp;
      };
      setHistory(newHistory);
    }
    setActivePanel(null);
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;

    const newRedoHistory = [...redoHistory];
    const nextState = newRedoHistory.pop();
    
    if (!nextState) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const currentOp = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = currentOp;
      };
      setHistory((prev) => [...prev, nextState]);
      setRedoHistory(newRedoHistory);
    }
    setActivePanel(null);
  };

  const handleClearAll = () => {
    if (isCanvasEmpty()) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev, canvas.toDataURL()]);
      setRedoHistory([]);
    }
    setActivePanel(null);
  };

  const handleToolClick = (selectedTool: ToolMode) => {
    if (tool === selectedTool) {
      setActivePanel(activePanel === selectedTool ? null : selectedTool);
    } else {
      setTool(selectedTool);
      setActivePanel(selectedTool);
    }
  };

  const isCanvasEmpty = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return false;
    }
    return true;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isSubmitting) return;
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, history, redoHistory]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (isCanvasEmpty()) {
      showToast("빈 캔버스는 제출할 수 없습니다!", "error");
      return;
    }

    const isConfirmed = await confirm({
      title: "답변 제출하기",
      message: "이 그림으로 답변을 제출할까요?\n제출 후에는 수정할 수 없어요.",
      confirmText: "확인",
      cancelText: "취소",
    });

    if (!isConfirmed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSubmitting(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.8),
      );
      if (!blob) throw new Error("Canvas to Blob failed");
      await onComplete(blob);
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={Palette}
      title={
        <span className="font-bold text-gray-800 text-sm truncate flex items-center gap-1.5 max-w-[240px] md:max-w-[300px]">
          <span className="truncate">{questionText}</span>
        </span>
      }
      contentClassName="p-0 flex flex-col h-full bg-[#f3f4f6]"
      maxWidth="md"
    >
      {isFullscreen && (
        <style>{`
          .z-\\[9999\\] { padding: 0 !important; }
          .z-\\[9999\\] > div:last-child {
            max-width: 100% !important;
            max-height: 100% !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
        `}</style>
      )}
      <div className="w-full flex-1 flex flex-col h-full overflow-hidden">
        <div className="w-full flex-1 bg-[#f3f4f6] flex items-center justify-center overflow-hidden">
          <div
            ref={containerRef}
            className="w-full aspect-square relative bg-[url('/checkers.png')] bg-white bg-repeat shadow-sm border-y border-gray-200 overflow-hidden touch-none"
            style={{
              backgroundSize: "16px 16px",
              maxWidth: isFullscreen
                ? "min(100vw, calc(100dvh - 220px))"
                : "100%",
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerLeave}
              onPointerLeave={handlePointerLeave}
            />

            {/* React Pointer Overlay for Mobile/Touch Devices */}
            {isTouchDevice.current && pointerPos && (
              <div
                className="absolute pointer-events-none rounded-full transition-transform"
                style={{
                  left: pointerPos.x,
                  top: pointerPos.y,
                  width:
                    (tool === "pen" ? thickness : eraserThickness) *
                    canvasScale,
                  height:
                    (tool === "pen" ? thickness : eraserThickness) *
                    canvasScale,
                  transform: "translate(-50%, -50%)",
                  backgroundColor:
                    tool === "eraser" ? "rgba(255,255,255,0.7)" : color,
                  border:
                    tool === "eraser"
                      ? "1px dashed rgba(244,63,94,0.8)"
                      : "1px solid rgba(0,0,0,0.1)",
                  boxShadow:
                    tool === "eraser"
                      ? "0 0 0 2px rgba(255,255,255,0.5)"
                      : "none",
                  opacity: 0.9,
                  zIndex: 10,
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white p-5 shrink-0 flex flex-col gap-4 relative mt-auto border-t border-gray-200 z-10">
          <AnimatePresence>
            {activePanel === "pen" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-[100%] left-0 right-0 mb-2 mx-5 bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-col gap-4"
              >
                <div className="flex justify-between px-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-gray-400" : "border-transparent shadow-sm"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-1">
                  {PEN_THICKNESS_LEVELS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setThickness(t)}
                      className={`p-2 flex items-center justify-center rounded-full transition-colors border ${thickness === t ? "bg-gray-50 border-gray-200 shadow-sm" : "bg-transparent border-transparent"}`}
                    >
                      <div
                        className="bg-gray-700 rounded-full"
                        style={{ width: t, height: t }}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activePanel === "eraser" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-[100%] left-0 right-0 mb-2 mx-5 bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex justify-center items-center gap-6"
              >
                {ERASER_THICKNESS_LEVELS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setEraserThickness(t)}
                    className={`p-2 flex items-center justify-center rounded-full transition-colors border ${eraserThickness === t ? "bg-rose-50 border-rose-200 shadow-sm" : "bg-transparent border-transparent"}`}
                  >
                    <div
                      className="bg-white border border-rose-300 rounded-full shadow-inner"
                      style={{ width: t, height: t }}
                    />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center bg-gray-50/50 p-1.5 rounded-[20px] border border-gray-100">
            <div className="flex gap-0.5 shrink-0">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden md:flex p-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors active:scale-95"
                title={isFullscreen ? "기본 화면으로" : "전체 화면으로"}
              >
                {isFullscreen ? (
                  <Minimize2 size={22} />
                ) : (
                  <Maximize2 size={22} />
                )}
              </button>
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-3 rounded-xl text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-colors active:scale-95"
                title="실행 취소"
              >
                <Undo2 size={22} />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoHistory.length === 0}
                className="p-3 rounded-xl text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-colors active:scale-95"
                title="다시 실행"
              >
                <Redo2 size={22} />
              </button>
            </div>

            <div className="flex gap-1 border-x border-gray-200 px-1">
              <button
                onClick={() => handleToolClick("pen")}
                className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all ${tool === "pen" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Pen
                  size={22}
                  className={tool === "pen" ? "fill-gray-100" : ""}
                />
              </button>
              <button
                onClick={() => handleToolClick("eraser")}
                className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all ${tool === "eraser" ? "bg-rose-50 shadow-sm text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
              >
                <Eraser
                  size={22}
                  className={tool === "eraser" ? "fill-rose-100" : ""}
                />
              </button>
            </div>

            <button
              onClick={handleClearAll}
              disabled={history.length <= 1}
              className="p-3 rounded-xl text-gray-400 disabled:opacity-30 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
              title="전체 지우기"
            >
              <Trash2 size={22} />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-[54px] bg-rose-400 text-white rounded-[20px] font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_14px_rgba(251,113,133,0.3)] disabled:opacity-70 disabled:active:scale-100 disabled:shadow-none mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Check size={20} strokeWidth={2.5} />
                답변하기
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
