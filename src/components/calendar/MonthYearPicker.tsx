import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { createPortal } from "react-dom";

interface MonthYearPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelect: (year: number, month: number) => void;
}

const MonthYearPicker = ({
  isOpen,
  onClose,
  currentDate,
  onSelect,
}: MonthYearPickerProps) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  const ITEM_HEIGHT = 40;
  const VISIBLE_ITEMS = 5;
  const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
  const PADDING_Y = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const ys = [];
    for (let i = currentYear + 10; i >= 1990; i--) ys.push(i);
    return ys;
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const scrollToItem = (
    ref: React.RefObject<HTMLDivElement | null>,
    index: number,
    immediate = false
  ) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: immediate ? "auto" : "smooth",
      });
    }
  };

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    items: number[],
    setState: (val: number) => void,
  ) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (items[index] !== undefined) {
      setState(items[index]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedYear(currentDate.getFullYear());
      setSelectedMonth(currentDate.getMonth() + 1);

      // Scroll to selected items
      setTimeout(() => {
        const yIndex = years.indexOf(currentDate.getFullYear());
        const mIndex = months.indexOf(currentDate.getMonth() + 1);
        scrollToItem(yearRef, yIndex !== -1 ? yIndex : 0, true);
        scrollToItem(monthRef, mIndex !== -1 ? mIndex : 0, true);
      }, 50);

      // Back button support
      window.history.pushState({ modal: "month-year-picker" }, "");
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "month-year-picker") {
          onClose();
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "month-year-picker") {
          window.history.back();
        }
      };
    }
  }, [isOpen, currentDate, years, months, onClose]);

  const handleSave = () => {
    onSelect(selectedYear, selectedMonth - 1);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] w-[90%] max-w-[320px] bg-white rounded-[32px] shadow-2xl border border-white/50 overflow-hidden p-6"
          >
            <div className="flex flex-col">
              <h3 className="text-center text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">
                이동할 날짜 선택
              </h3>

              <div className="flex gap-4 relative overflow-hidden touch-pan-y" style={{ height: WHEEL_HEIGHT }}>
                {/* Selection Highlight Bar */}
                <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-rose-50 rounded-2xl pointer-events-none border border-rose-100 z-0" />

                {/* Years */}
                <div 
                  ref={yearRef}
                  onScroll={(e) => handleScroll(e, years, setSelectedYear)}
                  className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar text-center snap-y snap-mandatory relative z-10"
                  style={{ paddingBlock: PADDING_Y }}
                >
                  {years.map((y, i) => (
                    <button
                      key={y}
                      onClick={() => {
                        setSelectedYear(y);
                        scrollToItem(yearRef, i);
                      }}
                      className={`w-full h-10 flex items-center justify-center text-base font-black snap-center transition-all duration-200 ${selectedYear === y ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-90"}`}
                    >
                      {y}년
                    </button>
                  ))}
                </div>

                {/* Months */}
                <div 
                  ref={monthRef}
                  onScroll={(e) => handleScroll(e, months, setSelectedMonth)}
                  className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar text-center snap-y snap-mandatory relative z-10"
                  style={{ paddingBlock: PADDING_Y }}
                >
                  {months.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                        scrollToItem(monthRef, i);
                      }}
                      className={`w-full h-10 flex items-center justify-center text-base font-black snap-center transition-all duration-200 ${selectedMonth === m ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-90"}`}
                    >
                      {m}월
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-50 text-gray-400 text-sm font-black rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.98]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-[2] py-3 bg-rose-400 text-white text-sm font-black rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Check size={16} strokeWidth={3} />
                  이동하기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MonthYearPicker;
