import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, User, Info, Star, Trophy } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useGameScore } from "../../hooks/useGameScore";
import { useHomeData } from "../../hooks/useHomeData";

interface Props {
  onBack: () => void;
}

// Constants
const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 540;
const BRICK_COLS = 6;
const BRICK_SIZE = CANVAS_WIDTH / BRICK_COLS;
const BALL_RADIUS = 5;
const TARGET_STAGE_FOR_REWARD = 100;
const SAVE_KEY = "daliary_brick_breaker_state_v1";
const ENCRYPTION_SALT = "dal_game_brick";

// Persistence Utilities
const encrypt = (data: any) => {
  try {
    const str = JSON.stringify(data);
    return btoa(encodeURIComponent(ENCRYPTION_SALT + str));
  } catch (e) {
    return "";
  }
};

const decrypt = (encoded: string | null) => {
  if (!encoded) return null;
  try {
    const decoded = decodeURIComponent(atob(encoded));
    if (decoded.startsWith(ENCRYPTION_SALT)) {
      return JSON.parse(decoded.substring(ENCRYPTION_SALT.length));
    }
  } catch (e) {
    return null;
  }
  return null;
};

type GameState = "idle" | "aiming" | "shooting" | "bricks_moving" | "game_over";

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  active: boolean;
}

interface Brick {
  id: string;
  col: number;
  row: number;
  hp: number;
  maxHp: number;
  type: "normal" | "add_ball";
}

