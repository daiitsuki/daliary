import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "../constants/animations";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useSchedules, Schedule, ScheduleInput } from "../hooks";
import { useHolidays } from "../hooks";
import { useAnniversaries } from "../hooks";
import { useHomeData } from "../hooks";
import { useTrips } from "../hooks";
import { parseTripTitle } from "../utils/tripHelpers";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import ScheduleList from "../components/calendar/ScheduleList";
import ScheduleModal from "../components/calendar/ScheduleModal";
import TimetableView from "../components/timetable/TimetableView";
import { TimetableProvider } from "../context/TimetableContext";
import { useToast } from "../context/ToastContext";

type CalendarTab = "calendar" | "timetable";

const Calendar = () => {
  const [activeTab, setActiveTab] = useState<CalendarTab>("calendar");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { schedules, addSchedule, updateSchedule, deleteSchedule } =
    useSchedules();
  const { holidaySchedules } = useHolidays();
  const { anniversarySchedules } = useAnniversaries();
  const { myProfile, partnerProfile } = useHomeData();
  const { trips } = useTrips();
  const { showToast } = useToast();

  const [syncTrips] = useState<boolean>(() => {
    const stored = localStorage.getItem("syncTripsToCalendar");
    return stored === null ? true : stored === "true";
  });

  const tripSchedules = useMemo(() => {
    if (!syncTrips || !trips) return [];
    return trips.map((trip) => {
      const { rawTitle } = parseTripTitle(trip.title);
      return {
        id: `trip-${trip.id}`,
        created_at: trip.created_at || new Date().toISOString(),
        couple_id: trip.couple_id,
        writer_id: "system",
        title: `✈️ [여행] ${rawTitle}`,
        description: "여행 계획",
        start_date: trip.start_date,
        end_date: trip.end_date,
        color: "#0d9488", // teal-600
        category: "couple" as const,
      };
    });
  }, [trips, syncTrips]);

  const allSchedules = useMemo(() => {
    const combined = [
      ...schedules,
      ...holidaySchedules,
      ...anniversarySchedules,
      ...tripSchedules,
    ];
    return combined.sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [schedules, holidaySchedules, anniversarySchedules, tripSchedules]);

  // 1. Date & View States
  const getKSTToday = useCallback(() => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  }, []);

  const [currentDate, setCurrentDate] = useState(getKSTToday());
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getKSTToday());
  const [isDateSelected, setIsDateSelected] = useState(false);

  // Handle URL Parameters (Deep Linking)
  useEffect(() => {
    let hasChanges = false;
    const newParams = new URLSearchParams(searchParams);

    const dateParam = searchParams.get("date");
    if (dateParam) {
      // YYYY-MM-DD 문자열을 로컬 타임존 기준으로 안전하게 파싱하여 타임존 오프셋에 의한 날짜 밀림 현상 방지
      const [y, mStr, d] = dateParam.split("-").map(Number);
      const parsedDate = new Date(y, mStr - 1, d);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(
          new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1),
        );
        setSelectedDate(parsedDate);
        setIsDateSelected(true);

        newParams.delete("date");
        hasChanges = true;
      }
    }

    const tabParam = searchParams.get("tab") as CalendarTab;
    if (tabParam === "calendar" || tabParam === "timetable") {
      setActiveTab(tabParam);
      newParams.delete("tab");
      hasChanges = true;
    }

    if (hasChanges) {
      // URL에서 파라미터 제거하여 새로고침 시 중복 동작 방지
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // 2. Search & Modal States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  /** 탭 전환 시 열려있는 ScheduleModal을 강제로 닫음 */
  const handleTabChange = (tab: CalendarTab) => {
    setActiveTab(tab);
    if (tab === "timetable") {
      setShowModal(false);
      setEditingSchedule(null);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const visibleSchedules = useMemo(() => {
    if (isSearchActive && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return allSchedules.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
    }
    if (isDateSelected) {
      const dateStr = formatDate(selectedDate);
      return allSchedules.filter(
        (s) => dateStr >= s.start_date && dateStr <= s.end_date,
      );
    }
    return allSchedules.filter((s) => {
      const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      return s.start_date <= endOfMonth && s.end_date >= startOfMonth;
    });
  }, [
    allSchedules,
    isSearchActive,
    searchQuery,
    isDateSelected,
    selectedDate,
    year,
    month,
  ]);

  // --- Handlers ---

  const handleMonthChange = (offset: number) => {
    setDirection(offset);
    setCurrentDate(new Date(year, month + offset, 1));
    setIsDateSelected(false);
    setIsSearchActive(false);
  };

  const handleJumpToDate = (y: number, m: number) => {
    const targetDate = new Date(y, m, 1);
    const currentMonthDate = new Date(year, month, 1);

    if (targetDate.getTime() === currentMonthDate.getTime()) return;

    setDirection(targetDate > currentMonthDate ? 1 : -1);
    setCurrentDate(targetDate);
    setIsDateSelected(false);
    setIsSearchActive(false);
  };

  const handleGoToday = () => {
    const today = getKSTToday();
    const currentMonthTime = new Date(year, month, 1).getTime();
    const todayMonthTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ).getTime();

    setDirection(
      todayMonthTime > currentMonthTime
        ? 1
        : todayMonthTime < currentMonthTime
          ? -1
          : 0,
    );
    setCurrentDate(today);
    setIsDateSelected(false);
    setIsSearchActive(false);
  };

  const handleDayClick = (d: number, m: number, y: number) => {
    const isSame =
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === m &&
      selectedDate.getFullYear() === y;
    if (isSame && isDateSelected) {
      setIsDateSelected(false);
    } else {
      setSelectedDate(new Date(y, m, d));
      setIsDateSelected(true);
      setIsSearchActive(false);
      if (m !== month) {
        const targetDate = new Date(y, m, 1);
        const currentMonthDate = new Date(year, month, 1);
        setDirection(targetDate > currentMonthDate ? 1 : -1);
        setCurrentDate(new Date(y, m, 1));
      }
    }
  };

  const handleClearSelection = () => {
    setIsDateSelected(false);
    setIsSearchActive(false);
    setSearchQuery("");
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setShowModal(true);
  };

  const openEditModal = (s: Schedule) => {
    if (s.id.startsWith("holiday-") || s.id.startsWith("anniversary-")) return;
    if (s.id.startsWith("trip-")) {
      const tripId = s.id.replace("trip-", "");
      navigate(`/places?tab=plans&tripId=${tripId}`);
      return;
    }
    setEditingSchedule(s);
    setShowModal(true);
  };

  const handleSave = async (data: ScheduleInput) => {
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await addSchedule(data);
      }
    } catch (error) {
      showToast("저장에 실패했어요.", "error");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
    } catch (error) {
      showToast("삭제를 실패했어요.", "error");
      console.error(error);
    }
  };

  return (
    <div className="custom-scrollbar flex flex-1 flex-col overflow-hidden bg-gray-50/30 pb-24 lg:h-full lg:pb-24">
      {/* 탭 전환 UI */}
      <div className="sticky top-0 z-30 flex shrink-0 justify-center bg-white px-4 pt-4 pb-2 backdrop-blur-md">
        <div className="relative flex w-full max-w-[280px] items-center rounded-2xl bg-gray-100/80 p-1">
          {[
            {
              id: "calendar" as CalendarTab,
              label: "캘린더",
              icon: CalendarIcon,
            },
            { id: "timetable" as CalendarTab, label: "시간표", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors outline-none ${isActive ? "text-rose-500" : "text-gray-400 hover:text-gray-600"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="calendarTabPill"
                    className="absolute inset-0 rounded-xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Icon size={14} strokeWidth={2.5} />
                  <span className="pt-0.5 text-xs leading-none font-black">
                    {tab.label}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        {activeTab === "calendar" ? (
          <motion.div
            key="calendar-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 overflow-y-auto lg:flex lg:flex-col lg:overflow-hidden"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto w-full max-w-[1600px] px-4 py-3 lg:flex lg:h-full lg:flex-col"
            >
              <motion.div variants={itemVariants}>
                <CalendarHeader
                  currentDate={currentDate}
                  onMonthChange={handleMonthChange}
                  onJumpToDate={handleJumpToDate}
                  onGoToday={handleGoToday}
                  isSearchActive={isSearchActive}
                  setIsSearchActive={setIsSearchActive}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </motion.div>

              <div className="mt-3 flex flex-col items-start gap-8 lg:min-h-0 lg:flex-1 lg:flex-row">
                <motion.div
                  variants={itemVariants}
                  className="w-full lg:h-full lg:flex-1"
                >
                  <CalendarGrid
                    currentDate={currentDate}
                    direction={direction}
                    schedules={allSchedules}
                    selectedDate={selectedDate}
                    isDateSelected={isDateSelected}
                    onDayClick={handleDayClick}
                    onMonthChange={handleMonthChange}
                    onAddSchedule={openAddModal}
                    today={getKSTToday()}
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="w-full shrink-0 lg:h-full lg:w-[380px]"
                >
                  <ScheduleList
                    schedules={visibleSchedules}
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    isDateSelected={isDateSelected}
                    isSearchActive={isSearchActive}
                    onEditSchedule={openEditModal}
                    myProfile={myProfile}
                    partnerProfile={partnerProfile}
                    today={getKSTToday()}
                    onClearSelection={handleClearSelection}
                  />
                </motion.div>
              </div>
            </motion.div>

            <ScheduleModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              initialDate={formatDate(selectedDate)}
              scheduleToEdit={editingSchedule}
              onSave={handleSave}
              onDelete={handleDelete}
              myProfile={myProfile}
              partnerProfile={partnerProfile}
            />
          </motion.div>
        ) : (
          <motion.div
            key="timetable-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4"
          >
            <TimetableView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CalendarWithProvider = () => (
  <TimetableProvider>
    <Calendar />
  </TimetableProvider>
);

export default CalendarWithProvider;
