import { useSearchParams } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
  Sparkles,
  Check,
  Timer,
  Grid3X3,
  Star,
  Ticket,
  Layers,
  ChevronRight,
  Trophy,
} from "lucide-react";
import Game2048 from "../components/games/Game2048";
import BlindTimerGame from "../components/games/BlindTimerGame";
import WatermelonGame from "../components/games/WatermelonGame";
import SwipeBrickBreaker from "../components/games/SwipeBrickBreaker";
import StackGame from "../components/games/StackGame";
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
  const scoreStack = getScoreByType("stack");

  const is2048Rewarded = score2048?.last_reward_date === today;
  const isWatermelonRewarded = scoreWatermelon?.last_reward_date === today;
  const isBrickBreakerRewarded = scoreBrickBreaker?.last_reward_date === today;
  const isStackRewarded = scoreStack?.last_reward_date === today;

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
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  if (selectedGame === "2048") return <Game2048 onBack={handleBack} />;
  if (selectedGame === "blind-timer")
    return <BlindTimerGame onBack={handleBack} />;
  if (selectedGame === "watermelon")
    return <WatermelonGame onBack={handleBack} />;
  if (selectedGame === "brick-breaker")
    return <SwipeBrickBreaker onBack={handleBack} />;
  if (selectedGame === "stack") return <StackGame onBack={handleBack} />;

  const gameList = [
    {
      id: "watermelon",
      title: "수박 게임",
      desc: "과일을 합쳐서 수박 만들기",
      icon: "🍉",
      color: "bg-rose-50 text-rose-400 border-rose-100/50",
      rewarded: isWatermelonRewarded,
      mission: true,
    },
    {
      id: "2048",
      title: "2048",
      desc: "타일을 합쳐서 2048 달성",
      icon: "2048",
      isTextIcon: true,
      color: "bg-rose-50 text-rose-500 border-rose-100/50",
      rewarded: is2048Rewarded,
      mission: true,
    },
    {
      id: "brick-breaker",
      title: "벽돌깨기",
      desc: "스와이프하여 벽돌 부수기",
      icon: Grid3X3,
      color: "bg-rose-50 text-rose-400 border-rose-100/50",
      rewarded: isBrickBreakerRewarded,
      mission: true,
    },
    {
      id: "stack",
      title: "스택 타워",
      desc: "블록을 타이밍 맞춰 쌓기",
      icon: Layers,
      color: "bg-rose-50 text-rose-400 border-rose-100/50",
      rewarded: isStackRewarded,
      mission: true,
    },
  ];

  const specialGames = [
    {
      id: "blind-timer",
      title: "Blind Timer",
      desc: "보이지 않는 타이머를 멈춰라!",
      icon: Timer,
      color: "bg-amber-50 text-amber-500 border-amber-100/50",
      rewardInfo: "최대 500PT",
      ticket: true,
    },
  ];

  return (
    <div className="flex-1 bg-[#FDFDFE] text-gray-800 pb-24 overflow-y-auto custom-scrollbar relative">
      {/* Sticky Header */}
      <header className="px-6 py-2 flex flex-col sticky top-0 bg-[#FDFDFE]/90 backdrop-blur-md z-20"></header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-xl mx-auto px-6 space-y-4 pt-2"
      >
        {/* Daily Mission Summary Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="text-amber-400 fill-amber-400" size={14} />
                <span className="text-[11px] text-amber-500 font-black uppercase tracking-widest">
                  Daily Mission
                </span>
              </div>
              <p className="text-[13px] text-gray-600 font-bold">
                게임 <span className="text-rose-500">2개</span> 달성 시{" "}
                <span className="text-gray-900">300 PT</span> 획득
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    currentRewardedCount >= i
                      ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200"
                      : "bg-gray-50 border-gray-100 text-gray-200"
                  }`}
                >
                  <Check size={18} strokeWidth={4} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* All Games Widget Container */}
        <motion.div variants={itemVariants} className="pt-2">
          <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden">
            {/* Daily Mission Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Star size={12} className="text-rose-300" /> Daily Mission
              </h2>
              {isLimitReached && (
                <span className="text-[10px] font-black text-rose-400 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/50">
                  오늘의 보상 완료
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {gameList.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="flex flex-col items-center justify-center p-4 rounded-[24px] bg-gray-50/50 border border-gray-100/50 hover:bg-gray-50 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all group relative"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${game.color} transition-transform group-hover:scale-105 shadow-sm`}
                  >
                    {game.isTextIcon ? (
                      <span className="text-[13px] font-black">
                        {game.icon}
                      </span>
                    ) : typeof game.icon === "string" ? (
                      <span className="text-xl">{game.icon}</span>
                    ) : (
                      <game.icon size={20} />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mb-1 w-full justify-center">
                    <h3 className="text-[13px] font-black text-gray-800 truncate">
                      {game.title}
                    </h3>
                    {game.rewarded && (
                      <div className="bg-green-50 text-green-500 p-0.5 rounded-full shrink-0">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mb-3 text-center line-clamp-1">
                    {game.desc}
                  </p>

                  {game.rewarded ? (
                    <span className="text-[9px] font-black text-rose-400 bg-rose-50 px-2 py-0.5 rounded-lg">
                      DONE
                    </span>
                  ) : !isLimitReached ? (
                    <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-lg">
                      <Sparkles size={8} fill="currentColor" />
                      <span>150PT</span>
                    </div>
                  ) : (
                    <div className="h-5"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-50 mb-6"></div>

            {/* Special Challenge Section */}
            <div className="flex items-center mb-4">
              <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-amber-300" /> Special
                Challenge
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {specialGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="w-full bg-gray-50/50 rounded-[24px] p-4 border border-gray-100/50 flex items-center gap-4 transition-all hover:bg-gray-50 hover:shadow-sm hover:scale-[1.01] active:scale-[0.98] group relative overflow-hidden text-left"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${game.color} shadow-sm transition-transform group-hover:scale-105`}
                  >
                    <game.icon size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[14px] font-black text-gray-800">
                        {game.title}
                      </h3>
                      {game.ticket && (
                        <Ticket
                          size={12}
                          className="text-amber-400 fill-amber-400/20"
                        />
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 truncate">
                      {game.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg tracking-wider">
                      {game.rewardInfo}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:text-amber-500 shadow-sm transition-colors border border-gray-100">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
