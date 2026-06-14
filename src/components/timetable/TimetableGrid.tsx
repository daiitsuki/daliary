import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Clock, AlignLeft, EyeOff } from "lucide-react";
import { TimetableBlock } from "../../hooks/useTimetable";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface TimetableGridProps {
  myBlocks: TimetableBlock[];
  partnerBlocks: TimetableBlock[];
  viewMode: "my" | "partner";
  onBlockClick: (block: TimetableBlock) => void;
  onAddBlock: (dayOfWeek?: number, defaultHour?: number) => void;
  isPartnerView: boolean;
  partnerName?: string;
  startHour: number;
  endHour: number;
  compressionMode: "none" | "compact" | "more_compact";
  weekStart: "sunday" | "monday";
  visibleDays: number[];
  isExporting?: boolean;
  gridRef?: React.RefObject<HTMLDivElement | null>;
  showTime?: boolean;
  showPlace?: boolean;
  showMemo?: boolean;
  fitToScreen?: boolean;
  blockHeightMode?: "narrow" | "normal" | "wide";
}

// ──────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────

/** KST 기준 오늘 요일 반환 (0=일 ~ 6=토). 컴포넌트 내부에서 useMemo로 호출 */
const getKSTTodayDow = (): number => {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getDay();
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const getBlockStyle = (
  block: TimetableBlock,
  startHour: number,
  endHour: number,
  getMinuteY: (m: number) => number,
): { top: number; height: number; visible: boolean } => {
  const rangeStart = startHour * 60;
  const rangeEnd = endHour * 60;
  const blockStart = timeToMinutes(block.start_time);
  const blockEnd = timeToMinutes(block.end_time);

  // 완전히 범위 밖 → 숨김
  if (blockEnd <= rangeStart || blockStart >= rangeEnd) {
    return { top: 0, height: 0, visible: false };
  }

  const clampedStart = Math.max(blockStart, rangeStart);
  const clampedEnd = Math.min(blockEnd, rangeEnd);

  const top = getMinuteY(clampedStart);
  const height = Math.max(getMinuteY(clampedEnd) - top, 20); // 최소 높이 20px

  return { top, height, visible: true };
};

/**
 * 겹치는 블록들에 column offset(col)과 총 column 수(cols)를 부여.
 *
 * cols 계산 전략:
 * - 각 블록과 시간이 겹치는 블록들의 집합을 찾아 maxCol을 구함
 * - 하나의 블록은 직접 겹치는 블록들의 최대 col + 1로 cols를 설정
 * - 이후 연결된 블록 그룹 내에서 cols를 동일하게 맞춤 (전파)
 */
const layoutBlocks = (
  blocks: TimetableBlock[],
): Array<{ block: TimetableBlock; col: number; cols: number }> => {
  if (blocks.length === 0) return [];

  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  );

  const result: Array<{ block: TimetableBlock; col: number; cols: number }> =
    [];
  const columns: TimetableBlock[][] = [];

  // 1단계: 열 배정
  for (const block of sorted) {
    const start = timeToMinutes(block.start_time);
    let placed = false;

    for (const c of columns) {
      const lastInCol = c[c.length - 1];
      if (timeToMinutes(lastInCol.end_time) <= start) {
        c.push(block);
        result.push({ block, col: columns.indexOf(c), cols: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([block]);
      result.push({ block, col: columns.length - 1, cols: 0 });
    }
  }

  // 2단계: 각 블록의 직접 겹침 기반 cols 계산
  for (const item of result) {
    const s = timeToMinutes(item.block.start_time);
    const e = timeToMinutes(item.block.end_time);
    let maxCol = item.col;
    for (const other of result) {
      const os = timeToMinutes(other.block.start_time);
      const oe = timeToMinutes(other.block.end_time);
      if (os < e && oe > s) {
        maxCol = Math.max(maxCol, other.col);
      }
    }
    item.cols = maxCol + 1;
  }

  // 3단계: 연결된 그룹 내 cols 값 통일 (간접 겹침 전파)
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of result) {
      const s = timeToMinutes(item.block.start_time);
      const e = timeToMinutes(item.block.end_time);
      for (const other of result) {
        const os = timeToMinutes(other.block.start_time);
        const oe = timeToMinutes(other.block.end_time);
        if (os < e && oe > s && other.cols !== item.cols) {
          const newCols = Math.max(item.cols, other.cols);
          item.cols = newCols;
          other.cols = newCols;
          changed = true;
        }
      }
    }
  }

  return result;
};

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

const TimetableGrid = ({
  myBlocks,
  partnerBlocks,
  viewMode,
  onBlockClick,
  onAddBlock,
  isPartnerView,
  partnerName,
  startHour,
  endHour,
  compressionMode,
  weekStart,
  visibleDays,
  isExporting = false,
  gridRef,
  showTime = true,
  showPlace = true,
  showMemo = false,
  fitToScreen = false,
  blockHeightMode = "normal",
}: TimetableGridProps) => {
  // 단일 스크롤 컨테이너 ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
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
    }, 60000); // 1분마다 업데이트
    return () => clearInterval(interval);
  }, []);

  /** 렌더링 시점 기준 오늘 요일 (자정 넘김 대응) - 저장 시에는 -1로 숨김 처리 */
  const todayDow = useMemo(
    () => (isExporting ? -1 : getKSTTodayDow()),
    [isExporting],
  );

  const orderedDays = useMemo(() => {
    return weekStart === "monday"
      ? [1, 2, 3, 4, 5, 6, 0]
      : [0, 1, 2, 3, 4, 5, 6];
  }, [weekStart]);

  const activeDays = useMemo(() => {
    return orderedDays.filter((d) => visibleDays.includes(d));
  }, [orderedDays, visibleDays]);

  const blocks = viewMode === "my" ? myBlocks : partnerBlocks;
  
  const ACTIVE_HOUR_PX = useMemo(() => {
    if (blockHeightMode === "narrow") return isMobile ? 40 : 48;
    if (blockHeightMode === "wide") return isMobile ? 72 : 80;
    return isMobile ? 56 : 64; // normal
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
    [hourHeights],
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
    [startHour, endHour, hourHeights, totalHeight],
  );

  const hiddenBlocksCount = useMemo(() => {
    return blocks.filter(
      (b) =>
        !visibleDays.includes(b.day_of_week) ||
        !getBlockStyle(b, startHour, endHour, getMinuteY).visible,
    ).length;
  }, [blocks, startHour, endHour, getMinuteY, visibleDays]);

  const hourCount = endHour - startHour;
  const hours = useMemo(
    () => Array.from({ length: hourCount + 1 }, (_, i) => startHour + i),
    [startHour, endHour, hourCount],
  );

  const blocksByDay = useMemo(() => {
    return DAYS.map((_, dayIdx) => {
      const dayBlocks = blocks.filter((b) => b.day_of_week === dayIdx);
      return layoutBlocks(dayBlocks);
    });
  }, [blocks]);

  // 오늘 요일 열로 초기 스크롤
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const activeIdx = activeDays.indexOf(todayDow);
    if (activeIdx === -1 || activeIdx === 0) return; // 안보이거나 이미 첫 번째 열

    requestAnimationFrame(() => {
      const timeColWidth = 48;
      const dayWidth = (el.scrollWidth - timeColWidth) / activeDays.length;
      el.scrollLeft = dayWidth * activeIdx - timeColWidth / 2;
    });
  }, [todayDow, activeDays]);

  return (
    <div
      ref={gridRef}
      className="relative flex flex-col h-full min-h-0 bg-white rounded-[28px] border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden"
    >
      {/* ── 빈 시간표 온보딩 오버레이 ── */}
      {blocks.length === 0 && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 text-center flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl opacity-40">📝</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400">
                {isPartnerView
                  ? `${partnerName}님의 시간표가 비어있어요`
                  : "등록된 시간표가 없어요"}
              </p>
              {!isPartnerView && (
                <p className="text-xs sm:text-sm font-bold text-gray-400 mt-1.5">
                  시간표를 탭하여 스케줄을 등록하세요
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 숨겨진 블록 경고 뱃지 */}
      <AnimatePresence>
        {hiddenBlocksCount > 0 && blocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-40 export-hide"
          >
            <div className="bg-gray-800/85 text-white text-[10px] sm:text-xs font-semibold px-3.5 py-2 rounded-full backdrop-blur-sm pointer-events-none shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-1.5 whitespace-nowrap">
              <EyeOff size={12} strokeWidth={3} />
              {hiddenBlocksCount}개의 일정이 숨겨져 있어요
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        ─────────────────────────────────────────────────
        단일 스크롤 컨테이너:
          - overflow: auto  → 세로·가로 동시 스크롤
          - 헤더 행: sticky top-0   → 세로 스크롤 시 고정
          - 시간 열: sticky left-0  → 가로 스크롤 시 고정
          - 코너 셀: sticky top-0 left-0, z-index 최상위
        ─────────────────────────────────────────────────
      */}
      <div
        ref={containerRef}
        className={`flex-1 ${fitToScreen ? "overflow-y-auto overflow-x-hidden" : "overflow-auto"} custom-scrollbar`}
      >
        <div
          style={
            fitToScreen
              ? { width: "100%", minWidth: "100%" }
              : { minWidth: 48 + activeDays.length * 80 }
          }
        >
          {/* ── 요일 헤더 (sticky top) ── */}
          <div className="sticky top-0 z-50 flex bg-white border-b border-gray-50">
            {/* 좌상단 코너 — sticky left AND sticky top */}
            <div className="w-8 shrink-0 sticky left-0 z-50 bg-white border-r border-gray-50" />

            {activeDays.map((dayIdx) => (
              <div
                key={dayIdx}
                className="flex-1 py-1 text-center border-r border-gray-50 last:border-r-0"
                style={fitToScreen ? {} : { minWidth: 80 }}
              >
                <span
                  className={`text-xs font-black ${
                    dayIdx === todayDow
                      ? "text-rose-500"
                      : dayIdx === 0
                        ? "text-red-400"
                        : dayIdx === 6
                          ? "text-blue-500"
                          : "text-gray-500"
                  }`}
                >
                  {DAYS[dayIdx]}
                </span>
                {dayIdx === todayDow && (
                  <div className="w-1 h-1 rounded-full bg-rose-400 mx-auto " />
                )}
              </div>
            ))}
          </div>

          {/* ── 그리드 본체 ── */}
          <div className="flex" style={{ height: totalHeight }}>
            {/* 시간 레이블 열 (sticky left) */}
            <div className="w-8 shrink-0 sticky left-0 z-40 bg-white border-r border-gray-50">
              <div className="relative h-full">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full flex items-center justify-end pr-2"
                    style={{
                      top: `${getMinuteY(h * 60)}px`,
                      transform:
                        h === startHour
                          ? "translateY(0)"
                          : h === endHour
                            ? "translateY(-100%)"
                            : "translateY(-50%)",
                    }}
                  >
                    <span className="text-[9px] font-bold text-gray-500 tabular-nums">
                      {String(h).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 요일 열들 */}
            {activeDays.map((dayIdx) => {
              const dayLayout = blocksByDay[dayIdx];
              const isToday = dayIdx === todayDow;

              return (
                <div
                  key={dayIdx}
                  className={`relative flex-1 border-r border-gray-50 last:border-r-0 ${
                    isPartnerView ? "cursor-default" : "cursor-pointer"
                  } ${
                    isToday
                      ? "bg-rose-50/20"
                      : hoveredDay === dayIdx
                        ? "bg-gray-50/50"
                        : ""
                  }`}
                  style={fitToScreen ? {} : { minWidth: 80 }}
                  onMouseEnter={() => setHoveredDay(dayIdx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-block]"))
                      return;
                    if (!isPartnerView) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      let accumulatedY = 0;
                      let clickedHour = startHour;
                      for (let i = 0; i < hourHeights.length; i++) {
                        if (
                          y >= accumulatedY &&
                          y < accumulatedY + hourHeights[i]
                        ) {
                          clickedHour = startHour + i;
                          break;
                        }
                        accumulatedY += hourHeights[i];
                      }
                      if (y >= totalHeight) clickedHour = endHour - 1;
                      onAddBlock(dayIdx, clickedHour);
                    }
                  }}
                >
                  {/* 수평 시간선 */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-gray-50"
                      style={{ top: `${getMinuteY(h * 60)}px` }}
                    />
                  ))}

                  {/* 현재 시각 표시선 (오늘 요일에만) */}
                  {isToday &&
                    currentTime >= startHour * 60 &&
                    currentTime <= endHour * 60 && (
                      <div
                        className="absolute w-full border-t-[1.5px] border-rose-500 z-30 pointer-events-none export-hide"
                        style={{
                          top: `${getMinuteY(currentTime)}px`,
                        }}
                      >
                        <div className="absolute -left-1 -top-[3px] w-[5px] h-[5px] rounded-full bg-rose-500" />
                      </div>
                    )}

                  {/* 블록들 */}
                  {dayLayout.map(({ block, col, cols }) => {
                    const style = getBlockStyle(
                      block,
                      startHour,
                      endHour,
                      getMinuteY,
                    );
                    if (!style.visible) return null;

                    const widthPct = 100 / cols;
                    const leftPct = col * widthPct;
                    const durationMin =
                      timeToMinutes(block.end_time) -
                      timeToMinutes(block.start_time);
                    const isShort = durationMin < 45;

                    return (
                      <motion.div
                        key={block.id}
                        data-block="true"
                        whileHover={{ scale: 1.02, zIndex: 20 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockClick(block);
                        }}
                        className="absolute rounded-xl overflow-hidden cursor-pointer shadow-sm"
                        style={{
                          top: style.top,
                          height: style.height,
                          left: `${leftPct + 1}%`,
                          width: `${widthPct - 2}%`,
                          backgroundColor: block.color + "40", // opacity increased from 33 to 40 for better visibility
                          borderLeft: `3px solid ${block.color}`,
                          zIndex: 10,
                        }}
                      >
                        <div className="p-1.5 h-full flex flex-col justify-start overflow-hidden">
                          <p className="text-[10px] font-black leading-tight truncate text-gray-800">
                            {block.title}
                          </p>
                          {!isShort && (
                            <>
                              {showTime && (
                                <p className="text-[9px] font-bold text-gray-700 flex items-center gap-0.5 mt-0.5">
                                  <Clock size={8} />
                                  {block.start_time}–{block.end_time}
                                </p>
                              )}
                              {showPlace && block.place_name && (
                                <p className="text-[9px] font-bold text-gray-600 flex items-center gap-0.5 mt-0.5 overflow-hidden">
                                  <MapPin size={8} className="shrink-0" />
                                  <span className="truncate">
                                    {block.place_name}
                                  </span>
                                </p>
                              )}
                              {showMemo && block.memo && (
                                <p className="text-[9px] font-bold text-gray-600 flex items-center gap-0.5 mt-0.5 overflow-hidden">
                                  <AlignLeft size={8} className="shrink-0" />
                                  <span className="truncate">{block.memo}</span>
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* 빈 요일에 추가 힌트 (내 시간표일 때만) */}
                  {!isPartnerView && (
                    <>
                      {/* 모바일 친화적인 상시 힌트 */}
                      {dayLayout.length === 0 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-200 pointer-events-none export-hide">
                          <Plus size={16} />
                        </div>
                      )}

                      {/* 호버 힌트 */}
                      <AnimatePresence>
                        {hoveredDay === dayIdx &&
                          dayLayout.filter(
                            (d) =>
                              d.block &&
                              getBlockStyle(
                                d.block,
                                startHour,
                                endHour,
                                getMinuteY,
                              ).visible,
                          ).length === 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                            >
                              <div className="w-7 h-7 rounded-full bg-rose-400/80 flex items-center justify-center shadow-lg">
                                <Plus size={14} className="text-white" />
                              </div>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
