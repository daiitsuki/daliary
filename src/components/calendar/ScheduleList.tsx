import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Schedule } from "../../hooks/useSchedules";
import { Profile } from "../../types";

interface ScheduleListProps {
  schedules: Schedule[];
  selectedDate: Date;
  isDateSelected: boolean;
  isSearchActive: boolean;
  month: number;
  onClearSelection: () => void;
  onEditSchedule: (schedule: Schedule) => void;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  today: Date;
}

const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return `rgba(100, 116, 139, ${alpha})`; // slate-500
  }
  let c: any = hex.substring(1).split("");
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = "0x" + c.join("");
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${alpha})`;
};

const ScheduleCard = ({
  schedule,
  onClick,
  myProfile,
  partnerProfile,
  isToday,
}: {
  schedule: Schedule;
  onClick: () => void;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  isToday?: boolean;
}) => {
  const isClickable =
    !schedule.id.startsWith("holiday-") &&
    !schedule.id.startsWith("anniversary-");

  const baseColor = schedule.color || "#94a3b8"; // slate-400
  const dateBgColor = hexToRgba(baseColor, 0.1);
  const dateColor = hexToRgba(baseColor, 0.8);

  const isMultiDay = schedule.start_date !== schedule.end_date;
  const startDay = schedule.start_date.slice(-2);
  const endDay = schedule.end_date.slice(-2);
  const day = isMultiDay ? `${startDay}~${endDay}` : startDay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={isClickable ? onClick : undefined}
      className={`group relative flex items-center gap-4 p-4 mb-3 transition-all duration-200 bg-white rounded-3xl border border-gray-100/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${
        isClickable
          ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.98]"
          : "cursor-default"
      }`}
    >
      {/* Accent Bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ backgroundColor: baseColor }}
      />

      {/* Date Number */}
      <div
        className={` ${isMultiDay ? "w-16" : "w-12"} h-12 flex-shrink-0 flex items-center justify-center rounded-2xl`}
        style={{ backgroundColor: dateBgColor }}
      >
        <span
          className={`font-black ${isMultiDay ? "text-base" : "text-xl"}`}
          style={{ color: dateColor }}
        >
          {day}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: hexToRgba(baseColor, 0.1),
              color: hexToRgba(baseColor, 1),
            }}
          >
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
          {isToday && (
            <span className="shrink-0 text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              TODAY
            </span>
          )}
        </div>

        <h4 className="text-sm sm:text-base font-black text-gray-800 truncate">
          {schedule.title}
        </h4>
        {schedule.description &&
          schedule.description !== "공휴일" &&
          schedule.description !== "기념일" && (
            <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5">
              {schedule.description}
            </p>
          )}
      </div>

      {isClickable && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-300 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all -mr-1">
          <ChevronRight size={18} strokeWidth={3} />
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
  onClearSelection,
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

  const isEmpty = schedules.length === 0;

  return (
    <div
      className={`h-full flex flex-col transition-all duration-300 border ${
        isEmpty
          ? "bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-rose-50/50"
          : "bg-transparent border-transparent"
      }`}
    >
      {/* List Content */}
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar ${!isEmpty ? "-mr-2 pr-2" : ""}`}
      >
        <AnimatePresence initial={false} mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 text-center"
            >
              <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {isSearchActive ? (
                  <Search
                    size={32}
                    className="text-gray-200"
                    strokeWidth={2.5}
                  />
                ) : (
                  <CalendarIcon
                    size={32}
                    className="text-gray-200"
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <h3 className="text-gray-800 text-base font-black mb-2">
                {isSearchActive ? "결과가 없습니다" : "일정이 없습니다"}
              </h3>
              <p className="text-gray-400 text-sm font-bold">
                {isSearchActive
                  ? "다른 검색어를 입력해보세요"
                  : "새로운 일정을 등록해보세요"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={isDateSelected || isSearchActive ? "filtered" : "all"}
              className="space-y-6"
            >
              {!isDateSelected &&
              !isSearchActive &&
              todaySchedules.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-[11px] font-black text-gray-300 px-1 mb-3 uppercase tracking-widest">
                      Today
                    </h3>
                    <div className="space-y-1">
                      {todaySchedules.map((s) => (
                        <ScheduleCard
                          key={s.id}
                          schedule={s}
                          onClick={() => onEditSchedule(s)}
                          myProfile={myProfile}
                          partnerProfile={partnerProfile}
                          isToday={true}
                        />
                      ))}
                    </div>
                  </div>

                  {otherSchedules.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-black text-gray-300 px-1 mb-3 uppercase tracking-widest">
                        Upcoming
                      </h3>
                      <div className="space-y-1">
                        {otherSchedules.map((s) => (
                          <ScheduleCard
                            key={s.id}
                            schedule={s}
                            onClick={() => onEditSchedule(s)}
                            myProfile={myProfile}
                            partnerProfile={partnerProfile}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  {schedules.map((s) => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      onClick={() => onEditSchedule(s)}
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
  );
};

export default ScheduleList;
