import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Sparkles, PlusCircle } from "lucide-react";
import { useCouplePoints } from "../../hooks/useCouplePoints";
import { useAttendance } from "../../hooks/useAttendance";

const HeartGauge = () => {
  const { totalPoints, history, levelInfo, loading } = useCouplePoints();
  const { hasCheckedIn } = useAttendance(); // Correct destructuring
  const [showHistory, setShowHistory] = useState(false);

  if (loading || !levelInfo) return null;

  return (
    <div className="px-6 mb-8">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowHistory(true)}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-rose-50 cursor-pointer group"
      >
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-rose-50 p-2.5 rounded-xl">
              <Sparkles size={18} className="text-rose-400" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${hasCheckedIn ? 'text-rose-400' : 'text-gray-300'}`}>
                {hasCheckedIn ? '● 오늘 출석 완료' : '○ 오늘 미출석'}
              </p>
              <h3 className="text-sm font-black text-gray-800 tracking-tight">Level {levelInfo.level}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-black text-rose-500 mb-0.5">{Math.round(levelInfo.progress)}%</p>
            <p className="text-[11px] text-gray-400 font-bold">
              {levelInfo.currentExp} / {levelInfo.nextLevelExp} PT
            </p>
          </div>
        </div>

        {/* Gauge Bar */}
        <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-rose-300 to-rose-400 rounded-full"
          />
        </div>

        <div className="mt-3.5 flex items-center justify-between">
          <p className="text-[11px] text-gray-500 font-bold">
            누적 {totalPoints} PT · 다음 레벨까지 {levelInfo.nextLevelExp - levelInfo.currentExp} PT
          </p>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-rose-300 transition-colors" />
        </div>
      </motion.div>

      {/* History Modal */}
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
              initial={window.innerWidth < 768 ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={window.innerWidth < 768 ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={window.innerWidth < 768 ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] md:max-h-[70vh] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Memory Points</h3>
                  <p className="text-[11px] text-gray-500 font-bold mt-0.5">함께 만든 소중한 기록들</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)} 
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-gray-400 text-sm font-bold italic">아직 포인트 내역이 없습니다.</p>
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
                          <p className="text-[13px] font-bold text-gray-800 mb-0.5">{log.description}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {new Date(log.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-rose-500">+{log.points}</span>
                    </motion.div>
                  ))
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
