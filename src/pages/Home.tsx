import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "../constants/animations";
import {
  Copy,
  Sparkles,
  MessageCircleQuestionMark,
  Palette,
} from "lucide-react";
import { useHomeData } from "../hooks";

// Sub Components
import HomeHeader from "../components/home/HomeHeader";
import HeartGauge from "../components/home/HeartGauge";
import DailyQuestionSection from "../components/home/DailyQuestionSection";
import { DrawingAnswerSection } from "../components/home/DrawingAnswerSection";
import QuickLinksSection from "../components/home/QuickLinksSection";
import RelayNovelWidget from "../components/home/RelayNovelWidget";
import { useToast } from "../context/ToastContext";
import {
  HomeHeaderSkeleton,
  HeartGaugeSkeleton,
  DailyTabSkeleton,
  RelayNovelWidgetSkeleton,
  QuickLinksSkeleton,
} from "../components/home/HomeSkeletons";

export default function Home() {
  const {
    couple,
    loading,
    partnerProfile,
  } = useHomeData();

  const { showToast } = useToast();

  const [dailyTab, setDailyTab] = useState<"question" | "drawing">(() => {
    const saved = localStorage.getItem("dailyTab");
    return saved === "question" || saved === "drawing" ? saved : "question";
  });

  useEffect(() => {
    localStorage.setItem("dailyTab", dailyTab);
  }, [dailyTab]);

  const copyInviteCode = () => {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code);
      showToast("초대 코드가 복사되었어요.", "success");
    }
  };



  return (
    <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-[#FDFDFE] pb-24 text-gray-800">
      {loading ? (
        <HomeHeaderSkeleton />
      ) : (
        <HomeHeader />
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-xl space-y-0"
      >
        <motion.div variants={itemVariants}>
          {loading ? <HeartGaugeSkeleton /> : <HeartGauge />}
        </motion.div>

        <main className="space-y-0 pb-4">
          {/* Invite Code Section (Partner missing case) */}
          {!loading && !partnerProfile && couple?.invite_code && (
            <motion.div variants={itemVariants} className="mb-8 px-6">
              <div className="group relative overflow-hidden rounded-[32px] border border-rose-100/50 bg-white p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                <div className="absolute -top-4 -right-4 opacity-[0.05] transition-transform duration-700 group-hover:scale-110">
                  <Sparkles size={100} className="text-rose-400" />
                </div>
                <h3 className="mb-1 text-lg font-black text-gray-800">
                  초대 코드를 공유해보세요!
                </h3>
                <p className="mb-6 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                  둘만의 달이어리를 시작할 시간
                </p>
                <button
                  onClick={copyInviteCode}
                  className="group mx-auto flex w-full items-center justify-center space-x-3 rounded-[22px] border border-rose-100/30 bg-rose-50/50 px-6 py-4 transition-all hover:bg-rose-50"
                >
                  <span className="font-mono text-xl font-black tracking-[0.2em] text-rose-400">
                    {couple.invite_code}
                  </span>
                  <Copy
                    size={16}
                    className="text-rose-300 transition-colors group-hover:text-rose-400"
                  />
                </button>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            {loading ? (
              <DailyTabSkeleton />
            ) : (
              <>
                {/* Folder Tab Design */}
                <div className="relative z-10 flex translate-y-[1px] items-end justify-end gap-1.5 px-12">
                  <button
                    onClick={() => setDailyTab("question")}
                    className={`rounded-t-[16px] border-x border-t px-4 pt-2.5 text-[14px] font-bold transition-colors ${
                      dailyTab === "question"
                        ? "border-rose-50/50 bg-white pb-3 text-gray-800"
                        : "border-transparent bg-gray-100/60 pb-2 text-gray-400 hover:bg-gray-200/50"
                    }`}
                  >
                    <MessageCircleQuestionMark
                      className={
                        dailyTab === "question"
                          ? "text-rose-400"
                          : "text-gray-400"
                      }
                      size={20}
                    />
                  </button>
                  <button
                    onClick={() => setDailyTab("drawing")}
                    className={`rounded-t-[16px] border-x border-t px-4 pt-2.5 text-[14px] font-bold transition-colors ${
                      dailyTab === "drawing"
                        ? "border-rose-50/50 bg-white pb-3 text-gray-800"
                        : "border-transparent bg-gray-100/60 pb-2 text-gray-400 hover:bg-gray-200/50"
                    }`}
                  >
                    <Palette
                      className={
                        dailyTab === "drawing"
                          ? "text-rose-400"
                          : "text-gray-400"
                      }
                      size={20}
                    />
                  </button>
                </div>

                {/* Tab Content (Instant Exit, Slide Up Enter) */}
                <div className="overflow-x-clip">
                  <motion.div
                    key={dailyTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {dailyTab === "question" ? (
                      <DailyQuestionSection />
                    ) : (
                      <DrawingAnswerSection />
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            {loading ? (
              <RelayNovelWidgetSkeleton />
            ) : (
              partnerProfile && <RelayNovelWidget />
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            {loading ? <QuickLinksSkeleton /> : <QuickLinksSection />}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
