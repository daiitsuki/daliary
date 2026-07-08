import { useTimetableContext, TimetableBlock, TimetableBlockInput } from "../../context/TimetableContext";

export type { TimetableBlock, TimetableBlockInput };

/**
 * useTimetable 훅은 TimetableContext를 통해
 * 전역으로 캐싱된 시간표 데이터와 조작 메서드를 제공합니다.
 */
export const useTimetable = () => {
  const context = useTimetableContext();

  return {
    myBlocks: context.myBlocks,
    partnerBlocks: context.partnerBlocks,
    loading: context.loading,
    addBlock: context.addBlock,
    updateBlock: context.updateBlock,
    deleteBlock: context.deleteBlock,
    deleteAllBlocks: context.deleteAllBlocks,
    refresh: context.refresh,
  };
};