export default function SwipeBrickBreaker({ onBack }: Props) {
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get("debug") === "true";

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load initial data immediately to avoid race conditions
  const savedData = useRef(decrypt(localStorage.getItem(SAVE_KEY))).current;

  const [gameState, setGameState] = useState<GameState>("idle");
  const [stage, setStage] = useState(savedData?.stage || 1);
  const [ballCount, setBallCount] = useState(savedData?.ballCount || 1);
  const [showRewardToast, setShowRewardToast] = useState(false);

  const { myProfile, partnerProfile } = useHomeData();
  const { scores, myScore, recordResult } = useGameScore("brick_breaker");

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
  const isPartnerRewarded =
    !!partnerProfile && partnerScore?.last_reward_date === today;

  // Game Logic State
  const bricksRef = useRef<Brick[]>(savedData?.bricks || []);
  const ballsRef = useRef<Ball[]>([]);
  const shootOriginRef = useRef(
    savedData?.origin || { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 20 },
  );
  const aimVectorRef = useRef({ dx: 0, dy: -1 });
  const nextShootOriginXRef = useRef<number | null>(null);

  const saveGameState = useCallback(() => {
    if (gameState === "game_over") return;
    const state = {
      stage,
      ballCount,
      bricks: bricksRef.current,
      origin: shootOriginRef.current,
      date: today,
    };
    localStorage.setItem(SAVE_KEY, encrypt(state));
  }, [stage, ballCount, today, gameState]);

  // Initialize Bricks for a new stage
  const spawnBricks = useCallback(
    (currentStage: number) => {
      const newBricks: Brick[] = [];

      // 1. 공 추가 아이템 확률 (90%)
      const hasAddBall = Math.random() < 0.9;
      let addBallCol = -1;
      if (hasAddBall) {
        addBallCol = Math.floor(Math.random() * BRICK_COLS);
        newBricks.push({
          id: "ball-" + Math.random().toString(36).substr(2, 9),
          col: addBallCol,
          row: 0,
          hp: 1,
          maxHp: 1,
          type: "add_ball",
        });
      }

      // 2. 벽돌 개수 결정
      // 2개: 10%, 3개: 20%, 4개: 30%, 5개: 40%
      const rand = Math.random();
      let brickCount = 5;
      if (rand < 0.1) brickCount = 2;
      else if (rand < 0.3) brickCount = 3;
      else if (rand < 0.6) brickCount = 4;
      else brickCount = 5;

      // 벽돌을 배치할 수 있는 열 목록 (공 추가 아이템이 있는 열 제외)
      const availableCols: number[] = [];
      for (let i = 0; i < BRICK_COLS; i++) {
        if (i !== addBallCol) availableCols.push(i);
      }

      // 셔플하여 앞에서부터 brickCount만큼 선택
      const shuffledCols = [...availableCols].sort(() => Math.random() - 0.5);
      const selectedCols = shuffledCols.slice(
        0,
        Math.min(brickCount, shuffledCols.length),
      );

      selectedCols.forEach((col) => {
        newBricks.push({
          id: Math.random().toString(36).substr(2, 9),
          col,
          row: 0,
          hp: currentStage,
          maxHp: currentStage,
          type: "normal",
        });
      });

      bricksRef.current = bricksRef.current.map((b) => ({
        ...b,
        row: b.row + 1,
      }));
      bricksRef.current = [...bricksRef.current, ...newBricks];

      if (bricksRef.current.some((b) => b.row >= 8 && b.type === "normal")) {
        setGameState("game_over");
        localStorage.removeItem(SAVE_KEY);
        recordResult.mutate({
          score: currentStage,
          reachedTarget: currentStage >= TARGET_STAGE_FOR_REWARD,
        });
      }
    },
    [recordResult],
  );

  useEffect(() => {
    // If no bricks were loaded (new game or corrupted save), spawn initial bricks
    if (bricksRef.current.length === 0) {
      spawnBricks(1);
    }
  }, [spawnBricks]);

  useEffect(() => {
    if (gameState === "idle") saveGameState();
  }, [gameState, saveGameState]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameState === "shooting") {
        let allReturned = true;

        ballsRef.current.forEach((ball) => {
          if (!ball.active) return;
          allReturned = false;

          ball.x += ball.dx * 10;
          ball.y += ball.dy * 10;

          if (ball.x <= BALL_RADIUS || ball.x >= CANVAS_WIDTH - BALL_RADIUS) {
            ball.dx *= -1;
            ball.x =
              ball.x <= BALL_RADIUS ? BALL_RADIUS : CANVAS_WIDTH - BALL_RADIUS;
          }
          if (ball.y <= BALL_RADIUS) {
            ball.dy *= -1;
            ball.y = BALL_RADIUS;
          }

          if (ball.y >= CANVAS_HEIGHT - BALL_RADIUS) {
            ball.active = false;
            if (nextShootOriginXRef.current === null) {
              nextShootOriginXRef.current = ball.x;
            }
          }

          for (let i = bricksRef.current.length - 1; i >= 0; i--) {
            const brick = bricksRef.current[i];
            const bx = brick.col * BRICK_SIZE;
            const by = brick.row * BRICK_SIZE;

            if (
              ball.x + BALL_RADIUS > bx &&
              ball.x - BALL_RADIUS < bx + BRICK_SIZE &&
              ball.y + BALL_RADIUS > by &&
              ball.y - BALL_RADIUS < by + BRICK_SIZE
            ) {
              if (brick.type === "add_ball") {
                setBallCount((prev) => prev + 1);
                bricksRef.current.splice(i, 1);
                continue;
              }

              const overlapLeft = ball.x + BALL_RADIUS - bx;
              const overlapRight = bx + BRICK_SIZE - (ball.x - BALL_RADIUS);
              const overlapTop = ball.y + BALL_RADIUS - by;
              const overlapBottom = by + BRICK_SIZE - (ball.y - BALL_RADIUS);

              const minOverlap = Math.min(
                overlapLeft,
                overlapRight,
                overlapTop,
                overlapBottom,
              );

              if (minOverlap === overlapLeft || minOverlap === overlapRight)
                ball.dx *= -1;
              else ball.dy *= -1;

              brick.hp -= 1;
              if (brick.hp <= 0) bricksRef.current.splice(i, 1);
              break;
            }
          }
        });

        if (allReturned && ballsRef.current.length > 0) {
          setGameState("idle");
          if (nextShootOriginXRef.current !== null) {
            shootOriginRef.current.x = nextShootOriginXRef.current;
          }
          nextShootOriginXRef.current = null;
          ballsRef.current = [];

          const nextStage = stage + 1;
          setStage(nextStage);
          spawnBricks(nextStage);

          if (nextStage === TARGET_STAGE_FOR_REWARD && !isMeRewarded) {
            recordResult.mutate({ score: nextStage, reachedTarget: true });
            setShowRewardToast(true);
            setTimeout(() => setShowRewardToast(false), 3000);
          }
        }
      }

      draw();
      animationFrameId = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      bricksRef.current.forEach((brick) => {
        const bx = brick.col * BRICK_SIZE;
        const by = brick.row * BRICK_SIZE;
        const padding = 2;

        if (brick.type === "normal") {
          // Color depends purely on HP
          const hue = (brick.hp * 10) % 360;
          const opacity = 0.7 + (brick.hp / (stage + 1)) * 0.3;
          ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${opacity})`;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.roundRect(
            bx + padding,
            by + padding,
            BRICK_SIZE - padding * 2,
            BRICK_SIZE - padding * 2,
            8,
          );
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            brick.hp.toString(),
            bx + BRICK_SIZE / 2,
            by + BRICK_SIZE / 2,
          );
        } else {
          // Add Ball Item
          ctx.beginPath();
          ctx.arc(
            bx + BRICK_SIZE / 2,
            by + BRICK_SIZE / 2,
            BALL_RADIUS + 5,
            0,
            Math.PI * 2,
          );
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(
            bx + BRICK_SIZE / 2,
            by + BRICK_SIZE / 2,
            BALL_RADIUS,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.fillStyle = "#10b981";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("+", bx + BRICK_SIZE / 2, by + BRICK_SIZE / 2);
        }
      });

      if (gameState === "shooting" && nextShootOriginXRef.current !== null) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(
          nextShootOriginXRef.current,
          shootOriginRef.current.y,
          BALL_RADIUS,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = "#10b981";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(16, 185, 129, 0.5)";

      if (gameState === "idle" || gameState === "aiming") {
        ctx.beginPath();
        ctx.arc(
          shootOriginRef.current.x,
          shootOriginRef.current.y,
          BALL_RADIUS,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      ballsRef.current.forEach((ball) => {
        if (!ball.active) return;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      if (gameState === "aiming") {
        let endX = shootOriginRef.current.x;
        let endY = shootOriginRef.current.y;
        const dx = aimVectorRef.current.dx;
        const dy = aimVectorRef.current.dy;

        let dist = 0;
        const maxDist = 800;
        const step = 4;
        let hit = false;

        while (dist < maxDist && !hit) {
          dist += step;
          const tx = shootOriginRef.current.x + dx * dist;
          const ty = shootOriginRef.current.y + dy * dist;

          if (tx <= 0 || tx >= CANVAS_WIDTH || ty <= 0) {
            hit = true;
            endX = tx;
            endY = ty;
            break;
          }

          for (const brick of bricksRef.current) {
            if (brick.type !== "normal") continue;
            const bx = brick.col * BRICK_SIZE;
            const by = brick.row * BRICK_SIZE;
            if (
              tx > bx &&
              tx < bx + BRICK_SIZE &&
              ty > by &&
              ty < by + BRICK_SIZE
            ) {
              hit = true;
              endX = tx;
              endY = ty;
              break;
            }
          }
          if (!hit) {
            endX = tx;
            endY = ty;
          }
        }

        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(shootOriginRef.current.x, shootOriginRef.current.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(endX, endY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.fill();
      }
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, spawnBricks, stage, isMeRewarded, recordResult]);

  const handlePointerDown = () => {
    if (gameState !== "idle") return;
    setGameState("aiming");
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== "aiming") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - shootOriginRef.current.x;
    const dy = y - shootOriginRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dy < -20) aimVectorRef.current = { dx: dx / dist, dy: dy / dist };
  };

  const handlePointerUp = () => {
    if (gameState !== "aiming") return;
    setGameState("shooting");
    for (let i = 0; i < ballCount; i++) {
      setTimeout(() => {
        ballsRef.current.push({
          x: shootOriginRef.current.x,
          y: shootOriginRef.current.y,
          dx: aimVectorRef.current.dx,
          dy: aimVectorRef.current.dy,
          active: true,
        });
      }, i * 80);
    }
  };

  const resetGame = () => {
    if (confirm("게임을 초기화하시겠습니까?")) {
      setStage(1);
      setBallCount(1);
      bricksRef.current = [];
      ballsRef.current = [];
      shootOriginRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 20 };
      localStorage.removeItem(SAVE_KEY);
      spawnBricks(1);
      setGameState("idle");
    }
  };

  const skipTo99 = () => {
    setStage(99);
    setBallCount(50);
    bricksRef.current = bricksRef.current.map((b) => ({ ...b, hp: 1 }));
    setGameState("idle");
  };

  return (
    <div className="flex-1 bg-gray-50/30 flex flex-col relative lg:h-full lg:overflow-hidden overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
      <AnimatePresence>
        {showRewardToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl font-black flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm whitespace-nowrap w-max"
          >
            <Star size={20} fill="currentColor" />
            <span>100 스테이지 달성! 100포인트 적립 ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1600px] mx-auto px-4 py-6 lg:py-10 lg:h-full lg:flex lg:flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-white border border-emerald-100 rounded-2xl text-gray-400 hover:text-emerald-500 shadow-sm transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">
                벽돌깨기
              </h2>
              <p className="text-gray-400 text-xs font-medium">
                스와이프하여 모든 벽돌을 부수세요!
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="bg-white border-emerald-50 px-4 py-2 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Stage
              </p>
              <p className="text-lg font-black text-emerald-500 leading-none mt-1">
                {stage}
              </p>
            </div>
            <div className="flex bg-emerald-500 rounded-2xl shadow-md  border-emerald-400 overflow-hidden min-w-[140px]">
              <div className="flex-1 px-3 py-2 text-center  border-emerald-400/30">
                <p className="text-[9px] text-emerald-100 font-black uppercase tracking-widest">
                  나의 기록
                </p>
                <p className="text-base font-black text-white leading-none mt-1">
                  {Math.max(stage, myScore?.high_score || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex-1 px-3 py-2 text-center bg-emerald-600/20">
                <p className="text-[9px] text-emerald-100 font-black uppercase tracking-widest truncate">
                  {partnerProfile?.nickname?.slice(0, 3) || "상대방"}의 기록
                </p>
                <p className="text-base font-black text-white leading-none mt-1">
                  {(partnerScore?.high_score || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start lg:flex-1 lg:min-h-0 mt-2">
          <div className="w-full lg:flex-1 flex flex-col items-center justify-center lg:h-full">
            {/* Mobile Header Overlay: Rewards (Left) & Actions/Scores (Right) */}
            <div className="flex sm:hidden items-center justify-between w-full max-w-[340px] mb-4 px-2">
              {/* Left: Reward Status with Avatars */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`relative w-9 h-9 rounded-full border-2 transition-all ${isMeRewarded ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`}
                >
                  {myProfile?.avatar_url ? (
                    <img
                      src={myProfile.avatar_url}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {myProfile?.nickname?.slice(0, 1)}
                    </div>
                  )}
                  {isMeRewarded && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div
                  className={`relative w-9 h-9 rounded-full border-2 transition-all ${isPartnerRewarded ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`}
                >
                  {partnerProfile?.avatar_url ? (
                    <img
                      src={partnerProfile.avatar_url}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {partnerProfile?.nickname?.slice(0, 1) || "P"}
                    </div>
                  )}
                  {isPartnerRewarded && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions and Compact Scores */}
              <div className="flex items-center gap-3">
                <button
                  onClick={resetGame}
                  className="p-2 bg-gray-900 text-white rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  <RotateCcw size={16} />
                </button>
                <div className="flex flex-col items-end leading-tight min-w-[80px]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                      Stage
                    </span>
                    <span className="text-base font-black text-emerald-500 leading-none">
                      {stage}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                      Best
                    </span>
                    <span className="text-[10px] font-black text-gray-700 leading-none">
                      {Math.max(
                        stage,
                        myScore?.high_score || 0,
                      ).toLocaleString()}
                    </span>
                    <span className="text-[8px] font-bold text-gray-300">
                      /
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 leading-none">
                      {(partnerScore?.high_score || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-3 bg-emerald-100/20 rounded-[42px] border-[6px] border-white shadow-2xl w-[340px] aspect-[340/540] overflow-hidden group touch-none">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full rounded-[32px] bg-white/40 shadow-inner"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              <AnimatePresence>
                {gameState === "game_over" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 bg-emerald-900/40 backdrop-blur-md rounded-[32px] flex items-center justify-center p-6 text-center"
                  >
                    <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl w-full max-w-[280px] border border-white/50">
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Trophy className="text-emerald-500" size={28} />
                      </div>
                      <h2 className="text-xl font-black text-gray-900 mb-1">
                        Game Over
                      </h2>
                      <p className="text-gray-500 text-xs mb-6">
                        최종 스테이지: {stage}
                      </p>
                      <button
                        onClick={resetGame}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                      >
                        다시 도전
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isDebug && (
              <button
                onClick={skipTo99}
                className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-200 active:scale-95 transition-all animate-pulse"
              >
                [DEBUG] Skip to Stage 99
              </button>
            )}
          </div>

          <div className="w-full lg:w-[380px] shrink-0 lg:h-full flex flex-col gap-6">
            <div className="hidden lg:block bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <div className="space-y-4 mb-8">
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border ${isMeRewarded ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                      {myProfile?.avatar_url ? (
                        <img
                          src={myProfile.avatar_url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-black truncate max-w-[100px] ${isMeRewarded ? "text-emerald-500" : "text-gray-600"}`}
                      >
                        {myProfile?.nickname || "나"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        최고: {Math.max(stage, myScore?.high_score || 0)}
                      </span>
                    </div>
                  </div>
                  {isMeRewarded ? (
                    <Star
                      size={14}
                      fill="currentColor"
                      className="text-emerald-500"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                      도전 가능
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border ${isPartnerRewarded ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                      {partnerProfile?.avatar_url ? (
                        <img
                          src={partnerProfile.avatar_url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-black truncate max-w-[100px] ${isPartnerRewarded ? "text-emerald-500" : "text-gray-600"}`}
                      >
                        {partnerProfile?.nickname || "상대방"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        최고: {partnerScore?.high_score || 0}
                      </span>
                    </div>
                  </div>
                  {isPartnerRewarded ? (
                    <Star
                      size={14}
                      fill="currentColor"
                      className="text-emerald-500"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                      도전 가능
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={resetGame}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <RotateCcw size={14} /> Restart
              </button>
            </div>

            <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">
                <Info size={14} /> 게임 규칙
              </div>
              <ul className="space-y-3">
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  스와이프하여 각도를 조절하고 공을 발사하세요.
                </li>
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  벽돌이 바닥에 닿으면 게임이 종료됩니다.
                </li>
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-emerald-300 rounded-full mt-1.5 shrink-0" />
                  100 스테이지를 달성하면 100 포인트를 획득합니다!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
