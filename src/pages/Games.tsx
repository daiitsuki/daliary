import { useSearchParams } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
  Gamepad2,
  Sparkles,
  Play,
  Check,
  Timer,
  Grid3X3,
  Star,
  Ticket,
} from "lucide-react";
import Game2048 from "../components/games/Game2048";
import BlindTimerGame from "../components/games/BlindTimerGame";
import WatermelonGame from "../components/games/WatermelonGame";
import SwipeBrickBreaker from "../components/games/SwipeBrickBreaker";
import { useAllGameScores } from "../hooks/useGameScore";

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGame = searchParams.get("game");
  const { getScoreByType, todayRewardCount } = useAllGameScores();

  const today = new Date()
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .replace(/\. /g, "-")
    .replace(/\./g, "");

  const score2048 = getScoreByType("2048");
  const scoreWatermelon = getScoreByType("watermelon");
  const scoreBrickBreaker = getScoreByType("brick_breaker");

  const is2048Rewarded = score2048?.last_reward_date === today;
  const isWatermelonRewarded = scoreWatermelon?.last_reward_date === today;
  const isBrickBreakerRewarded = scoreBrickBreaker?.last_reward_date === today;

  // 보상 획득 횟수
  const currentRewardedCount = todayRewardCount;
  const isLimitReached = currentRewardedCount >= 2;

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
          className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mb-10 gap-4"
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

          <div className="bg-white border border-rose-100 rounded-3xl px-6 py-3 flex items-center justify-between gap-6 shadow-sm min-w-full sm:min-w-[340px]">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Star className="text-rose-500 w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider">
                  Daily Mission
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-bold leading-tight">
                아래 3개 중{" "}
                <span className="text-rose-500 font-black">2개</span> 달성 시{" "}
                <span className="text-gray-900 font-black">300 PT</span> 획득
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-8 w-[1px] bg-gray-100" />
              <div className="flex gap-1.5">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentRewardedCount >= i
                        ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200"
                        : "bg-gray-50 border-gray-100 text-gray-300"
                    }`}
                  >
                    <Check size={14} strokeWidth={4} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="lg:flex-1 lg:min-h-0 overflow-y-auto custom-scrollbar px-2">
          {/* Section 1: Daily Mission Games */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="flex items-center gap-2 mb-6 ml-1">
              <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
              <h2 className="text-sm lg:text-base font-black text-gray-800">
                일일 미션 게임{" "}
                <span className="text-[11px] text-gray-400 font-bold ml-2">
                  (3개 중 2개 선택)
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 2048 Game Card */}
              <motion.div variants={itemVariants} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-amber-500 rounded-[28px] blur opacity-[0.08] group-hover:opacity-[0.15] transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-rose-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-rose-500 border border-rose-100 shadow-inner transition-transform duration-500 group-hover:scale-110">
                      2048
                    </div>
                    {is2048Rewarded ? (
                      <div className="bg-rose-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-rose-100 animate-in fade-in zoom-in duration-300">
                        <Check size={10} strokeWidth={3} />
                        <span>오늘의 목표 달성</span>
                      </div>
                    ) : isLimitReached ? (
                      <div className="bg-gray-100 text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 shadow-sm">
                        <span>오늘의 보상 완료</span>
                      </div>
                    ) : (
                      <div className="bg-white text-rose-500 text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-rose-50 flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} fill="currentColor" />
                        <span>150 PT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[9px] font-black rounded-md">
                        DAILY MISSION
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      2048
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      타일을 합쳐서 2048을 완성하세요!
                      <br />
                      목표 달성 시 <span className="text-rose-500 font-bold">150포인트</span>를 획득할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("2048")}
                    className="w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-rose-100 active:scale-[0.98] bg-rose-500 text-white hover:bg-rose-600"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </motion.div>

              {/* Watermelon Game Card */}
              <motion.div variants={itemVariants} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-green-500 rounded-[28px] blur opacity-[0.08] group-hover:opacity-[0.15] transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-amber-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-amber-500 border border-amber-100 shadow-inner transition-transform duration-500 group-hover:scale-110">
                      🍉
                    </div>
                    {isWatermelonRewarded ? (
                      <div className="bg-amber-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-amber-100 animate-in fade-in zoom-in duration-300">
                        <Check size={10} strokeWidth={3} />
                        <span>오늘의 목표 달성</span>
                      </div>
                    ) : isLimitReached ? (
                      <div className="bg-gray-100 text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 shadow-sm">
                        <span>오늘의 보상 완료</span>
                      </div>
                    ) : (
                      <div className="bg-white text-amber-600 text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-amber-50 flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} fill="currentColor" />
                        <span>150 PT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-md">
                        DAILY MISSION
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      수박 게임
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      과일을 합쳐서 커다란 수박을 만드세요!
                      <br />
                      수박 완성 시 <span className="text-amber-500 font-bold">150포인트</span>를 획득할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("watermelon")}
                    className="w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-amber-100 active:scale-[0.98] bg-amber-500 text-white hover:bg-amber-600"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </motion.div>

              {/* Swipe Brick Breaker Game Card */}
              <motion.div variants={itemVariants} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[28px] blur opacity-[0.08] group-hover:opacity-[0.15] transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-emerald-500 border border-emerald-100 shadow-inner transition-transform duration-500 group-hover:scale-110">
                      <Grid3X3 size={32} />
                    </div>
                    {isBrickBreakerRewarded ? (
                      <div className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-100 animate-in fade-in zoom-in duration-300">
                        <Check size={10} strokeWidth={3} />
                        <span>오늘의 목표 달성</span>
                      </div>
                    ) : isLimitReached ? (
                      <div className="bg-gray-100 text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 shadow-sm">
                        <span>오늘의 보상 완료</span>
                      </div>
                    ) : (
                      <div className="bg-white text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-emerald-50 flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} fill="currentColor" />
                        <span>150 PT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md">
                        DAILY MISSION
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1.5">
                      벽돌깨기
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-10 font-medium">
                      스와이프하여 벽돌을 부수세요!
                      <br />
                      100 스테이지 달성 시 <span className="text-emerald-500 font-bold">150포인트</span>를 획득할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectGame("brick-breaker")}
                    className="w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-100 active:scale-[0.98] bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Section 2: Special Challenge Games */}
          <motion.div variants={itemVariants} className="mb-24">
            <div className="flex items-center gap-2 mb-6 ml-1">
              <div className="w-1.5 h-4 bg-violet-500 rounded-full" />
              <h2 className="text-sm lg:text-base font-black text-gray-800">
                특별 챌린지{" "}
                <span className="text-[11px] text-gray-400 font-bold ml-2">
                  (일일 미션 제한 없음)
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Blind Timer Game Card */}
              <motion.div variants={itemVariants} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-[28px] blur opacity-[0.08] group-hover:opacity-[0.15] transition duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-lg transition-all flex flex-col h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 bg-violet-50 rounded-[20px] flex items-center justify-center text-3xl font-black text-violet-500 border border-violet-100 shadow-inner transition-transform duration-500 group-hover:scale-110">
                      <Timer size={32} />
                    </div>
                    <div className="bg-violet-50 text-violet-600 text-[9px] font-black px-3 py-1.5 rounded-lg border border-violet-100 flex items-center gap-1 shadow-sm">
                      <Ticket size={10} className="fill-current" />
                      <span>TICKET REQUIRED</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-black rounded-md">
                        SPECIAL EVENT
                      </span>
                    </div>
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
                    className="w-full bg-violet-500 text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-violet-100 active:scale-[0.98] hover:bg-violet-600"
                  >
                    <Play size={16} fill="currentColor" />
                    플레이
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
