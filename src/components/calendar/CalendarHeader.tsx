import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Calendar as CalendarIcon,
  ArrowLeft,
} from "lucide-react";
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
    <div className="w-full px-0.5 mb-2 sm:mb-3">
      <motion.div
        layout
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`relative flex items-center bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ${
          isSearchActive
            ? "rounded-2xl sm:rounded-3xl h-14 sm:h-16"
            : "rounded-full h-14 sm:h-16"
        }`}
      >
        <AnimatePresence mode="wait">
          {!isSearchActive ? (
            <motion.div
              key="nav-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between w-full px-2 sm:px-3"
            >
              {/* Left: Today Button */}
              <button
                onClick={onGoToday}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-full transition-all active:scale-90"
              >
                <CalendarIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={2.2} />
              </button>

              {/* Center: Main Navigation */}
              <div className="flex items-center gap-4 ">
                <button
                  onClick={() => onMonthChange(-1)}
                  className="p-1 sm:p-2 text-gray-300 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </button>

                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="flex flex-col items-center px-4 py-1 rounded-xl hover:bg-gray-50 transition-colors active:scale-95"
                >
                  <span className="text-[10px] font-black text-rose-400/80 tracking-widest leading-none mb-1">
                    {year}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-gray-800 leading-none tabular-nums">
                    {month + 1}월
                  </span>
                </button>

                <button
                  onClick={() => onMonthChange(1)}
                  className="p-1 sm:p-2 text-gray-300 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </button>
              </div>

              {/* Right: Search Toggle */}
              <button
                onClick={() => setIsSearchActive(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-full transition-all active:scale-90"
              >
                <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={2.2} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="search-mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center w-full h-full px-4 gap-3"
            >
              <button
                onClick={() => {
                  setIsSearchActive(false);
                  setSearchQuery("");
                }}
                className="text-gray-400 hover:text-rose-500 transition-colors shrink-0"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>

              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="어떤 일정을 찾으시나요?"
                className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-300 text-sm sm:text-base"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-all shrink-0"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
