import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Heart, Plus, CalendarHeart } from "lucide-react";
import {
  format,
  addDays,
  differenceInDays,
  parseISO,
  isAfter,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useAnniversaries } from "../../hooks";
import { useCouple } from "../../hooks";
import DatePicker from "./DatePicker";
import BaseModal from "./BaseModal";
import Button from "./Button";

interface AnniversaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnniversaryModal = ({ isOpen, onClose }: AnniversaryModalProps) => {
  const { couple } = useCouple();
  const { anniversarySchedules } = useAnniversaries();
  const [dDayInput, setDDayInput] = useState<string>("");
  const [targetDateInput, setTargetDateInput] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(3);

  const anniversaryDate = couple?.anniversary_date;
  const today = startOfDay(new Date());

  // Reset visible count when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(3);
    }
  }, [isOpen]);

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

  const footer = (
    <div className="text-center">
      <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
        * 만난 날을 1일로 계산합니다 <br />
        기념일 설정은 프로필 설정에서 가능합니다
      </p>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="기념일 계산기"
      icon={CalendarHeart}
      footer={footer}
    >
      <div className="space-y-8 pb-4">
        {/* D-Day Search/Calculator */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Calculator size={14} className="text-rose-400" />
            <span className="text-sm font-black text-gray-700">날짜 검색</span>
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
                  className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-gray-300 shadow-sm"
                />
              </div>
              <AnimatePresence>
                {dDayResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/20"
                  >
                    <p className="text-[13px] font-black text-rose-500">
                      {dDayResult}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-gray-400 font-bold ml-1">
                이 날은 며칠인가요?
              </label>
              <DatePicker
                value={targetDateInput}
                onChange={setTargetDateInput}
              />
              <AnimatePresence>
                {targetDateResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
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
              </AnimatePresence>
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
                        {anniversary.title.includes("주년") ? "YR" : "DAY"}
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 3)}
                      variant="secondary"
                      icon={<Plus size={14} />}
                    >
                      기념일 더보기
                    </Button>
                  </motion.div>
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
    </BaseModal>
  );
};

export default AnniversaryModal;
