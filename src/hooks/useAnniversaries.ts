import { useState, useEffect, useCallback, useMemo } from "react";
import { useCouple } from "./useCouple";
import { Schedule } from "../context/SchedulesContext";

// Module-level cache
let cachedAnniversarySchedules: Schedule[] | null = null;

export const useAnniversaries = () => {
  const { couple } = useCouple();
  const [showAnniversaries, setShowAnniversaries] = useState<boolean>(() => {
    const stored = localStorage.getItem("showAnniversaries");
    return stored === null ? true : stored === "true";
  });

  const anniversaryDate = couple?.anniversary_date;

  const toggleAnniversaries = (value: boolean) => {
    setShowAnniversaries(value);
    localStorage.setItem("showAnniversaries", String(value));
  };

  const calculateAnniversaries = useCallback((startDateStr: string): Schedule[] => {
    if (!startDateStr) return [];

    const schedules: Schedule[] = [];
    const startDate = new Date(startDateStr);
    
    // Ensure we are working with KST-like date (no time component)
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 2;

    // 1. 100-day intervals (up to approximately the end year)
    // 10000 days is about 27 years, which is plenty for now.
    for (let days = 100; days <= 10000; days += 100) {
      const targetDate = new Date(startYear, startMonth, startDay + (days - 1));
      if (targetDate.getFullYear() > endYear) break;

      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      
      schedules.push({
        id: `anniversary-100-${days}-${dateStr}`,
        created_at: new Date().toISOString(),
        couple_id: "system-anniversary",
        writer_id: "system",
        title: `${days}일`,
        description: "기념일",
        start_date: dateStr,
        end_date: dateStr,
        color: "#818CF8", // indigo-400
        category: "couple",
      });
    }

    // 2. Yearly anniversaries
    for (let years = 1; years <= 50; years++) {
      const targetDate = new Date(startYear + years, startMonth, startDay);
      if (targetDate.getFullYear() > endYear) break;

      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      
      schedules.push({
        id: `anniversary-year-${years}-${dateStr}`,
        created_at: new Date().toISOString(),
        couple_id: "system-anniversary",
        writer_id: "system",
        title: `${years}주년`,
        description: "기념일",
        start_date: dateStr,
        end_date: dateStr,
        color: "#818CF8", // indigo-400
        category: "couple",
      });
    }

    return schedules;
  }, []);

  const anniversarySchedules = useMemo(() => {
    if (!showAnniversaries || !anniversaryDate) {
      return [];
    }

    // If we have it in cache, return it
    if (cachedAnniversarySchedules) {
      return cachedAnniversarySchedules;
    }

    const schedules = calculateAnniversaries(anniversaryDate);
    cachedAnniversarySchedules = schedules;
    return schedules;
  }, [showAnniversaries, anniversaryDate, calculateAnniversaries]);

  // Clear cache when anniversary date changes
  useEffect(() => {
    cachedAnniversarySchedules = null;
  }, [anniversaryDate]);

  return {
    anniversarySchedules,
    showAnniversaries,
    toggleAnniversaries,
  };
};
