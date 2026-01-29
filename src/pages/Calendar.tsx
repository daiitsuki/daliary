import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSchedules, Schedule, ScheduleInput } from "../hooks/useSchedules";
import { useHomeData } from "../hooks/useHomeData";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import ScheduleList from "../components/calendar/ScheduleList";
import ScheduleModal from "../components/calendar/ScheduleModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20
    }
  }
};

const Calendar = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const { myProfile, partnerProfile } = useHomeData();

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
      return schedules.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (isDateSelected) {
      const dateStr = formatDate(selectedDate);
      return schedules.filter(s => dateStr >= s.start_date && dateStr <= s.end_date);
    }
    return schedules.filter(s => {
      const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      return s.start_date <= endOfMonth && s.end_date >= startOfMonth;
    });
  }, [schedules, isSearchActive, searchQuery, isDateSelected, selectedDate, year, month]);

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
    setSelectedDate(today);
    setIsDateSelected(true);
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
        setDirection(m > month ? 1 : -1);
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30"
    >
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        
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

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <motion.div variants={itemVariants} className="w-full lg:flex-1">
            <CalendarGrid
              currentDate={currentDate}
              direction={direction}
              schedules={schedules}
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
            />
          </motion.div>
        </div>
      </div>

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
  );
};

export default Calendar;