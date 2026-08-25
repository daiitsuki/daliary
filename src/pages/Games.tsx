import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "../constants/animations";
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
  Dices,
  Hexagon,
  Gamepad2,
  Grid2X2,
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
const YachtDiceGame = lazy(
  () => import("../components/games/yacht-dice/YachtDiceGame"),
);
const AbaloneGame = lazy(
  () => import("../components/games/abalone/AbaloneGame"),
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
      case "yacht-dice":
        return <YachtDiceGame onBack={handleBack} />;
      case "abalone":
        return <AbaloneGame onBack={handleBack} />;
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
      icon: Grid2X2,
      color: "bg-amber-50 text-amber-500 border-amber-100/50",
    },
    {
      id: "othello",
      title: "오셀로",
      desc: "내 색깔로 보드판을 가득 채워라!",
      icon: Circle,
      color: "bg-emerald-50 text-emerald-500 border-emerald-100/50",
    },
    {
      id: "yacht-dice",
      title: "요트다이스",
      desc: "5개의 주사위로 족보를 완성하세요!",
      icon: Dices,
      color: "bg-sky-50 text-sky-500 border-sky-100/50",
    },
    {
      id: "abalone",
      title: "아발론",
      desc: "구슬을 보드 밖으로 밀어내세요!",
      icon: Hexagon,
      color: "bg-purple-50 text-purple-500 border-purple-100/50",
      isNew: true,
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
        className="mx-auto max-w-xl space-y-6 px-6 pt-2"
      >
        {/* 1. Multiplayer Section (Hero) */}
        <motion.div variants={itemVariants}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-[16px] font-black text-gray-800">
              <Gamepad2 className="text-gray-400" size={20} /> 둘이서 함께
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {multiplayerGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                className="group relative flex flex-col items-center justify-center rounded-[24px] border border-gray-100/50 bg-gray-50/50 p-4 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-sm active:scale-[0.98]"
              >
                <div
                  className={`mb-3 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] border ${game.color} shadow-sm transition-transform group-hover:scale-105`}
                >
                  <game.icon size={26} strokeWidth={2} />
                </div>

                <div className="flex w-full flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[14px] font-black text-gray-800">
                      {game.title}
                    </h3>
                    {(game as any).isNew && (
                      <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">
                        N
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-1 w-full text-center text-[10px] font-bold text-gray-400">
                    {game.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 2. Daily Mission & Bonus Game */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-[32px] border border-gray-100/50 bg-white py-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <div className="mb-2 flex items-center justify-between px-6">
              <h2 className="flex items-center gap-2 text-[14px] font-black tracking-widest text-gray-800 uppercase">
                <Trophy className="fill-amber-400 text-amber-400" size={16} />{" "}
                Daily Mission
              </h2>
              {isLimitReached ? (
                <span className="rounded-full border border-rose-100/50 bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-400">
                  오늘의 보상 완료
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        currentRewardedCount >= i
                          ? "border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-200"
                          : "border-gray-100 bg-gray-50 text-gray-200"
                      }`}
                    >
                      <Check size={12} strokeWidth={4} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mb-5 px-6 text-[12px] font-bold text-gray-500">
              혼자 하는 게임으로{" "}
              <span className="text-rose-500">최대 300 PT</span> 획득
            </p>

            <div className="relative mb-5 w-full [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] sm:[mask-image:none] sm:[-webkit-mask-image:none]">
              <div className="no-scrollbar flex w-full flex-row gap-3 overflow-x-auto px-6 sm:px-6">
                {gameList.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    className="group relative flex w-[130px] flex-shrink-0 flex-col items-center justify-center rounded-[24px] border border-gray-100/50 bg-gray-50/50 p-4 transition-all hover:scale-[1.02] hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] sm:w-auto sm:flex-1"
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-[16px] border ${game.color} shadow-sm transition-transform group-hover:scale-105`}
                    >
                      {game.isTextIcon ? (
                        <span className="text-[11px] font-black">
                          {game.icon}
                        </span>
                      ) : typeof game.icon === "string" ? (
                        <span className="text-[17px]">{game.icon}</span>
                      ) : (
                        <game.icon size={18} />
                      )}
                    </div>

                    <div className="mb-1 flex w-full items-center justify-center gap-1.5">
                      <h3 className="truncate text-[12px] font-black text-gray-800">
                        {game.title}
                      </h3>
                      {game.rewarded && (
                        <div className="shrink-0 rounded-full bg-green-50 p-0.5 text-green-500">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                    </div>

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
                {/* Spacer for mobile right padding to ensure content doesn't stick to edge */}
                <div className="w-3 flex-shrink-0 sm:hidden" />
              </div>
            </div>

            {/* Bonus Game (Formerly Special Challenge) Appended */}
            <div className="mx-6 border-t border-gray-50 pt-5">
              {specialGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="group relative flex w-full items-center gap-3 rounded-[20px] bg-gray-50/50 p-3 text-left transition-all hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] border ${game.color}`}
                  >
                    <game.icon size={18} strokeWidth={2.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <h3 className="text-[13px] font-black text-gray-800">
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

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-black tracking-wider text-amber-500">
                      {game.rewardInfo}
                    </div>
                    <ChevronRight
                      size={16}
                      strokeWidth={3}
                      className="text-gray-300"
                    />
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
