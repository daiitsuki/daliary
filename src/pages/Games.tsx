import { useSearchParams } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Gamepad2, Sparkles, Play, Check } from "lucide-react";
import Game2048 from "../components/games/Game2048";
import { useGameScore } from "../hooks/useGameScore";

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGame = searchParams.get("game");
  const { myScore: score2048 } = useGameScore("2048");

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
                      <span className="text-rose-500 font-bold">200포인트</span>
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

              {/* Empty Cards for Future Games */}
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white/40 border-2 border-dashed border-gray-200 rounded-[28px] p-8 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-gray-200 transition-transform">
                    <Sparkles size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-tight">
                    Next Game Coming Soon
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
