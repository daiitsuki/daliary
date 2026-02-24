import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Star, ChevronLeft, User, Info } from "lucide-react";
import Matter from "matter-js";
import { useGameScore } from "../../hooks/useGameScore";
import { useHomeData } from "../../hooks/useHomeData";

// Asset Imports
import cherryImg from "../../assets/cherry.png";
import strawberryImg from "../../assets/strawberry.png";
import tangerineImg from "../../assets/tangerine.png";
import grapeImg from "../../assets/grape.png";
import persimmonImg from "../../assets/persimmon.png";
import appleImg from "../../assets/apple.png";
import pearImg from "../../assets/pear.png";
import peachImg from "../../assets/peach.png";
import pineappleImg from "../../assets/pineapple.png";
import melonImg from "../../assets/melon.png";
import watermelonImg from "../../assets/watermelon.png";

type FruitType =
  | "cherry"
  | "strawberry"
  | "tangerine"
  | "grape"
  | "persimmon"
  | "apple"
  | "pear"
  | "peach"
  | "pineapple"
  | "melon"
  | "watermelon";

interface FruitConfig {
  type: FruitType;
  radius: number;
  score: number;
  image: string;
  width: number;
  height: number;
  visualScaling: number;
  next: FruitType | null;
}

const FRUIT_CONFIGS: Record<FruitType, FruitConfig> = {
  cherry: {
    type: "cherry",
    radius: 18,
    score: 2,
    image: cherryImg,
    width: 164,
    height: 179,
    visualScaling: 1.0,
    next: "strawberry",
  },
  strawberry: {
    type: "strawberry",
    radius: 20,
    score: 4,
    image: strawberryImg,
    width: 123,
    height: 156,
    visualScaling: 1.0,
    next: "tangerine",
  },
  tangerine: {
    type: "tangerine",
    radius: 27,
    score: 6,
    image: tangerineImg,
    width: 144,
    height: 139,
    visualScaling: 1.0,
    next: "grape",
  },
  grape: {
    type: "grape",
    radius: 34,
    score: 8,
    image: grapeImg,
    width: 145,
    height: 190,
    visualScaling: 1.0,
    next: "persimmon",
  },
  persimmon: {
    type: "persimmon",
    radius: 42,
    score: 10,
    image: persimmonImg,
    width: 164,
    height: 158,
    visualScaling: 1.0,
    next: "apple",
  },
  apple: {
    type: "apple",
    radius: 52,
    score: 12,
    image: appleImg,
    width: 153,
    height: 152,
    visualScaling: 1.03,
    next: "pear",
  },
  pear: {
    type: "pear",
    radius: 62,
    score: 14,
    image: pearImg,
    width: 146,
    height: 167,
    visualScaling: 1.0,
    next: "peach",
  },
  peach: {
    type: "peach",
    radius: 75,
    score: 16,
    image: peachImg,
    width: 165,
    height: 170,
    visualScaling: 1.0,
    next: "pineapple",
  },
  pineapple: {
    type: "pineapple",
    radius: 80,
    score: 18,
    image: pineappleImg,
    width: 174,
    height: 205,
    visualScaling: 1.0,
    next: "melon",
  },
  melon: {
    type: "melon",
    radius: 105,
    score: 20,
    image: melonImg,
    width: 187,
    height: 205,
    visualScaling: 1.03,
    next: "watermelon",
  },
  watermelon: {
    type: "watermelon",
    radius: 130,
    score: 22,
    image: watermelonImg,
    width: 357,
    height: 358,
    visualScaling: 1.0,
    next: null,
  },
};

const SPAWNABLE_FRUITS: FruitType[] = [
  "cherry",
  "strawberry",
  "tangerine",
  "grape",
  "persimmon",
];
const WORLD_WIDTH = 340;
const WORLD_HEIGHT = 540;
const DEADLINE_Y = 60;
const SPAWN_Y = 40;
const SAVE_KEY = "daliary_watermelon_state_v1";
const ENCRYPTION_SALT = "dal_game_watermelon";

interface WatermelonGameProps {
  onBack: () => void;
}

