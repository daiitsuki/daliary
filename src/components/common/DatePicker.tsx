import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
} from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  variant?: "calendar" | "dropdown";
}

const DatePicker = ({
  value,
  onChange,
  label,
  variant = "calendar",
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));

  // Dropdown state
  const [selectedYear, setSelectedYear] = useState(viewDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(viewDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(viewDate.getDate());

  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  // Update internal state when value changes or modal opens
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setViewDate(date);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth() + 1);
      setSelectedDay(date.getDate());
    }
  }, [value, isOpen]);

  // Dropdown ranges
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const ys = [];
    for (let i = currentYear + 5; i >= 1990; i--) ys.push(i);
    return ys;
  }, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth, 0).getDate(),
    [selectedYear, selectedMonth],
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  // Scroll to selected items when dropdown opens
  useEffect(() => {
    if (isOpen && variant === "dropdown") {
      const scroll = (
        ref: React.RefObject<HTMLDivElement | null>,
        index: number,
      ) => {
        if (ref.current) {
          ref.current.scrollTop = index * 40; // 40px is item height
        }
      };

      // Small delay to ensure render
      setTimeout(() => {
        const yIndex = years.indexOf(selectedYear);
        const mIndex = months.indexOf(selectedMonth);
        const dIndex = days.indexOf(selectedDay);

        scroll(yearRef, yIndex !== -1 ? yIndex : 0);
        scroll(monthRef, mIndex !== -1 ? mIndex : 0);
        scroll(dayRef, dIndex !== -1 ? dIndex : 0);
      }, 0);
    }
  }, [isOpen, variant]); // Run only on open

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = firstDay; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        currentMonth: false,
      });
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, month, year, currentMonth: true });
    }
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        currentMonth: false,
      });
    }
    return days;
  }, [year, month]);

  // Auto-correct day if month changes and day is invalid
  useEffect(() => {
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [daysInMonth, selectedDay]);

  // 뒤로가기 시 모달 닫기 로직
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "date-picker" }, "");
      
      const handlePopState = () => {
        setIsOpen(false);
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "date-picker") {
          window.history.back();
        }
      };
    }
  }, [isOpen]);

  const handleDateSelect = (d: number, m: number, y: number) => {
    const formatted = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleDropdownSave = () => {
    const formatted = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const isSelected = (d: number, m: number, y: number) => {
    const [vY, vM, vD] = (value || "").split("-").map(Number);
    return vY === y && vM - 1 === m && vD === d;
  };

  const isToday = (d: number, m: number, y: number) => {
    const today = new Date();
    return (
      today.getDate() === d &&
      today.getMonth() === m &&
      today.getFullYear() === y
    );
  };

  const ITEM_HEIGHT = 40;
  const VISIBLE_ITEMS = 5;
  const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
  const PADDING_Y = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

  const scrollToItem = (
    ref: React.RefObject<HTMLDivElement | null>,
    index: number,
  ) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
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

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-widest px-1 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 rounded-2xl border-none hover:bg-gray-100/80 transition-all text-sm font-bold text-gray-700"
      >
        <span>{value || "날짜 선택"}</span>
        <CalendarIcon size={18} className="text-gray-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[90%] max-w-[340px] bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden p-6"
            >
              {variant === "calendar" ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-rose-400">
                        {year}
                      </span>
                      <span className="text-lg font-black text-gray-800">
                        {month + 1}월
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          setViewDate(new Date(year, month - 1, 1))
                        }
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setViewDate(new Date(year, month + 1, 1))
                        }
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 mb-2">
                    {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                      <div
                        key={d}
                        className={`text-center text-[10px] font-black ${i === 0 ? "text-rose-300" : i === 6 ? "text-blue-300" : "text-gray-300"}`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dateObj, i) => {
                      const {
                        day,
                        month: dMonth,
                        year: dYear,
                        currentMonth,
                      } = dateObj;
                      const active = isSelected(day, dMonth, dYear);
                      const today = isToday(day, dMonth, dYear);

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleDateSelect(day, dMonth, dYear)}
                          className={`relative aspect-square flex items-center justify-center text-xs font-bold rounded-xl transition-all ${
                            active
                              ? "bg-rose-400 text-white shadow-lg shadow-rose-100"
                              : currentMonth
                                ? "text-gray-700 hover:bg-rose-50 hover:text-rose-500"
                                : "text-gray-200"
                          }`}
                        >
                          {day}
                          {today && !active && (
                            <div className="absolute bottom-1 w-1 h-1 bg-rose-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col">
                  <h3 className="text-center text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">
                    날짜 선택
                  </h3>

                                     <div className="flex gap-2 relative overflow-hidden touch-pan-y" style={{ height: WHEEL_HEIGHT }}>
                    {/* Selection Highlight Bar */}
                    <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-rose-50 rounded-xl pointer-events-none border border-rose-100 z-0" />

                    {/* Years */}
                                          <div 
                                            ref={yearRef}
                                            onScroll={(e) => handleScroll(e, years, setSelectedYear)}
                                            className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar text-center snap-y snap-mandatory relative z-10"
                                            style={{ paddingBlock: PADDING_Y }}
                                          >                      {years.map((y, i) => (
                        <button
                          key={y}
                          onClick={() => {
                            setSelectedYear(y);
                            scrollToItem(yearRef, i);
                          }}
                          className={`w-full h-10 flex items-center justify-center text-sm font-bold snap-center transition-all duration-200 ${selectedYear === y ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-95"}`}
                        >
                          {y}
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
                          className={`w-full h-10 flex items-center justify-center text-sm font-bold snap-center transition-all duration-200 ${selectedMonth === m ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-95"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* Days */}
                                          <div 
                                            ref={dayRef}
                                            onScroll={(e) => handleScroll(e, days, setSelectedDay)}
                                            className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar text-center snap-y snap-mandatory relative z-10"
                                            style={{ paddingBlock: PADDING_Y }}
                                          >                      {days.map((d, i) => (
                        <button
                          key={d}
                          onClick={() => {
                            setSelectedDay(d);
                            scrollToItem(dayRef, i);
                          }}
                          className={`w-full h-10 flex items-center justify-center text-sm font-bold snap-center transition-all duration-200 ${selectedDay === d ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-95"}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDropdownSave}
                    className="mt-6 w-full py-3 bg-rose-400 text-white text-sm font-black rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Check size={16} strokeWidth={3} />
                    선택 완료
                  </button>
                </div>
              )}

              {variant === "calendar" && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-6 w-full py-3 bg-gray-50 text-gray-400 text-xs font-black rounded-xl hover:bg-gray-100 transition-colors"
                >
                  닫기
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
