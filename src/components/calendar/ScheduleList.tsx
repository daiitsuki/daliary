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

const ScheduleCard = ({
  schedule,
  onClick,
  isSelected,
  myProfile,
  partnerProfile,
  isToday,
}: {
  schedule: Schedule;
  onClick: () => void;
  isSelected: boolean;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  isToday?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`bg-white p-5 rounded-[28px] shadow-sm border transition-all flex items-center justify-between group cursor-pointer hover:shadow-md ${
      isSelected
        ? "border-rose-200 ring-1 ring-rose-50 shadow-rose-50/50"
        : isToday
          ? "border-rose-100 bg-rose-50/30"
          : "border-gray-50"
    }`}
  >
    <div className="flex items-center gap-4">
      <div
        className="w-1.5 h-12 rounded-full"
        style={{ backgroundColor: schedule.color }}
      />
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] sm:text-[15px] font-bold text-gray-800 group-hover:text-rose-500 transition-colors line-clamp-1">
            {schedule.title}
          </h4>
          {isToday && (
            <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 uppercase">
              Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-gray-400 font-black bg-white/50 px-2 py-0.5 rounded-lg uppercase border border-gray-100/50">
            {schedule.id.startsWith("holiday-")
              ? "공휴일"
              : schedule.category === "me"
                ? myProfile?.nickname || "나"
                : schedule.category === "partner"
                  ? partnerProfile?.nickname || "상대방"
                  : "우리"}
          </span>
          <p className="text-[11px] text-gray-400 font-bold">
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
          </p>
        </div>
      </div>
    </div>
    <ChevronRight
      size={18}
      className={`transition-all ${
        isSelected
          ? "text-rose-300 translate-x-1"
          : "text-gray-200 group-hover:text-rose-300 group-hover:translate-x-1"
      }`}
    />
  </motion.div>
);

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
    <div className="w-full lg:w-[380px] shrink-0">
      <div className="sticky top-6">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-rose-400 rounded-full" />
            <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">
              {isSearchActive
                ? "검색 결과"
                : isDateSelected
                  ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                  : `${month + 1}월 전체 일정`}
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

        <div className="space-y-4 max-h-[500px] lg:max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2 pb-10">
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
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {!isDateSelected &&
                !isSearchActive &&
                todaySchedules.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 px-2 pb-1">
                      <span className="text-[11px] font-bold text-gray-400">
                        오늘 일정
                      </span>
                    </div>
                    {todaySchedules.map((s) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        onClick={() => onEditSchedule(s)}
                        isSelected={false}
                        myProfile={myProfile}
                        partnerProfile={partnerProfile}
                        isToday={true}
                      />
                    ))}
                    {otherSchedules.length > 0 && (
                      <div className="flex items-center gap-2 px-2 pt-4 pb-1">
                        <span className="text-[11px] font-bold text-gray-400">
                          전체 일정
                        </span>
                      </div>
                    )}
                    {otherSchedules.map((s) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        onClick={() => onEditSchedule(s)}
                        isSelected={false}
                        myProfile={myProfile}
                        partnerProfile={partnerProfile}
                      />
                    ))}
                  </>
                ) : (
                  schedules.map((s) => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      onClick={() => onEditSchedule(s)}
                      isSelected={
                        isDateSelected &&
                        formatDate(selectedDate) >= s.start_date &&
                        formatDate(selectedDate) <= s.end_date
                      }
                      myProfile={myProfile}
                      partnerProfile={partnerProfile}
                      isToday={
                        formatDate(today) >= s.start_date &&
                        formatDate(today) <= s.end_date
                      }
                    />
                  ))
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
