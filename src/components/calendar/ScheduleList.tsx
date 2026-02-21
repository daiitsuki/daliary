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
      className={`group relative flex items-center gap-4 p-4 transition-all ${
        isClickable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
      } ${!isLast ? "border-b border-gray-100" : ""}`}
    >
      {/* Color Indicator */}
      <div
        className={`w-1 h-10 rounded-full shrink-0 transition-transform ${
          isClickable ? "group-hover:scale-y-110" : ""
        }`}
        style={{ backgroundColor: schedule.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={`text-[15px] font-bold text-gray-800 truncate transition-colors ${
              isClickable ? "group-hover:text-rose-500" : ""
            }`}
          >
            {schedule.title}
          </h4>
          {isToday && (
            <span className="shrink-0 text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              TODAY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Category Badge */}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200/50">
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
          <span className="text-gray-400 font-medium text-[11px] truncate">
            {(() => {
              if (schedule.start_date === schedule.end_date) {
                return schedule.start_date.slice(5).replace("-", ".");
              }
              const start = new Date(schedule.start_date);
              const end = new Date(schedule.end_date);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return `${schedule.start_date.slice(5).replace("-", ".")} - ${schedule.end_date.slice(5).replace("-", ".")} (${diffDays}일간)`;
            })()}
          </span>
        </div>
      </div>

      {isClickable && (
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all"
        />
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
        <div className="flex items-center justify-between mb-6 px-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-rose-400 rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">
              {isSearchActive
                ? "검색 결과"
                : isDateSelected
                  ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
                  : `${month + 1}월 일정`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddSchedule}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-400 text-white rounded-2xl shadow-lg shadow-rose-100 text-xs sm:text-sm font-black transition-all hover:bg-rose-500"
            >
              <Plus size={18} />
              일정 추가
            </motion.button>
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-4 max-h-[500px] lg:max-h-none lg:flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
          {(isDateSelected || isSearchActive) && (
            <div className="px-2 pb-2">
              <button
                onClick={onClearSelection}
                className="text-[11px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 inline-block px-3 py-1 rounded-full border border-rose-100 hover:bg-rose-100 transition-colors"
              >
                전체 일정 보기
              </button>
            </div>
          )}

          <AnimatePresence initial={false} mode="wait">
            {schedules.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-200"
              >
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isSearchActive ? (
                    <Search size={24} className="text-gray-300" />
                  ) : (
                    <CalendarIcon size={24} className="text-gray-300" />
                  )}
                </div>
                <p className="text-gray-400 text-sm font-bold italic">
                  {isSearchActive
                    ? "일치하는 결과가 없습니다."
                    : "일정이 없습니다."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={isDateSelected || isSearchActive ? "filtered" : "all"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {!isDateSelected &&
                !isSearchActive &&
                todaySchedules.length > 0 ? (
                  <>
                    {/* Today Group */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-50 bg-rose-50/30 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-xs font-bold text-gray-500">
                          오늘의 일정
                        </span>
                      </div>
                      <div>
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
                      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <span className="text-xs font-bold text-gray-500">
                            전체 일정
                          </span>
                        </div>
                        <div>
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
                  <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
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
