import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import MonthYearPicker from "./MonthYearPicker";

interface CalendarHeaderProps {
  currentDate: Date;
  onMonthChange: (offset: number) => void;
  onJumpToDate: (year: number, month: number) => void;
  onGoToday: () => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CalendarHeader = ({
  currentDate,
  onMonthChange,
  onJumpToDate,
  onGoToday,
  isSearchActive,
  setIsSearchActive,
  searchQuery,
  setSearchQuery,
}: CalendarHeaderProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <div className="flex flex-col items-center justify-center mb-10 gap-4">
      <div className="flex items-center bg-white rounded-3xl p-1 border border-gray-100 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => onMonthChange(-1)}
            className="p-3 text-gray-300 hover:text-rose-400 transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          
          <button
            onClick={() => setIsPickerOpen(true)}
            className="px-4 min-w-[120px] text-center flex flex-col hover:bg-gray-50 rounded-2xl transition-colors active:scale-95"
          >
            <span className="text-[10px] font-black text-rose-400 leading-none mb-1">
              {year}
            </span>
            <span className="text-xl font-black text-gray-800 leading-none">
              {month + 1}월
            </span>
          </button>

          <button
            onClick={() => onMonthChange(1)}
            className="p-3 text-gray-300 hover:text-rose-400 transition-colors"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="w-px h-6 bg-gray-100 mx-2" />
        <button
          onClick={onGoToday}
          className="px-5 py-3 text-gray-400 hover:text-rose-400 transition-colors text-xs font-black tracking-tight border-r border-gray-50 mr-1"
        >
          TODAY
        </button>
        <button
          onClick={() => setIsSearchActive(!isSearchActive)}
          className={`p-3 transition-colors ${
            isSearchActive ? "text-rose-500" : "text-gray-300 hover:text-rose-400"
          }`}
        >
          <Search size={20} strokeWidth={3} />
        </button>
      </div>

      <AnimatePresence>
        {isSearchActive && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="w-full max-w-md px-2 overflow-hidden"
          >
            <div className="relative py-1">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색할 일정을 입력하세요..."
                className="w-full px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-rose-100 font-bold text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MonthYearPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentDate={currentDate}
        onSelect={onJumpToDate}
      />
    </div>
  );
};

export default CalendarHeader;
