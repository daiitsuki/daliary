import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Calculator,
  Heart,
  ChevronRight,
  Search,
  Plus,
} from "lucide-react";
import {
  format,
  addDays,
  differenceInDays,
  parseISO,
  isAfter,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useAnniversaries } from "../../hooks/useAnniversaries";
import { useCouple } from "../../hooks/useCouple";
import DatePicker from "./DatePicker";

interface AnniversaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnniversaryModal = ({ isOpen, onClose }: AnniversaryModalProps) => {
  const { couple } = useCouple();
  const { anniversarySchedules } = useAnniversaries();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dDayInput, setDDayInput] = useState<string>("");
  const [targetDateInput, setTargetDateInput] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(3);

  const anniversaryDate = couple?.anniversary_date;
  const today = startOfDay(new Date());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset visible count when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(3);
    }
  }, [isOpen]);

  // Browser Back Button Support
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "anniversary" }, "");
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "anniversary") {
          onClose();
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "anniversary") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  // Upcoming Anniversaries
  const filteredAnniversaries = useMemo(() => {
    if (!anniversarySchedules.length) return [];
    return [...anniversarySchedules]
      .filter((s) => !isAfter(today, startOfDay(parseISO(s.start_date))))
      .sort(
        (a, b) =>
          parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime(),
      );
  }, [anniversarySchedules, today]);

  const upcomingAnniversaries = useMemo(() => {
    return filteredAnniversaries.slice(0, visibleCount);
  }, [filteredAnniversaries, visibleCount]);

  const hasMore = filteredAnniversaries.length > visibleCount;

  // Calculator Logic
  const dDayResult = useMemo(() => {
    if (!anniversaryDate || !dDayInput) return null;
    const days = parseInt(dDayInput);
    // Limit to 1,000,000 days (approx 2700 years) to prevent overflow
    if (isNaN(days) || days <= 0 || days > 1000000) return null;

    try {
      const resultDate = addDays(parseISO(anniversaryDate), days - 1);
      if (isNaN(resultDate.getTime())) return null;
      return format(resultDate, "yyyy년 M월 d일 (EEEE)", { locale: ko });
    } catch {
      return null;
    }
  }, [anniversaryDate, dDayInput]);

  const targetDateResult = useMemo(() => {
    if (!anniversaryDate || !targetDateInput) return null;
    try {
      const target = startOfDay(new Date(targetDateInput));
      const start = startOfDay(parseISO(anniversaryDate));
      if (isNaN(target.getTime())) return null;
      const diff = differenceInDays(target, start) + 1;
      return diff > 0 ? `${diff}일째` : `${Math.abs(diff)}일 전`;
    } catch {
      return null;
    }
  }, [anniversaryDate, targetDateInput]);

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/50 rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform-gpu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white/40 backdrop-blur-md border-b border-white/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-rose-50 p-2 rounded-xl">
                  <Calendar className="text-rose-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">
                    기념일 계산기
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Anniversary Calculator
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl hover:bg-white/60 text-gray-400 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white">
              {/* D-Day Search/Calculator */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Calculator size={14} className="text-rose-400" />
                  <span className="text-sm font-black text-gray-700">
                    날짜 검색
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 font-bold ml-1">
                      n일째 되는 날은 언제인가요?
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={dDayInput}
                        onChange={(e) => setDDayInput(e.target.value)}
                        placeholder="예: 100, 365, 1000"
                        className="w-full bg-white/50 border border-gray-100 rounded-2xl px-5 py-4 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-gray-300"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                        <Search size={16} />
                      </div>
                    </div>
                    {dDayResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/20"
                      >
                        <p className="text-[13px] font-black text-rose-500">
                          {dDayResult}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 font-bold ml-1">
                      이 날은 며칠인가요?
                    </label>
                    <DatePicker
                      value={targetDateInput}
                      onChange={setTargetDateInput}
                    />
                    {targetDateResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/20"
                      >
                        <p className="text-[13px] font-black text-rose-500">
                          우리 만난 지{" "}
                          <span className="text-lg decoration-2">
                            {targetDateResult}
                          </span>{" "}
                          되는 날
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </section>

              {/* Upcoming Anniversaries */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" />
                    <span className="text-sm font-black text-gray-700">
                      다가오는 기념일
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {upcomingAnniversaries.length > 0 ? (
                    <>
                      {upcomingAnniversaries.map((anniversary, index) => (
                        <motion.div
                          key={anniversary.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-5 bg-white/60 rounded-[24px] border border-gray-100/50 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 font-black text-xs">
                              {anniversary.title.includes("주년")
                                ? "YR"
                                : "DAY"}
                            </div>
                            <div>
                              <p className="text-[14px] font-black text-gray-800">
                                {anniversary.title}
                              </p>
                              <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                                {format(
                                  parseISO(anniversary.start_date),
                                  "yyyy. MM. dd (eee)",
                                  { locale: ko },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[12px] font-black shadow-lg shadow-rose-100">
                            D-
                            {differenceInDays(
                              parseISO(anniversary.start_date),
                              today,
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {hasMore && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setVisibleCount((prev) => prev + 3)}
                          className="w-full py-4 flex items-center justify-center gap-2 text-[12px] font-black text-gray-400 hover:text-rose-400 hover:bg-rose-50/50 rounded-2xl transition-all active:scale-[0.98]"
                        >
                          <Plus size={14} />
                          기념일 더보기
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-gray-50/30 rounded-[32px] border border-dashed border-gray-100">
                      <p className="text-xs text-gray-300 font-bold italic">
                        기념일 정보가 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50/30 text-center shrink-0">
              <p className="text-[10px] text-gray-300 font-bold leading-relaxed uppercase tracking-widest">
                * 만난 날을 1일로 계산합니다 <br />
                기념일 설정은 프로필 설정에서 가능합니다
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AnniversaryModal;
