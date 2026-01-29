import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Schedule } from "../../hooks/useSchedules";

interface CalendarGridProps {
  currentDate: Date;
  direction: number;
  schedules: Schedule[];
  selectedDate: Date;
  isDateSelected: boolean;
  onDayClick: (day: number, month: number, year: number) => void;
  today: Date;
}

const calendarVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

// Helper to format date as YYYY-MM-DD
const formatDateStr = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
};

const WeekRow = ({
  days,
  schedules,
  onDayClick,
  selectedDate,
  isDateSelected,
  today,
}: {
  days: any[];
  schedules: Schedule[];
  onDayClick: (d: number, m: number, y: number) => void;
  selectedDate: Date;
  isDateSelected: boolean;
  today: Date;
}) => {
  // 1. Identify Week Range
  const weekStart = days[0];
  const weekEnd = days[6];
  const weekStartStr = formatDateStr(
    weekStart.year,
    weekStart.month,
    weekStart.day,
  );
  const weekEndStr = formatDateStr(weekEnd.year, weekEnd.month, weekEnd.day);

  // 2. Filter schedules in this week
  const weekSchedules = useMemo(() => {
    return schedules
      .filter((s) => s.end_date >= weekStartStr && s.start_date <= weekEndStr)
      .sort((a, b) => {
        // Sort by start date, then by duration (longer first)
        if (a.start_date !== b.start_date)
          return a.start_date.localeCompare(b.start_date);
        const durA =
          new Date(a.end_date).getTime() - new Date(a.start_date).getTime();
        const durB =
          new Date(b.end_date).getTime() - new Date(b.start_date).getTime();
        return durB - durA;
      });
  }, [schedules, weekStartStr, weekEndStr]);

  // 3. Allocate Slots
  // We map each visual schedule item to a "lane" index (0, 1, 2...)
  const visibleItems = useMemo(() => {
    const lanes: string[] = []; // stores the end_date of the last item in this lane
    const items: any[] = [];

    weekSchedules.forEach((s) => {
      // Determine columns (0-6)
      let startCol = 0;
      let endCol = 6;

      // Find precise start col
      if (s.start_date >= weekStartStr) {
        // We can't just use day index because of month boundaries
        // Instead, find the matching day object in 'days' array
        const idx = days.findIndex(
          (d) => formatDateStr(d.year, d.month, d.day) === s.start_date,
        );
        if (idx !== -1) startCol = idx;
      }

      // Find precise end col
      if (s.end_date <= weekEndStr) {
        const idx = days.findIndex(
          (d) => formatDateStr(d.year, d.month, d.day) === s.end_date,
        );
        if (idx !== -1) endCol = idx;
      }

      // Check for free lane
      let laneIndex = -1;
      for (let i = 0; i < lanes.length; i++) {
        // We need a gap? Usually no, but dates are inclusive.
        // If last item ended on '2024-01-01', next item can start on '2024-01-02'.
        // Comparing strings: if lanes[i] < s.start_date
        if (lanes[i] < s.start_date) {
          laneIndex = i;
          break;
        }
      }

      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(s.end_date);
      } else {
        lanes[laneIndex] = s.end_date;
      }

      // Visual Properties
      const isStart = s.start_date >= weekStartStr;
      const isEnd = s.end_date <= weekEndStr;
      const colSpan = endCol - startCol + 1;

      items.push({
        ...s,
        laneIndex,
        startCol,
        colSpan,
        isStart,
        isEnd,
      });
    });

    return items;
  }, [weekSchedules, days, weekStartStr, weekEndStr]);

  // Max visible lanes (rest handled by "more" indicator or just hidden)
  // Since we have a fixed height for aspect-square cells, we can't show infinite.
  // We'll show top 3 lanes? Or dynamic.
  // Let's reserve space for the date number (approx 20-30px).
  // Each bar is maybe 6px + 2px margin.

  return (
    <div className="relative grid grid-cols-7">
      {/* Background Layer: Day Cells */}
      {days.map((dateObj) => {
        const { day, month, year, currentMonth } = dateObj;
        const dStr = formatDateStr(year, month, day);

        const isActive =
          isDateSelected &&
          selectedDate.getDate() === day &&
          selectedDate.getMonth() === month &&
          selectedDate.getFullYear() === year;

        const isToday =
          today.getDate() === day &&
          today.getMonth() === month &&
          today.getFullYear() === year;

        return (
          <div
            key={`bg-${dStr}`}
            onClick={() => onDayClick(day, month, year)}
            className={`relative aspect-square cursor-pointer transition-all group border-r border-b border-gray-50/50 ${
              !currentMonth ? "bg-gray-50/30 text-opacity-30" : ""
            } ${isActive ? "bg-rose-50/30" : "hover:bg-gray-50"}`}
          >
            {/* Day Number */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
              <span
                className={`text-[13px] sm:text-sm font-black transition-all flex items-center justify-center w-7 h-7 rounded-full ${
                  isToday
                    ? "bg-rose-500 text-white shadow-sm"
                    : isActive
                      ? "text-rose-500 scale-110 bg-white shadow-sm ring-1 ring-rose-100"
                      : !currentMonth
                        ? "text-gray-300"
                        : "text-gray-700 group-hover:bg-white group-hover:shadow-sm"
                }`}
              >
                {day}
              </span>
            </div>
          </div>
        );
      })}

      {/* Foreground Layer: Schedule Bars */}
      {/* We use a container that sits on top of the grid but respects the column widths */}
      <div className="absolute inset-0 top-10 pointer-events-none px-0.5">
        {/* Render visible items */}
        {visibleItems.map((item) => {
          // Skip if lane is too high (e.g., > 3) to prevent overflow
          // if (item.laneIndex > 3) return null;

          return (
            <div
              key={`${item.id}-${weekStartStr}`}
              className="absolute h-1.5 sm:h-2 rounded-full shadow-sm"
              style={{
                backgroundColor: item.color,
                left: `${(item.startCol / 7) * 100}%`,
                width: `calc(${(item.colSpan / 7) * 100}% - 4px)`, // -4px for gap
                marginLeft: "2px", // Center in gap
                top: `${item.laneIndex * 10}px`, // Simple stacking
                opacity: 0.9,
                // Border radius logic for continuity
                borderTopLeftRadius: item.isStart ? "9999px" : "0",
                borderBottomLeftRadius: item.isStart ? "9999px" : "0",
                borderTopRightRadius: item.isEnd ? "9999px" : "0",
                borderBottomRightRadius: item.isEnd ? "9999px" : "0",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const CalendarGrid = ({
  currentDate,
  direction,
  schedules,
  selectedDate,
  isDateSelected,
  onDayClick,
  today,
}: CalendarGridProps) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weeks = useMemo(() => {
    // 1. Generate all days
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Previous month filler
    for (let i = firstDay; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        currentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, month, year, currentMonth: true });
    }

    // Next month filler
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

    // 2. Chunk into weeks
    const chunked = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [year, month]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.2, ease: "easeInOut" } }}
      className="bg-white rounded-[32px] pt-6 px-2 pb-2 sm:p-6 shadow-sm border border-rose-50 relative overflow-hidden"
    >
      {/* Header Days */}
      <motion.div
        layout
        className="grid grid-cols-7 mb-2 border-b border-gray-50 pb-2"
      >
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={`text-center text-[12px] sm:text-xs font-black uppercase tracking-widest ${
              i === 0
                ? "text-rose-400"
                : i === 6
                  ? "text-blue-400"
                  : "text-gray-300"
            }`}
          >
            {d}
          </div>
        ))}
      </motion.div>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={calendarVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 200, damping: 25, mass: 0.8 },
              opacity: { duration: 0.3, ease: "easeInOut" },
            }}
            className="flex flex-col"
          >
            {weeks.map((weekDays, i) => (
              <WeekRow
                key={i}
                days={weekDays}
                schedules={schedules}
                onDayClick={onDayClick}
                selectedDate={selectedDate}
                isDateSelected={isDateSelected}
                today={today}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CalendarGrid;
