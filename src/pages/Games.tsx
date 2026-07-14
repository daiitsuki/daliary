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
  Users,
  Circle,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// 개별 게임 컴포넌트들을 지연 로딩 (수박게임 클릭 시에만 물리엔진 다운로드 등)
const Game2048 = lazy(() => import("../components/games/Game2048"));
const BlindTimerGame = lazy(() => import("../components/games/BlindTimerGame"));
const WatermelonGame = lazy(() => import("../components/games/WatermelonGame"));
const SwipeBrickBreaker = lazy(
  () => import("../components/games/SwipeBrickBreaker"),
);
const StackGame = lazy(() => import("../components/games/StackGame"));
const ConnectFourGame = lazy(
  () => import("../components/games/connect-four/ConnectFourGame"),
);
const OthelloGame = lazy(
  () => import("../components/games/othello/OthelloGame"),
);
import { useAllGameScores } from "../hooks";

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

  const renderSelectedGame = () => {
    switch (selectedGame) {
      case "2048":
        return <Game2048 onBack={handleBack} />;
      case "blind-timer":
        return <BlindTimerGame onBack={handleBack} />;
      case "watermelon":
        return <WatermelonGame onBack={handleBack} />;
      case "brick-breaker":
        return <SwipeBrickBreaker onBack={handleBack} />;
      case "stack":
        return <StackGame onBack={handleBack} />;
      case "connect-four":
        return <ConnectFourGame onBack={handleBack} />;
      case "othello":
        return <OthelloGame onBack={handleBack} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-full items-center justify-center bg-[#FDFBF7]">
            <Loader2 className="animate-spin text-rose-400" size={32} />
          </div>
        }
      >
        {renderSelectedGame()}
      </Suspense>
    );
  }

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

  const multiplayerGames = [
    {
      id: "connect-four",
      title: "사목",
      desc: "4개의 돌을 이어보세요!",
      icon: Users,
      color: "bg-blue-50 text-blue-500 border-blue-100/50",
    },
    {
      id: "othello",
      title: "오셀로 (Othello)",
      desc: "내 색깔로 보드판을 가득 채워라!",
      icon: Circle,
      color: "bg-sky-50 text-sky-500 border-sky-100/50",
    },
  ];

  return (
    <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-[#FDFDFE] pb-24 text-gray-800">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 flex flex-col bg-[#FDFDFE]/90 px-6 py-2 backdrop-blur-md"></header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-xl space-y-4 px-6 pt-2"
      >
        {/* Daily Mission Summary Card */}
        <motion.div variants={itemVariants}>
          <div className="relative flex items-center justify-between overflow-hidden rounded-[32px] border border-rose-50/50 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="fill-amber-400 text-amber-400" size={14} />
                <span className="text-[11px] font-black tracking-widest text-amber-500 uppercase">
                  Daily Mission
                </span>
              </div>
              <p className="text-[13px] font-bold text-gray-600">
                게임 <span className="text-rose-500">2개</span> 달성 시{" "}
                <span className="text-gray-900">300 PT</span> 획득
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl border-2 transition-all ${
                    currentRewardedCount >= i
                      ? "border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-200"
                      : "border-gray-100 bg-gray-50 text-gray-200"
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
          <div className="relative overflow-hidden rounded-[32px] border border-rose-50/50 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            {/* Daily Mission Section */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[13px] font-black tracking-widest text-gray-400 uppercase">
                <Star size={12} className="text-rose-300" /> Daily Mission
              </h2>
              {isLimitReached && (
                <span className="rounded-full border border-rose-100/50 bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-400">
                  오늘의 보상 완료
                </span>
              )}
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3">
              {gameList.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="group relative flex flex-col items-center justify-center rounded-[24px] border border-gray-100/50 bg-gray-50/50 p-4 transition-all hover:scale-[1.02] hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                >
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${game.color} shadow-sm transition-transform group-hover:scale-105`}
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

                  <div className="mb-1 flex w-full items-center justify-center gap-1.5">
                    <h3 className="truncate text-[13px] font-black text-gray-800">
                      {game.title}
                    </h3>
                    {game.rewarded && (
                      <div className="shrink-0 rounded-full bg-green-50 p-0.5 text-green-500">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-1 text-center text-[10px] font-bold text-gray-400">
                    {game.desc}
                  </p>

                  {game.rewarded ? (
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-400">
                      DONE
                    </span>
                  ) : !isLimitReached ? (
                    <div className="flex items-center gap-1 rounded-lg bg-amber-50/50 px-2 py-0.5 text-[9px] font-black text-amber-500">
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
            <div className="mb-6 h-px w-full bg-gray-50"></div>

            {/* Multiplayer Section */}
            <div className="mb-4 flex items-center">
              <h2 className="flex items-center gap-2 text-[13px] font-black tracking-widest text-gray-400 uppercase">
                <Users size={12} className="text-blue-300" /> 실시간 대결
              </h2>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3">
              {multiplayerGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border border-gray-100/50 bg-gray-50/50 p-4 text-left transition-all hover:scale-[1.01] hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                >
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${game.color} shadow-sm transition-transform group-hover:scale-105`}
                  >
                    <game.icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <h3 className="text-[14px] font-black text-gray-800">
                        {game.title}
                      </h3>
                    </div>
                    <p className="truncate text-[11px] font-bold text-gray-400">
                      {game.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-300 shadow-sm transition-colors group-hover:text-blue-500">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="mb-6 h-px w-full bg-gray-50"></div>

            {/* Special Challenge Section */}
            <div className="mb-4 flex items-center">
              <h2 className="flex items-center gap-2 text-[13px] font-black tracking-widest text-gray-400 uppercase">
                <Sparkles size={12} className="text-amber-300" /> Special
                Challenge
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {specialGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border border-gray-100/50 bg-gray-50/50 p-4 text-left transition-all hover:scale-[1.01] hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                >
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${game.color} shadow-sm transition-transform group-hover:scale-105`}
                  >
                    <game.icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <h3 className="text-[14px] font-black text-gray-800">
                        {game.title}
                      </h3>
                      {game.ticket && (
                        <Ticket
                          size={12}
                          className="fill-amber-400/20 text-amber-400"
                        />
                      )}
                    </div>
                    <p className="truncate text-[11px] font-bold text-gray-400">
                      {game.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black tracking-wider text-amber-500">
                      {game.rewardInfo}
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-300 shadow-sm transition-colors group-hover:text-amber-500">
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
