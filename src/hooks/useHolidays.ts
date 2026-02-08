import { useState, useEffect, useCallback } from "react";
import { Schedule } from "./useSchedules";
import staticHolidaysData from "../data/holidays.json";

interface HolidayData {
  date: string;
  title: string;
}

// Module-level cache to persist across hook instantiations
let cachedHolidaySchedules: Schedule[] | null = null;

export const useHolidays = () => {
  const [showHolidays, setShowHolidays] = useState<boolean>(() => {
    const stored = localStorage.getItem("showHolidays");
    return stored === null ? true : stored === "true";
  });

  const [holidaySchedules, setHolidaySchedules] = useState<Schedule[]>(cachedHolidaySchedules || []);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    return localStorage.getItem('holidaysLastUpdated');
  });

  // Helper: Convert simple HolidayData to Schedule objects
  const convertToSchedules = useCallback((data: HolidayData[]): Schedule[] => {
    return data.map((h, index) => ({
      id: `holiday-${h.date}-${index}`,
      created_at: new Date().toISOString(),
      couple_id: "system",
      writer_id: "system",
      title: h.title,
      description: "공휴일",
      start_date: h.date,
      end_date: h.date,
      color: "#ef4444", // Tailwind red-500
      category: "couple",
    }));
  }, []);

  // Load holidays (Static or Cached)
  useEffect(() => {
    if (!showHolidays) {
      setHolidaySchedules([]);
      return;
    }

    // Use memory cache if available
    if (cachedHolidaySchedules && cachedHolidaySchedules.length > 0) {
      setHolidaySchedules(cachedHolidaySchedules);
      return;
    }

    const cached = localStorage.getItem("cachedHolidays");
    let dataToUse: HolidayData[] = staticHolidaysData as HolidayData[];

    if (cached) {
      try {
        dataToUse = JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached holidays, using static data.", e);
      }
    }

    const schedules = convertToSchedules(dataToUse);
    cachedHolidaySchedules = schedules; // Save to module cache
    setHolidaySchedules(schedules);
  }, [showHolidays, convertToSchedules]);

  const toggleHolidays = (value: boolean) => {
    setShowHolidays(value);
    localStorage.setItem("showHolidays", String(value));
  };

  // Fetch latest holidays from remote
  const refreshHolidays = async () => {
    if (lastUpdated) {
      const last = new Date(lastUpdated).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - last) / (1000 * 60);
      
      if (diffMinutes < 5) {
        alert(`최근에 이미 업데이트했습니다. ${Math.ceil(5 - diffMinutes)}분 후에 다시 시도해주세요.`);
        return;
      }
    }

    setUpdating(true);
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const startYear = currentYear - 2;
      const endYear = currentMonth >= 7 ? currentYear + 1 : currentYear;
      
      const years = [];
      for (let y = startYear; y <= endYear; y++) years.push(y);

      const baseUrl = 'https://holidays.hyunbin.page/';
      
      const results = await Promise.all(
        years.map(year => 
          fetch(`${baseUrl}${year}.json`)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch ${year}`);
              return res.json();
            })
            .catch(() => [])
        )
      );

      const flatHolidays: HolidayData[] = [];
      results.forEach(yearData => {
        if (yearData && typeof yearData === 'object' && !Array.isArray(yearData)) {
          Object.entries(yearData).forEach(([date, names]) => {
            const nameArray = names as string[];
            flatHolidays.push({
              date: date,
              title: nameArray.join(' / ')
            });
          });
        }
      });

      flatHolidays.sort((a, b) => a.date.localeCompare(b.date));

      if (flatHolidays.length > 0) {
        localStorage.setItem('cachedHolidays', JSON.stringify(flatHolidays));
        
        const nowIso = new Date().toISOString();
        localStorage.setItem('holidaysLastUpdated', nowIso);
        setLastUpdated(nowIso);

        const schedules = convertToSchedules(flatHolidays);
        cachedHolidaySchedules = schedules; // Update memory cache

        if (showHolidays) {
            setHolidaySchedules(schedules);
        }
        alert('공휴일 정보를 성공적으로 업데이트했습니다.');
      } else {
        alert('가져올 수 있는 공휴일 정보가 없습니다.');
      }

    } catch (error) {
      console.error('Failed to update holidays:', error);
      alert('공휴일 정보 업데이트에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  return {
    holidaySchedules,
    showHolidays,
    toggleHolidays,
    refreshHolidays,
    updating,
    lastUpdated
  };
};