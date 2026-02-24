import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  ChevronRight,
} from "lucide-react";
import { Schedule } from "../../hooks/useSchedules";
import { Profile } from "../../types";

interface ScheduleListProps {
  schedules: Schedule[];
  selectedDate: Date;
  isDateSelected: boolean;
  isSearchActive: boolean;
  month: number;
  onClearSelection: () => void;
  onAddSchedule: () => void;
  onEditSchedule: (schedule: Schedule) => void;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  today: Date;
}

const ScheduleRow = ({
  schedule,
  onClick,
  isLast,
  myProfile,
  partnerProfile,
  isToday,
}: {
  schedule: Schedule;
  onClick: () => void;
  isLast: boolean;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  isToday?: boolean;
}) => {
  const isClickable =
    !schedule.id.startsWith("holiday-") &&
    !schedule.id.startsWith("anniversary-");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={isClickable ? onClick : undefined}
      className={`group relative flex items-center gap-3.5 p-3.5 sm:p-4 transition-all ${
        isClickable ? "cursor-pointer hover:bg-gray-50/50" : "cursor-default"
      } ${!isLast ? "border-b border-gray-50/50" : ""}`}
    >
      {/* Color Indicator */}
      <div
        className={`w-1.5 h-8 rounded-full shrink-0 transition-transform ${
          isClickable ? "group-hover:scale-y-110" : ""
        }`}
        style={{ backgroundColor: schedule.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={`text-[15px] font-black text-gray-700 truncate transition-colors ${
              isClickable ? "group-hover:text-rose-500" : ""
            }`}
          >
            {schedule.title}
          </h4>
          {isToday && (
            <span className="shrink-0 text-[8px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100/50">
              TODAY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Category Badge */}
          <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-gray-50 text-gray-400 border border-gray-100/50">
            {schedule.id.startsWith("holiday-")
              ? "공휴일"
              : schedule.id.startsWith("anniversary-")
                ? "기념일"
                : schedule.category === "me"
                  ? myProfile?.nickname || "나"
                  : schedule.category === "partner"
                    ? partnerProfile?.nickname || "상대방"
                    : "우리"}
          </span>

          {/* Date Info */}
          <span className="text-gray-300 font-bold text-[10px] truncate tracking-tight">
            {(() => {
              if (schedule.start_date === schedule.end_date) {
                return schedule.start_date.slice(5).replace("-", ".");
              }
              const start = new Date(schedule.start_date);
              const end = new Date(schedule.end_date);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return `${schedule.start_date.slice(5).replace("-", ".")} - ${schedule.end_date.slice(5).replace("-", ".")} (${diffDays}일)`;
            })()}
          </span>
        </div>
      </div>

      {isClickable && (
        <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-rose-50">
          <ChevronRight
            size={12}
            className="text-gray-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all"
          />
        </div>
      )}
    </motion.div>
  );
};

const ScheduleList = ({
  schedules,
  selectedDate,
  isDateSelected,
  isSearchActive,
  month,
  onClearSelection,
  onAddSchedule,
  onEditSchedule,
  myProfile,
  partnerProfile,
  today,
}: ScheduleListProps) => {
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDate(today);
  const todaySchedules = schedules.filter(
    (s) => todayStr >= s.start_date && todayStr <= s.end_date,
  );
  const otherSchedules = schedules.filter(
    (s) => !(todayStr >= s.start_date && todayStr <= s.end_date),
  );

  return (
    <div className="w-full lg:w-[380px] shrink-0 lg:h-full lg:flex lg:flex-col ">
      <div className="lg:static lg:h-full lg:flex lg:flex-col">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4 px-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 bg-rose-400/80 rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">
              {isSearchActive
                ? "검색 결과"
                : isDateSelected
                  ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
                  : `${month + 1}월 일정`}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddSchedule}
            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 text-rose-500 rounded-full shadow-sm hover:shadow-md hover:border-rose-100 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* List Content */}
        <div className="space-y-3.5 max-h-[500px] lg:max-h-none lg:flex-1 overflow-y-auto custom-scrollbar pr-0.5 pb-24">
          {(isDateSelected || isSearchActive) && (
            <div className="px-1 pb-0.5">
              <button
                onClick={onClearSelection}
                className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-3.5 py-1.5 rounded-full border border-gray-100 hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm"
              >
                전체 일정 보기
              </button>
            </div>
          )}

          <AnimatePresence initial={false} mode="wait">
            {schedules.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 text-center bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <div className="bg-gray-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100/50">
                  {isSearchActive ? (
                    <Search size={20} className="text-gray-200" />
                  ) : (
                    <CalendarIcon size={20} className="text-gray-200" />
                  )}
                </div>
                <p className="text-gray-400 text-[13px] font-black italic tracking-tight">
                  {isSearchActive ? "결과를 찾을 수 없어요" : "일정이 없어요"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={isDateSelected || isSearchActive ? "filtered" : "all"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {!isDateSelected &&
                !isSearchActive &&
                todaySchedules.length > 0 ? (
                  <>
                    {/* Today Group */}
                    <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50/50 bg-rose-50/20 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-rose-400 animate-pulse" />
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                          Today's Schedules
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50/50">
                        {todaySchedules.map((s, i) => (
                          <ScheduleRow
                            key={s.id}
                            schedule={s}
                            onClick={() => onEditSchedule(s)}
                            isLast={i === todaySchedules.length - 1}
                            myProfile={myProfile}
                            partnerProfile={partnerProfile}
                            isToday={true}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Other Schedules Group */}
                    {otherSchedules.length > 0 && (
                      <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50/50 bg-gray-50/30 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            All Schedules
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50/50">
                          {otherSchedules.map((s, i) => (
                            <ScheduleRow
                              key={s.id}
                              schedule={s}
                              onClick={() => onEditSchedule(s)}
                              isLast={i === otherSchedules.length - 1}
                              myProfile={myProfile}
                              partnerProfile={partnerProfile}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Single List (Date Selected or Search) */
                  <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
                    <div className="divide-y divide-gray-50/50">
                      {schedules.map((s, i) => (
                        <ScheduleRow
                          key={s.id}
                          schedule={s}
                          onClick={() => onEditSchedule(s)}
                          isLast={i === schedules.length - 1}
                          myProfile={myProfile}
                          partnerProfile={partnerProfile}
                          isToday={
                            formatDate(today) >= s.start_date &&
                            formatDate(today) <= s.end_date
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ScheduleList;
