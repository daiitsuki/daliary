import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  X,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Heart,
} from "lucide-react";
import { useCouplePoints } from "../../hooks/useCouplePoints";
import { useAttendance } from "../../hooks/useAttendance";

const HeartGauge = () => {
  const { totalPoints, history, levelInfo, loading } = useCouplePoints();
  const { hasCheckedIn } = useAttendance();
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "guide">("history");

  if (loading || !levelInfo) return null;

  const pointRules = [
    {
      icon: <CheckCircle2 size={18} className="text-rose-400" />,
      title: "일일 출석체크",
      points: 50,
      desc: "매일 한 번 출석 버튼 클릭",
    },
    {
      icon: <MapPin size={18} className="text-rose-400" />,
      title: "장소 방문 인증",
      points: 30,
      desc: "가고 싶던 장소 방문 후 인증",
    },
    {
      icon: <Heart size={18} className="text-rose-400" />,
      title: "오늘의 질문 답변",
      points: 10,
      desc: "서로에게 답하는 매일의 질문",
    },
    {
      icon: <PlusCircle size={18} className="text-rose-400" />,
      title: "위시리스트 저장",
      points: 5,
      desc: "함께 가고 싶은 곳 위시리스트 추가",
    },
    {
      icon: <MessageSquare size={18} className="text-rose-400" />,
      title: "방문 기록 댓글",
      points: 3,
      desc: "상대방의 방문 인증에 댓글 작성",
    },
  ];

  const handleOpenModal = (tab: "history" | "guide") => {
    setActiveTab(tab);
    setShowHistory(true);
  };

  return (
    <div className="px-6 mb-8">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 cursor-pointer group relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-50/50 rounded-full blur-3xl" />
        
        <div onClick={() => handleOpenModal("history")} className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-3 rounded-[18px] shadow-sm">
                <Sparkles size={18} className="text-rose-400" />
              </div>
              <div>
                <p
                  className={`text-[9px] font-bold uppercase tracking-[0.15em] leading-none mb-1.5 ${hasCheckedIn ? "text-rose-400" : "text-gray-300"}`}
                >
                  {hasCheckedIn ? "● ACTIVE STATUS" : "○ READY TO CHECK"}
                </p>
                <h3 className="text-base font-bold text-gray-800 tracking-tight">
                  Level {levelInfo.level}
                </h3>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-lg font-bold text-rose-500 mb-0.5 tracking-tighter">
                {Math.round(levelInfo.progress)}<span className="text-[10px] ml-0.5">%</span>
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {levelInfo.currentExp} / {levelInfo.nextLevelExp} PT
              </p>
            </div>
          </div>

          {/* Gauge Bar */}
          <div className="w-full h-2.5 bg-gray-50/80 rounded-full overflow-hidden border border-gray-100/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-rose-300 via-rose-400 to-rose-500 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.2)]"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-gray-500 font-medium">
              누적 <span className="text-rose-400 font-bold">{totalPoints}</span> PT · 다음 레벨까지{" "}
              <span className="text-gray-800 font-bold">{levelInfo.nextLevelExp - levelInfo.currentExp}</span> PT
            </p>
            <div className="bg-gray-50 p-1.5 rounded-full group-hover:bg-rose-50 transition-colors">
              <ChevronRight
                size={14}
                className="text-gray-300 group-hover:text-rose-300 transition-colors"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={
                window.innerWidth < 768
                  ? { y: "100%" }
                  : { opacity: 0, scale: 0.95, y: 20 }
              }
              animate={
                window.innerWidth < 768
                  ? { y: 0 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                window.innerWidth < 768
                  ? { y: "100%" }
                  : { opacity: 0, scale: 0.95, y: 20 }
              }
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] md:max-h-[70vh] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-50 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                      Memory Points
                    </h3>
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                      함께 만든 소중한 기록들
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      activeTab === "history"
                        ? "bg-white text-rose-500 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    적립 내역
                  </button>
                  <button
                    onClick={() => setActiveTab("guide")}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      activeTab === "guide"
                        ? "bg-white text-rose-500 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    획득 방법
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === "history" ? (
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <div className="py-24 text-center">
                        <p className="text-gray-400 text-sm font-bold italic">
                          아직 포인트 내역이 없습니다.
                        </p>
                      </div>
                    ) : (
                      history.map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-white p-2.5 rounded-xl shadow-sm">
                              <PlusCircle size={18} className="text-rose-400" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-gray-800 mb-0.5">
                                {log.description}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                {new Date(log.created_at).toLocaleDateString(
                                  "ko-KR",
                                  {
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-black text-rose-500">
                            +{log.points}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-rose-50/50 rounded-2xl p-4 mb-2">
                      <p className="text-[12px] text-rose-400 font-bold leading-relaxed">
                        포인트를 모아 레벨을 올리고,
                        <br />
                        우리만의 소중한 추억을 더 예쁘게 기록해보세요!
                      </p>
                    </div>
                    {pointRules.map((rule, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-rose-50 p-2.5 rounded-xl">
                            {rule.icon}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-800 mb-0.5">
                              {rule.title}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold">
                              {rule.desc}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-rose-500 whitespace-nowrap">
                          +{rule.points} PT
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeartGauge;
