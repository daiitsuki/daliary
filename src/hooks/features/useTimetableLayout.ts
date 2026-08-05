import { useState, useEffect, useMemo, useCallback } from "react";
import { TimetableBlock } from "../index";
import { getKSTTodayDow, timeToMinutes, getBlockStyle } from "../../utils/timetableUtils";

interface UseTimetableLayoutProps {
  blocks: TimetableBlock[];
  startHour: number;
  endHour: number;
  blockHeightMode: "narrow" | "normal" | "wide";
  compressionMode: "none" | "compact" | "more_compact";
  isExporting: boolean;
  visibleDays: number[];
}

export const useTimetableLayout = ({
  blocks,
  startHour,
  endHour,
  blockHeightMode,
  compressionMode,
  isExporting,
  visibleDays,
}: UseTimetableLayoutProps) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayDow = useMemo(
    () => (isExporting ? -1 : getKSTTodayDow()),
    [isExporting]
  );

  const ACTIVE_HOUR_PX = useMemo(() => {
    if (blockHeightMode === "narrow") return isMobile ? 40 : 48;
    if (blockHeightMode === "wide") return isMobile ? 72 : 80;
    return isMobile ? 56 : 64;
  }, [blockHeightMode, isMobile]);

  const EMPTY_HOUR_PX = useMemo(() => {
    return compressionMode === "none" ? ACTIVE_HOUR_PX : compressionMode === "compact" ? 40 : 24;
  }, [compressionMode, ACTIVE_HOUR_PX]);

  const hourHeights = useMemo(() => {
    const heights = [];
    for (let h = startHour; h < endHour; h++) {
      const hStart = h * 60;
      const hEnd = (h + 1) * 60;

      const isActive = blocks.some((b) => {
        const bStart = timeToMinutes(b.start_time);
        const bEnd = timeToMinutes(b.end_time);
        return bStart < hEnd && bEnd > hStart;
      });

      heights.push(isActive ? ACTIVE_HOUR_PX : EMPTY_HOUR_PX);
    }
    return heights;
  }, [blocks, startHour, endHour, EMPTY_HOUR_PX, ACTIVE_HOUR_PX]);

  const totalHeight = useMemo(
    () => hourHeights.reduce((a, b) => a + b, 0),
    [hourHeights]
  );

  const getMinuteY = useCallback(
    (minute: number) => {
      if (minute <= startHour * 60) return 0;
      if (minute >= endHour * 60) return totalHeight;

      let y = 0;
      const hourIdx = Math.floor(minute / 60) - startHour;

      for (let i = 0; i < hourIdx; i++) {
        y += hourHeights[i];
      }

      const remainder = minute % 60;
      y += (remainder / 60) * hourHeights[hourIdx];

      return y;
    },
    [startHour, endHour, hourHeights, totalHeight]
  );

  const hiddenBlocksCount = useMemo(() => {
    return blocks.filter(
      (b) =>
        !visibleDays.includes(b.day_of_week) ||
        !getBlockStyle(b, startHour, endHour, getMinuteY).visible
    ).length;
  }, [blocks, startHour, endHour, getMinuteY, visibleDays]);

  const hourCount = endHour - startHour;
  const hours = useMemo(
    () => Array.from({ length: hourCount + 1 }, (_, i) => startHour + i),
    [startHour, endHour, hourCount]
  );

  return {
    isMobile,
    currentTime,
    todayDow,
    hourHeights,
    totalHeight,
    getMinuteY,
    hiddenBlocksCount,
    hours,
  };
};
