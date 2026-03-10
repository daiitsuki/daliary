import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Star, ChevronLeft, Info, Zap, User } from "lucide-react";
import { useGameScore } from "../../hooks/useGameScore";
import { useHomeData } from "../../hooks/useHomeData";

interface StackGameProps {
  onBack: () => void;
}

interface Block {
  x: number;
  y: number;
  width: number;
  color: string;
}

interface FallingPiece extends Block {
  vy: number;
  vx: number;
  opacity: number;
}

const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 540;
const INITIAL_BLOCK_SIZE = 200;
const BLOCK_HEIGHT = 35;
const CAMERA_LERP = 0.1;
const TARGET_FLOORS = 25;
const TARGET_PERFECTS = 5;
const PERFECT_TOLERANCE = 5;

export default function StackGame({ onBack }: StackGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [perfectCount, setPerfectCount] = useState(0);
  const [maxConsecutivePerfects, setMaxConsecutivePerfects] = useState(0);
  const [reachedTarget, setReachedTarget] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(false);
  const [rewardConfirmed, setRewardConfirmed] = useState(false);
  const [perfectFeedback, setPerfectFeedback] = useState(false);

  const { myProfile, partnerProfile } = useHomeData();
  const { scores, myScore, recordResult } = useGameScore("stack");

  // Game State Refs
  const blocksRef = useRef<Block[]>([]);
  const movingBlockRef = useRef<Block | null>(null);
  const fallingPiecesRef = useRef<FallingPiece[]>([]);
  const cameraYRef = useRef(0);
  const targetCameraYRef = useRef(0);
  const directionRef = useRef(1);
  const speedRef = useRef(3);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);

  const today = new Date()
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .replace(/\. /g, "-")
    .replace(/\./g, "");

  const isMeRewarded = myScore?.last_reward_date === today;
  const partnerScore = scores?.find((s) => s.user_id === partnerProfile?.id);
  const isPartnerRewarded = !!partnerProfile && partnerScore?.last_reward_date === today;

  useEffect(() => {
    if (myScore) setBestScore(myScore.high_score);
  }, [myScore]);

  const getColor = (index: number) => {
    const baseHue = 260; 
    const hue = (baseHue + index * 5) % 360;
    return `hsl(${hue}, 70%, 65%)`;
  };

  const spawnBlock = useCallback(() => {
    const topBlock = blocksRef.current[blocksRef.current.length - 1];
    const newY = topBlock.y - BLOCK_HEIGHT;
    
    const newBlock: Block = {
      x: directionRef.current > 0 ? -topBlock.width : CANVAS_WIDTH + topBlock.width,
      y: newY,
      width: topBlock.width,
      color: getColor(blocksRef.current.length),
    };

    movingBlockRef.current = newBlock;
    
    // 속도 계산: 기본 3.0 + 층당 0.09 상승
    speedRef.current = 3 + (blocksRef.current.length - 1) * 0.09;
    
    // 최대 속도 제한
    if (speedRef.current > 5.25) speedRef.current = 5.25;
  }, []);

  const initGame = useCallback(() => {
    const baseBlock: Block = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - BLOCK_HEIGHT - 50,
      width: INITIAL_BLOCK_SIZE,
      color: getColor(0),
    };

    blocksRef.current = [baseBlock];
    fallingPiecesRef.current = [];
    setScore(0);
    setPerfectCount(0);
    setMaxConsecutivePerfects(0);
    setGameOver(false);
    gameOverRef.current = false;
    setReachedTarget(false);
    setRewardEarned(false);
    setRewardConfirmed(false);
    cameraYRef.current = 0;
    targetCameraYRef.current = 0;
    speedRef.current = 3;
    directionRef.current = 1;

    spawnBlock();
  }, [spawnBlock]);

  const triggerReward = useCallback((currentScore: number) => {
    if (rewardEarned || isMeRewarded) return;
    
    setRewardEarned(true);
    setReachedTarget(true);
    
    recordResult.mutate(
      { score: currentScore, reachedTarget: true },
      {
        onSuccess: (data) => {
          if (data?.reward_given) {
            setRewardConfirmed(true);
            setShowRewardToast(true);
            setTimeout(() => setShowRewardToast(false), 3000);
          }
        }
      }
    );
  }, [rewardEarned, isMeRewarded, recordResult]);

  const endGame = useCallback(() => {
    setGameOver(true);
    gameOverRef.current = true;
    movingBlockRef.current = null;
    
    const finalScore = blocksRef.current.length - 1;
    const isTargetReached = finalScore >= TARGET_FLOORS || maxConsecutivePerfects >= TARGET_PERFECTS;
    
    recordResult.mutate({
      score: finalScore,
      reachedTarget: isTargetReached
    });
  }, [maxConsecutivePerfects, recordResult]);

  const placeBlock = useCallback(() => {
    if (gameOverRef.current || !movingBlockRef.current) return;

    const moving = movingBlockRef.current;
    const top = blocksRef.current[blocksRef.current.length - 1];

    const diff = moving.x - top.x;
    const absDiff = Math.abs(diff);

    let nextPerfectCount = 0;

    if (absDiff < PERFECT_TOLERANCE) {
      const placedBlock: Block = {
        ...moving,
        x: top.x,
        width: top.width,
      };
      blocksRef.current.push(placedBlock);
      nextPerfectCount = perfectCount + 1;
      setPerfectCount(nextPerfectCount);
      setPerfectFeedback(true);
      setTimeout(() => setPerfectFeedback(false), 500);
    } else {
      const overlap = top.width - absDiff;
      
      if (overlap <= 0) {
        fallingPiecesRef.current.push({
          ...moving,
          vx: speedRef.current * directionRef.current * 0.5,
          vy: 2,
          opacity: 1
        });
        endGame();
        return;
      }

      const pieceWidth = absDiff;
      const pieceX = diff > 0 
        ? moving.x + (moving.width / 2) - (pieceWidth / 2)
        : moving.x - (moving.width / 2) + (pieceWidth / 2);

      fallingPiecesRef.current.push({
        x: pieceX,
        y: moving.y,
        width: pieceWidth,
        color: moving.color,
        vx: directionRef.current * 1,
        vy: 2,
        opacity: 1
      });

      const newWidth = overlap;
      const newX = top.x + diff / 2;

      const placedBlock: Block = {
        ...moving,
        x: newX,
        width: newWidth,
      };

      blocksRef.current.push(placedBlock);
      setPerfectCount(0);
      nextPerfectCount = 0;
    }

    const newScore = blocksRef.current.length - 1;
    setScore(newScore);
    
    // 즉시 보상 판정
    if (newScore >= TARGET_FLOORS || nextPerfectCount >= TARGET_PERFECTS) {
      triggerReward(newScore);
    }
    
    if (blocksRef.current.length > 4) {
      targetCameraYRef.current += BLOCK_HEIGHT;
    }

    spawnBlock();
  }, [endGame, spawnBlock, perfectCount, triggerReward]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, "#f8fafc");
    bgGrad.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(0, cameraYRef.current);

    fallingPiecesRef.current.forEach(piece => {
      ctx.globalAlpha = piece.opacity;
      ctx.fillStyle = piece.color;
      ctx.fillRect(piece.x - piece.width / 2, piece.y, piece.width, BLOCK_HEIGHT);
    });
    ctx.globalAlpha = 1;

    blocksRef.current.forEach((block) => {
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x - block.width / 2, block.y, block.width, BLOCK_HEIGHT);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(block.x - block.width / 2, block.y, block.width, 4);
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(block.x - block.width / 2, block.y + BLOCK_HEIGHT - 4, block.width, 4);
    });

    if (movingBlockRef.current && !gameOverRef.current) {
      const block = movingBlockRef.current;
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x - block.width / 2, block.y, block.width, BLOCK_HEIGHT);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(block.x - block.width / 2, block.y, block.width, 4);
    }

    ctx.restore();
  }, []);

  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const deltaTime = Math.min(time - lastTimeRef.current, 100);
    lastTimeRef.current = time;
    
    // 60fps 기준(16.67ms)으로 타임스케일 계산
    const timeScale = deltaTime / 16.666;

    if (movingBlockRef.current && !gameOverRef.current) {
      const moving = movingBlockRef.current;
      moving.x += speedRef.current * directionRef.current * timeScale;
      
      if (moving.x > CANVAS_WIDTH - moving.width / 2 + 50) {
        moving.x = CANVAS_WIDTH - moving.width / 2 + 50;
        directionRef.current = -1;
      }
      if (moving.x < -50 + moving.width / 2) {
        moving.x = -50 + moving.width / 2;
        directionRef.current = 1;
      }
    }

    fallingPiecesRef.current.forEach(piece => {
      piece.y += piece.vy * timeScale;
      piece.x += piece.vx * timeScale;
      piece.vy += 0.4 * timeScale;
      piece.opacity -= 0.02 * timeScale;
    });
    fallingPiecesRef.current = fallingPiecesRef.current.filter(p => p.opacity > 0 && p.y < CANVAS_HEIGHT + 100);

    cameraYRef.current += (targetCameraYRef.current - cameraYRef.current) * CAMERA_LERP * timeScale;

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [draw]);

  useEffect(() => {
    initGame();
    requestRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = 0;
    };
  }, [initGame, update]);

  const handleInteraction = useCallback(() => {
    if (gameOver) return;
    placeBlock();
  }, [gameOver, placeBlock]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (gameOver) return;
    // 터치 시 스크롤 등 기본 동작 방지 및 즉각 반응
    if (e.pointerType === 'touch') {
      // 터치 이벤트의 경우에만 방지 (마우스의 경우 버튼 클릭 등을 위해)
    }
    handleInteraction();
  }, [gameOver, handleInteraction]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        if (!gameOver) {
          e.preventDefault();
          handleInteraction();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, handleInteraction]);

  useEffect(() => {
    if (perfectCount > maxConsecutivePerfects) {
      setMaxConsecutivePerfects(perfectCount);
    }
  }, [perfectCount, maxConsecutivePerfects]);

  const handleRestart = () => {
    if (gameOver || confirm("게임을 다시 시작할까요?")) {
      initGame();
    }
  };

  return (
    <div className="flex-1 bg-gray-50/30 flex flex-col relative lg:h-full lg:overflow-hidden overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
      <AnimatePresence>
        {showRewardToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 z-[100] bg-violet-500 text-white px-6 py-3 rounded-2xl shadow-xl font-black flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm whitespace-nowrap w-max"
          >
            <Star size={20} fill="currentColor" />
            <span>목표 달성! 150포인트 적립 ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1600px] mx-auto px-4 py-6 lg:py-10 lg:h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-white border border-violet-100 rounded-2xl text-gray-400 hover:text-violet-500 shadow-sm transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">
                스택 타워
              </h2>
              <p className="text-gray-400 text-[10px] sm:text-xs font-medium">
                타이밍에 맞춰 블록을 정확히 쌓으세요!
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="bg-white border border-violet-50 px-4 py-2 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                현재 층수
              </p>
              <p className="text-lg font-black text-violet-500 leading-none mt-1">
                {score}
              </p>
            </div>
            <div className="flex bg-violet-500 rounded-2xl shadow-md border border-violet-400 overflow-hidden min-w-[140px]">
              <div className="flex-1 px-3 py-2 text-center border-r border-violet-400/30">
                <p className="text-[9px] text-violet-100 font-black uppercase tracking-widest whitespace-nowrap">
                  나의 기록
                </p>
                <p className="text-base font-black text-white leading-none mt-1">
                  {Math.max(score, bestScore)}
                </p>
              </div>
              <div className="flex-1 px-3 py-2 text-center bg-violet-600/20">
                <p className="text-[9px] text-violet-100 font-black uppercase tracking-widest whitespace-nowrap">
                  {partnerProfile?.nickname?.slice(0, 3) || "상대"} 기록
                </p>
                <p className="text-base font-black text-white leading-none mt-1">
                  {partnerScore?.high_score || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start lg:flex-1 lg:min-h-0 mt-2">
          <div className="w-full lg:flex-1 flex flex-col items-center justify-center lg:h-full">
            {/* Mobile Dashboard */}
            <div className="flex sm:hidden items-center justify-between w-full max-w-[340px] mb-4 px-2">
              <div className="flex items-center gap-2.5">
                <div className={`relative w-9 h-9 rounded-full border-2 transition-all ${isMeRewarded ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white"}`}>
                  {myProfile?.avatar_url ? (
                    <img src={myProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {myProfile?.nickname?.slice(0, 1)}
                    </div>
                  )}
                  {isMeRewarded && (
                    <div className="absolute -top-1 -right-1 bg-violet-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className={`relative w-9 h-9 rounded-full border-2 transition-all ${isPartnerRewarded ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white"}`}>
                  {partnerProfile?.avatar_url ? (
                    <img src={partnerProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {partnerProfile?.nickname?.slice(0, 1) || "P"}
                    </div>
                  )}
                  {isPartnerRewarded && (
                    <div className="absolute -top-1 -right-1 bg-violet-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRestart}
                  className="p-2 bg-gray-900 text-white rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  <RotateCcw size={16} />
                </button>
                <div className="flex flex-col items-end leading-tight min-w-[80px]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Floors</span>
                    <span className="text-base font-black text-violet-500 leading-none">{score}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Record</span>
                    <span className="text-[10px] font-black text-gray-700 leading-none">{Math.max(score, bestScore)}</span>
                    <span className="text-[8px] font-bold text-gray-300">/</span>
                    <span className="text-[10px] font-black text-violet-400 leading-none">{partnerScore?.high_score || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-white rounded-[32px] border-[6px] border-white shadow-2xl overflow-hidden touch-none box-content mb-6 lg:mb-0"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              onPointerDown={handlePointerDown}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full"
              />

              <AnimatePresence>
                {perfectFeedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1.2, y: -50 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[15]"
                  >
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full border-4 border-yellow-400 shadow-xl">
                      <span className="text-yellow-500 font-black text-2xl tracking-tighter">PERFECT!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-6 left-6 pointer-events-none z-10">
                <div className="flex items-center gap-2 bg-black/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5">
                  <Zap size={14} className={perfectCount > 0 ? "text-yellow-500 fill-current" : "text-gray-400"} />
                  <span className="text-gray-700 font-black text-sm">Combo: {perfectCount}</span>
                </div>
              </div>

              <AnimatePresence>
                {gameOver && (
                  <motion.div
                    key="gameover-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 text-center"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl w-full max-w-[280px] border border-white/50"
                    >
                      <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Trophy className="text-violet-500" size={28} />
                      </div>
                      <h2 className="text-xl font-black text-gray-900 mb-1">
                        Game Over
                      </h2>
                      <p className="text-gray-500 text-xs mb-1">
                        최종 점수: {score}층
                      </p>
                      <p className="text-gray-400 text-[10px] mb-6">
                        최고 콤보: {maxConsecutivePerfects}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          initGame();
                        }}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                      >
                        다시 도전
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full lg:w-[380px] shrink-0 lg:h-full flex flex-col gap-6">
            <div className="hidden lg:block bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <div className="space-y-4 mb-8">
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMeRewarded ? "bg-violet-50 border-violet-100" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                      {myProfile?.avatar_url ? (
                        <img src={myProfile.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-black truncate max-w-[100px] ${isMeRewarded ? "text-violet-500" : "text-gray-600"}`}>
                        {myProfile?.nickname || "나"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        기록: {Math.max(score, bestScore)}층
                      </span>
                    </div>
                  </div>
                  {isMeRewarded ? (
                    <Star size={14} fill="currentColor" className="text-violet-500" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">도전 가능</span>
                  )}
                </div>

                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isPartnerRewarded ? "bg-violet-50 border-violet-100" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                      {partnerProfile?.avatar_url ? (
                        <img src={partnerProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-black truncate max-w-[100px] ${isPartnerRewarded ? "text-violet-500" : "text-gray-600"}`}>
                        {partnerProfile?.nickname || "상대방"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        기록: {partnerScore?.high_score || 0}층
                      </span>
                    </div>
                  </div>
                  {isPartnerRewarded ? (
                    <Star size={14} fill="currentColor" className="text-violet-500" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">도전 가능</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <RotateCcw size={14} /> Restart Game
              </button>
            </div>

            <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">
                <Info size={14} /> 게임 안내
              </div>
              <ul className="space-y-3">
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  25층을 쌓거나 5연속 콤보를 달성하면 미션 성공!
                </li>
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  하루 최대 2개의 게임에서 각각 150 포인트를 획득할 수 있습니다.
                </li>
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  블록을 완전히 놓치면 게임이 종료됩니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