export default function WatermelonGame({ onBack }: WatermelonGameProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const previewBodyRef = useRef<Matter.Body | null>(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [currentFruit, setCurrentFruit] = useState<FruitType>("cherry");
  const [nextFruit, setNextFruit] = useState<FruitType>("cherry");
  const [currentFruitX, setCurrentFruitX] = useState(WORLD_WIDTH / 2);
  const [canDrop, setCanDrop] = useState(true);
  const [reachedWatermelon, setReachedWatermelon] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(false); // 이 판에서 보상을 받았는지 여부
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);

  // Stats refs to prevent effect re-triggers and stale closures in physics loop
  const scoreRef = useRef(score);
  const reachedRef = useRef(reachedWatermelon);
  const gameOverRef = useRef(gameOver);
  const overflowStartRef = useRef<number | null>(null);
  const lastDangerTimeRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    reachedRef.current = reachedWatermelon;
  }, [reachedWatermelon]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const { myProfile, partnerProfile } = useHomeData();
  const { scores, myScore, recordResult } = useGameScore("watermelon");
  const recordResultRef = useRef(recordResult);
  useEffect(() => {
    recordResultRef.current = recordResult;
  }, [recordResult]);

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

  useEffect(() => {
    if (myScore) setBestScore(myScore.high_score);
  }, [myScore]);

  const encrypt = (data: any) => {
    const str = JSON.stringify(data);
    return btoa(encodeURIComponent(ENCRYPTION_SALT + str));
  };

  const decrypt = (encoded: string) => {
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

  const getRandomFruit = () =>
    SPAWNABLE_FRUITS[Math.floor(Math.random() * SPAWNABLE_FRUITS.length)];

  const createFruit = (
    x: number,
    y: number,
    type: FruitType,
    isStatic = false,
  ) => {
    const config = FRUIT_CONFIGS[type];
    const scale =
      (config.radius * 2 * config.visualScaling) /
      Math.min(config.width, config.height);
    const fruit = Matter.Bodies.circle(x, y, config.radius, {
      label: type,
      isStatic,
      render: {
        sprite: { texture: config.image, xScale: scale, yScale: scale },
      },
      restitution: 0.3,
      friction: 0.1,
    });
    return fruit;
  };

  // Sync Matter-based preview body
  useEffect(() => {
    if (previewBodyRef.current && engineRef.current) {
      Matter.World.remove(engineRef.current.world, previewBodyRef.current);
      const newPreview = createFruit(
        currentFruitX,
        SPAWN_Y,
        currentFruit,
        true,
      );
      newPreview.isSensor = true;
      newPreview.render.opacity = 0.6;
      newPreview.render.visible = canDrop && !gameOver;
      previewBodyRef.current = newPreview;
      Matter.World.add(engineRef.current.world, newPreview);
    }
  }, [currentFruit]);

  useEffect(() => {
    if (previewBodyRef.current) {
      previewBodyRef.current.render.visible = canDrop && !gameOver;
    }
  }, [canDrop, gameOver]);

  const initGame = useCallback(() => {
    if (!sceneRef.current) return;

    if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      renderRef.current.canvas.remove();
    }
    if (engineRef.current) Matter.Engine.clear(engineRef.current);

    const engine = Matter.Engine.create({ enableSleeping: false });
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    renderRef.current = render;

    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    const wallOptions = { isStatic: true, render: { visible: false } };
    const ground = Matter.Bodies.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT + 10,
      WORLD_WIDTH,
      50,
      wallOptions,
    );
    const leftWall = Matter.Bodies.rectangle(
      -25,
      WORLD_HEIGHT / 2,
      50,
      WORLD_HEIGHT,
      wallOptions,
    );
    const rightWall = Matter.Bodies.rectangle(
      WORLD_WIDTH + 25,
      WORLD_HEIGHT / 2,
      50,
      WORLD_HEIGHT,
      wallOptions,
    );

    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    // Preview body initialization
    const initialFruit = getRandomFruit();
    setCurrentFruit(initialFruit);
    const preview = createFruit(WORLD_WIDTH / 2, SPAWN_Y, initialFruit, true);
    preview.isSensor = true;
    preview.render.opacity = 0.6;
    previewBodyRef.current = preview;
    Matter.World.add(engine.world, preview);

    // Collision Event
    Matter.Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (
          bodyA.label === bodyB.label &&
          bodyA.label !== "Rectangle Body" &&
          !bodyA.isStatic &&
          !bodyB.isStatic
        ) {
          const type = bodyA.label as FruitType;
          if (FRUIT_CONFIGS[type].next) {
            const nextType = FRUIT_CONFIGS[type].next as FruitType;
            const newX = (bodyA.position.x + bodyB.position.x) / 2;
            const newY = (bodyA.position.y + bodyB.position.y) / 2;
            Matter.World.remove(engine.world, [bodyA, bodyB]);
            const nextFruitBody = createFruit(newX, newY, nextType);
            Matter.World.add(engine.world, nextFruitBody);
            setScore((prev) => prev + FRUIT_CONFIGS[nextType].score);
            if (nextType === "watermelon") setReachedWatermelon(true);
          }
        }
      });
    });

    // Integrated Game Over Detection
    Matter.Events.on(engine, "afterUpdate", () => {
      if (gameOverRef.current) return;

      const bodies = engine.world.bodies.filter(
        (b) => !b.isStatic && !b.isSensor,
      );

      // Show deadline line if any fruit is getting close AND stable
      // Ignore fruits near the spawn point (y < SPAWN_Y + 20)
      const isFruitInDangerZone = bodies.some(
        (b) =>
          b.position.y < DEADLINE_Y + 150 &&
          b.position.y > SPAWN_Y + 20 &&
          Math.abs(b.velocity.y) < 2.5,
      );

      if (isFruitInDangerZone) {
        lastDangerTimeRef.current = Date.now();
      }

      // Keep showing deadline for 1 second after threat is gone to prevent flickering
      const nearDeadline = Date.now() - lastDangerTimeRef.current < 1000;
      setShowDeadline((prev) => (prev !== nearDeadline ? nearDeadline : prev));

      const hasOverflow = bodies.some(
        (b) => b.position.y < DEADLINE_Y && Math.abs(b.velocity.y) < 0.8,
      );

      if (hasOverflow) {
        if (overflowStartRef.current === null)
          overflowStartRef.current = Date.now();
        const elapsed = Date.now() - overflowStartRef.current;
        if (elapsed > 100) setIsOverflowing(true);
        if (elapsed > 5000) {
          setGameOver(true);
          gameOverRef.current = true;
          localStorage.removeItem(SAVE_KEY);
          recordResultRef.current.mutate({
            score: scoreRef.current,
            reachedTarget: reachedRef.current,
          });
        }
      } else {
        const anyBodyNear = bodies.some((b) => b.position.y < DEADLINE_Y + 15);
        if (!anyBodyNear) {
          overflowStartRef.current = null;
          setIsOverflowing(false);
        }
      }
    });

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    setScore(0);
    setGameOver(false);
    setReachedWatermelon(false);
    setRewardEarned(false);
    setNextFruit(getRandomFruit());
    setCanDrop(true);
    setIsOverflowing(false);
    setShowDeadline(false);
    overflowStartRef.current = null;
    lastDangerTimeRef.current = 0;

    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = decrypt(saved);
      if (parsed && parsed.fruits) {
        setScore(parsed.score || 0);
        setReachedWatermelon(parsed.reachedWatermelon || false);
        setRewardEarned(parsed.rewardEarned || false);
        parsed.fruits.forEach((f: any) => {
          const body = createFruit(f.x, f.y, f.type as FruitType);
          Matter.World.add(engine.world, body);
        });
      }
    }
  }, []);

  // Stable initialization - ONLY run once on mount
  useEffect(() => {
    initGame();
    return () => {
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (renderRef.current) Matter.Render.stop(renderRef.current);
    };
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (engineRef.current && !gameOver) {
        const fruits = engineRef.current.world.bodies
          .filter(
            (b) =>
              !b.isStatic && !b.isSensor && FRUIT_CONFIGS[b.label as FruitType],
          )
          .map((b) => ({ x: b.position.x, y: b.position.y, type: b.label }));
        if (fruits.length > 0) {
          const state = {
            fruits,
            score,
            reachedWatermelon,
            rewardEarned,
            date: today,
          };
          localStorage.setItem(SAVE_KEY, encrypt(state));
        }
      }
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [score, reachedWatermelon, rewardEarned, today, gameOver]);

  useEffect(() => {
    // 오늘 보상을 받지 않았고, 이 판에서도 보상을 받은 적이 없을 때만 보상 지급
    if (
      reachedWatermelon &&
      !isMeRewarded &&
      !rewardEarned &&
      !showRewardToast
    ) {
      setShowRewardToast(true);
      setTimeout(() => setShowRewardToast(false), 3000);
      recordResult.mutate({ score, reachedTarget: true });
      setRewardEarned(true); // 이 판은 이제 보상을 받은 판으로 기록됨
    }
  }, [
    reachedWatermelon,
    isMeRewarded,
    rewardEarned,
    score,
    recordResult,
    showRewardToast,
  ]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameOver || !canDrop) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    let clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    let x = clientX - rect.left;
    const radius = FRUIT_CONFIGS[currentFruit].radius;
    x = Math.max(radius, Math.min(x, WORLD_WIDTH - radius));

    setCurrentFruitX(x);
    if (previewBodyRef.current) {
      Matter.Body.setPosition(previewBodyRef.current, { x, y: SPAWN_Y });
    }
  };

  const performDrop = (x: number) => {
    if (gameOver || !canDrop || !engineRef.current) return;
    const fruit = createFruit(x, SPAWN_Y, currentFruit);
    Matter.World.add(engineRef.current.world, fruit);
    setCanDrop(false);
    setTimeout(() => {
      setCurrentFruit(nextFruit);
      setNextFruit(getRandomFruit());
      setCanDrop(true);
    }, 800);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameOver || !canDrop) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = e.touches[0].clientX - rect.left;
    const radius = FRUIT_CONFIGS[currentFruit].radius;
    x = Math.max(radius, Math.min(x, WORLD_WIDTH - radius));
    setCurrentFruitX(x);
    if (previewBodyRef.current) {
      Matter.Body.setPosition(previewBodyRef.current, { x, y: SPAWN_Y });
    }
    performDrop(x);
  };

  const handleRestart = () => {
    if (confirm("현재 진행 중인 게임을 초기화하고 새 게임을 시작할까요?")) {
      localStorage.removeItem(SAVE_KEY);
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
            className="fixed top-20 left-1/2 z-[100] bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-xl font-black flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm whitespace-nowrap w-max"
          >
            <Star size={20} fill="currentColor" />
            <span>수박 완성! 100포인트 적립 ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1600px] mx-auto px-4 py-6 lg:py-10 lg:h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-white border border-rose-100 rounded-2xl text-gray-400 hover:text-rose-500 shadow-sm transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">
                수박 게임
              </h2>
              <p className="text-gray-400 text-xs font-medium">
                과일을 합쳐서 커다란 수박을 만드세요!
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="bg-white border border-rose-50 px-4 py-2 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                현재 점수
              </p>
              <p className="text-lg font-black text-rose-500 leading-none mt-1">
                {score}
              </p>
            </div>
            <div className="bg-rose-500 px-4 py-2 rounded-2xl shadow-md text-center border border-rose-400">
              <p className="text-[10px] text-rose-100 font-black uppercase tracking-widest">
                최고 기록
              </p>
              <p className="text-lg font-black text-white leading-none mt-1">
                {Math.max(score, bestScore)}
              </p>
            </div>
          </div>
        </div>

        {/* Layout Split like Calendar.tsx */}
        <div className="flex flex-col lg:flex-row gap-10 items-start lg:flex-1 lg:min-h-0 mt-2">
          {/* Main Content (Left): Game Board Area */}
          <div className="w-full lg:flex-1 flex flex-col items-center justify-center lg:h-full">
            {/* Mobile Header Overlay: Rewards (Left), Next Fruit (Center) & Actions/Scores (Right) */}
            <div className="flex sm:hidden items-center justify-between w-full max-w-[340px] mb-4 px-2">
              {/* Left: Reward Status with Avatars */}
              <div className="flex items-center gap-2 flex-1 justify-start">
                <div
                  className={`relative w-8 h-8 rounded-full border-2 transition-all ${isMeRewarded ? "border-rose-500 bg-rose-50" : "border-gray-200 bg-white"}`}
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
                    <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div
                  className={`relative w-8 h-8 rounded-full border-2 transition-all ${isPartnerRewarded ? "border-rose-500 bg-rose-50" : "border-gray-200 bg-white"}`}
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
                    <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Next Fruit Indicator */}
              <div className="flex flex-col items-center flex-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                  Next
                </p>
                <div className="w-9 h-9 flex items-center justify-center bg-white/50 rounded-xl border border-white/80 shadow-sm">
                  <motion.img
                    key={nextFruit}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={FRUIT_CONFIGS[nextFruit].image}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>

              {/* Right: Actions and Compact Scores */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                <button
                  onClick={handleRestart}
                  className="p-2 bg-gray-900 text-white rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  <RotateCcw size={14} />
                </button>
                <div className="flex flex-col items-end leading-tight">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                      Score
                    </span>
                    <span className="text-sm font-black text-rose-500">
                      {score}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                      Best
                    </span>
                    <span className="text-xs font-black text-gray-700">
                      {Math.max(score, bestScore)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative bg-white/40 backdrop-blur-md rounded-[32px] border-[6px] border-white shadow-2xl overflow-hidden touch-none box-content mb-6 lg:mb-0"
              style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT }}
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onClick={() => performDrop(currentFruitX)}
            >
              {/* Visible Deadline */}
              <AnimatePresence>
                {showDeadline && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute left-0 w-full h-1.5 transition-all duration-200 z-10 ${
                      isOverflowing
                        ? "bg-rose-600 border-b-2 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,1)] animate-pulse"
                        : "bg-rose-400/30 border-t border-dashed border-rose-400/50"
                    }`}
                    style={{ top: `${DEADLINE_Y}px` }}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isOverflowing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-rose-500/40 to-transparent pointer-events-none z-0"
                    style={{ height: `${DEADLINE_Y}px` }}
                  />
                )}
              </AnimatePresence>

              <div ref={sceneRef} className="w-full h-full" />

              <AnimatePresence>
                {gameOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 bg-rose-900/40 backdrop-blur-md flex items-center justify-center p-6 text-center"
                  >
                    <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl w-full max-w-[280px] border border-white/50">
                      <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Trophy className="text-rose-500" size={28} />
                      </div>
                      <h2 className="text-xl font-black text-gray-900 mb-1">
                        Game Over
                      </h2>
                      <p className="text-gray-500 text-xs mb-1">
                        최종 점수: {score}
                      </p>
                      <div className="h-4" />
                      <button
                        onClick={handleRestart}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                      >
                        다시 도전
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full lg:w-[380px] shrink-0 lg:h-full flex flex-col gap-6">
            <div className="hidden lg:block bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <div className="hidden lg:flex flex-col items-center mb-8">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">
                  다음 과일
                </p>
                <div className="w-24 h-24 bg-gray-50 rounded-3xl border border-gray-100 p-4 shadow-inner flex items-center justify-center">
                  <motion.img
                    key={nextFruit}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={FRUIT_CONFIGS[nextFruit].image}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMeRewarded ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-gray-50 border-gray-100 text-gray-400"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                      {myProfile?.avatar_url ? (
                        <img
                          src={myProfile.avatar_url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                    <span className="text-xs font-black truncate max-w-[100px]">
                      {myProfile?.nickname || "나"}
                    </span>
                  </div>
                  {isMeRewarded ? (
                    <Star size={14} fill="currentColor" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                      도전 가능
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isPartnerRewarded ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-gray-50 border-gray-100 text-gray-400"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                      {partnerProfile?.avatar_url ? (
                        <img
                          src={partnerProfile.avatar_url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                    <span className="text-xs font-black truncate max-w-[100px]">
                      {partnerProfile?.nickname || "상대방"}
                    </span>
                  </div>
                  {isPartnerRewarded ? (
                    <Star size={14} fill="currentColor" />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                      도전 가능
                    </span>
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
                <Info size={14} /> 게임 방법
              </div>
              <ul className="space-y-3">
                <li className="text-[11px] text-gray-400 font-medium flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  클릭한 위치에 과일이 떨어집니다.
                </li>
                <li className="text-[11px] text-gray-400 font-medium flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  같은 과일 2개가 합쳐지면 다음 단계의 과일이 됩니다.
                </li>
                <li className="text-[11px] text-gray-400 font-medium flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  과일이 상단 선을 넘어가면 게임 오버!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
