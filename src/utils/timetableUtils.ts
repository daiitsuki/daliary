import { TimetableBlock } from "../hooks";

export const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const getKSTTodayDow = (): number => {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getDay();
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const getBlockStyle = (
  block: TimetableBlock,
  startHour: number,
  endHour: number,
  getMinuteY: (m: number) => number,
): { top: number; height: number; visible: boolean } => {
  const rangeStart = startHour * 60;
  const rangeEnd = endHour * 60;
  const blockStart = timeToMinutes(block.start_time);
  const blockEnd = timeToMinutes(block.end_time);

  if (blockEnd <= rangeStart || blockStart >= rangeEnd) {
    return { top: 0, height: 0, visible: false };
  }

  const clampedStart = Math.max(blockStart, rangeStart);
  const clampedEnd = Math.min(blockEnd, rangeEnd);

  const top = getMinuteY(clampedStart);
  const height = Math.max(getMinuteY(clampedEnd) - top, 20);

  return { top, height, visible: true };
};

export const layoutBlocks = (
  blocks: TimetableBlock[],
): Array<{ block: TimetableBlock; col: number; cols: number }> => {
  if (blocks.length === 0) return [];

  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  );

  const result: Array<{ block: TimetableBlock; col: number; cols: number }> = [];
  const columns: TimetableBlock[][] = [];

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

export const getDayColorClass = (dayIdx: number, todayDow: number): string => {
  if (dayIdx === todayDow) return "text-rose-500";
  if (dayIdx === 0) return "text-red-400";
  if (dayIdx === 6) return "text-blue-500";
  return "text-gray-500";
};
