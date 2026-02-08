import { useState, useMemo, useCallback } from "react";
import { motion, Variants } from "framer-motion";
import { useSchedules, Schedule, ScheduleInput } from "../hooks/useSchedules";
import { useHolidays } from "../hooks/useHolidays";
import { useHomeData } from "../hooks/useHomeData";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import ScheduleList from "../components/calendar/ScheduleList";
import ScheduleModal from "../components/calendar/ScheduleModal";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const Calendar = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const { holidaySchedules } = useHolidays();
  const { myProfile, partnerProfile } = useHomeData();

  const allSchedules = useMemo(() => {
    const combined = [...schedules, ...holidaySchedules];
    return combined.sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [schedules, holidaySchedules]);

  // 1. Date & View States
  const getKSTToday = useCallback(() => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  }, []);

  const [currentDate, setCurrentDate] = useState(getKSTToday());
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getKSTToday());
  const [isDateSelected, setIsDateSelected] = useState(false);

  // 2. Search & Modal States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const visibleSchedules = useMemo(() => {
    if (isSearchActive && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return allSchedules.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (isDateSelected) {
      const dateStr = formatDate(selectedDate);
      return allSchedules.filter(s => dateStr >= s.start_date && dateStr <= s.end_date);
    }
    return allSchedules.filter(s => {
      const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      return s.start_date <= endOfMonth && s.end_date >= startOfMonth;
    });
  }, [allSchedules, isSearchActive, searchQuery, isDateSelected, selectedDate, year, month]);

  // --- Handlers ---

  const handleMonthChange = (offset: number) => {
    setDirection(offset);
    setCurrentDate(new Date(year, month + offset, 1));
    setIsDateSelected(false);
    setIsSearchActive(false);
  };

  const handleGoToday = () => {
    const today = getKSTToday();
    const currentMonthTime = new Date(year, month, 1).getTime();
    const todayMonthTime = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    
    setDirection(todayMonthTime > currentMonthTime ? 1 : todayMonthTime < currentMonthTime ? -1 : 0);
    setCurrentDate(today);
    setIsDateSelected(false);
    setIsSearchActive(false);
  };

  const handleDayClick = (d: number, m: number, y: number) => {
    const isSame = selectedDate.getDate() === d && selectedDate.getMonth() === m && selectedDate.getFullYear() === y;
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
    if (s.id.startsWith("holiday-")) return;
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
      alert("저장 실패");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
    } catch (error) {
      alert("삭제 실패");
      console.error(error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6 lg:py-10"
      >
        <motion.div variants={itemVariants}>
          <CalendarHeader
            currentDate={currentDate}
            onMonthChange={handleMonthChange}
            onGoToday={handleGoToday}
            isSearchActive={isSearchActive}
            setIsSearchActive={setIsSearchActive}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
          <motion.div variants={itemVariants} className="w-full lg:flex-1">
            <CalendarGrid
              currentDate={currentDate}
              direction={direction}
              schedules={allSchedules}
              selectedDate={selectedDate}
              isDateSelected={isDateSelected}
              onDayClick={handleDayClick}
              today={getKSTToday()}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="w-full lg:w-[380px] shrink-0">
            <ScheduleList
              schedules={visibleSchedules}
              selectedDate={selectedDate}
              isDateSelected={isDateSelected}
              isSearchActive={isSearchActive}
              month={month}
              onClearSelection={handleClearSelection}
              onAddSchedule={openAddModal}
              onEditSchedule={openEditModal}
              myProfile={myProfile}
              partnerProfile={partnerProfile}
              today={getKSTToday()}
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
    </div>
  );
};

export default Calendar;