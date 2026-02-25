import { useSearchParams } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Gamepad2, Sparkles, Play, Check, Timer, Grid3X3 } from "lucide-react";
import Game2048 from "../components/games/Game2048";
import BlindTimerGame from "../components/games/BlindTimerGame";
import WatermelonGame from "../components/games/WatermelonGame";
import SwipeBrickBreaker from "../components/games/SwipeBrickBreaker";
import { useGameScore } from "../hooks/useGameScore";

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGame = searchParams.get("game");
  const { myScore: score2048 } = useGameScore("2048");
  const { myScore: scoreWatermelon } = useGameScore("watermelon");
  const { myScore: scoreBrickBreaker } = useGameScore("brick_breaker");

  const today = new Date()
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .replace(/\. /g, "-")
    .replace(/\./g, "");

  const is2048Rewarded = score2048?.last_reward_date === today;
  const isWatermelonRewarded = scoreWatermelon?.last_reward_date === today;
  const isBrickBreakerRewarded = scoreBrickBreaker?.last_reward_date === today;

  const handleSelectGame = (gameId: string) => {
    setSearchParams({ game: gameId });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (selectedGame === "2048") {
    return <Game2048 onBack={handleBack} />;
  }

  if (selectedGame === "blind-timer") {
    return <BlindTimerGame onBack={handleBack} />;
  }

  if (selectedGame === "watermelon") {
    return <WatermelonGame onBack={handleBack} />;
  }

  if (selectedGame === "brick-breaker") {
    return <SwipeBrickBreaker onBack={handleBack} />;
  }

  return (
    <div className="flex-1 overflow-y-auto lg:overflow-hidden custom-scrollbar bg-gray-50/30 pb-24 lg:pb-0 lg:flex lg:flex-col lg:h-full">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1600px] mx-auto px-4 py-6 lg:py-10 lg:h-full lg:flex lg:flex-col"
      >
        {/* Header Area */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between px-2 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-200">
              <Gamepad2 className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">
                미니 게임
              </h1>
              <p className="text-gray-400 text-[11px] lg:text-xs font-medium">
                가볍게 즐기고 포인트를 획득하세요!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-2 lg:flex-1 lg:min-h-0">
          {/* Main List */}
          <motion.div
            variants={itemVariants}
            className="w-full lg:h-full lg:overflow-y-auto custom-scrollbar lg:pb-24 lg:pt-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
              {/* 2048 Game Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-amber-500 rounded-[28px] blur opacity-10 transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-rose-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-rose-500 border border-rose-100 shadow-inner transition-transform duration-500">
                      2048
                    </div>
                    {is2048Rewarded ? (
                      <div className="bg-gray-50 text-gray-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1 shadow-sm">
                        <Check size={10} strokeWidth={3} />
                        <span>포인트 획득 완료</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 text-rose-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} fill="currentColor" />
                        <span>100 PT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      2048
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      타일을 합쳐서 2048을 완성하세요!
                      <br />
                      매일 최대{" "}
                      <span className="text-rose-500 font-bold">100포인트</span>
                      를 획득할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("2048")}
                    className="w-full bg-rose-500 text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-rose-100 active:scale-[0.98]"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </div>

              {/* Watermelon Game Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-green-500 rounded-[28px] blur opacity-10 transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-amber-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-amber-500 border border-amber-100 shadow-inner transition-transform duration-500">
                      🍉
                    </div>
                    {isWatermelonRewarded ? (
                      <div className="bg-gray-50 text-gray-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1 shadow-sm">
                        <Check size={10} strokeWidth={3} />
                        <span>포인트 획득 완료</span>
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} fill="currentColor" />
                        <span>100 PT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      수박 게임
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      과일을 합쳐서 커다란 수박을 만드세요!
                      <br />
                      매일 최대{" "}
                      <span className="text-amber-500 font-bold">100포인트</span>
                      를 획득할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("watermelon")}
                    className="w-full bg-amber-500 text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-amber-100 active:scale-[0.98]"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </div>

              {/* Blind Timer Game Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-[28px] blur opacity-10 transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-violet-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-violet-500 border border-violet-100 shadow-inner transition-transform duration-500">
                      <Timer size={32} />
                    </div>
                    <div className="bg-violet-50 text-violet-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-violet-100 flex items-center gap-1 shadow-sm">
                      <Sparkles size={10} fill="currentColor" />
                      <span>UP TO 500 PT</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      Blind Timer
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      보이지 않는 타이머를 멈춰라!
                      <br />
                      정확도에 따라 최대{" "}
                      <span className="text-violet-500 font-bold">
                        500포인트
                      </span>
                      를 획득하세요.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("blind-timer")}
                    className="w-full bg-violet-500 text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-violet-100 active:scale-[0.98]"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </div>

              {/* Swipe Brick Breaker Game Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[28px] blur opacity-10 transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-emerald-500 border border-emerald-100 shadow-inner transition-transform duration-500">
                      <Grid3X3 size={32} />
                    </div>
                    {isBrickBreakerRewarded ? (
                      <div className="bg-gray-50 text-gray-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1 shadow-sm">
                        <Check size={10} strokeWidth={3} />
                        <span>포인트 획득 완료</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} fill="currentColor" />
                        <span>100 PT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      벽돌깨기
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      스와이프하여 벽돌을 부수세요!
                      <br />
                      40 스테이지 달성 시{" "}
                      <span className="text-emerald-500 font-bold">
                        100포인트
                      </span>
                      를 획득할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("brick-breaker")}
                    className="w-full bg-emerald-500 text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-100 active:scale-[0.98]"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
