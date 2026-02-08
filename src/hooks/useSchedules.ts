import { useSchedulesContext, Schedule, ScheduleInput } from '../context/SchedulesContext';

// Export types for convenience
export type { Schedule, ScheduleInput };

/**
 * useSchedules 훅은 이제 SchedulesContext를 사용하여
 * 전역적으로 캐싱된 데이터와 조작 메서드를 제공합니다.
 */
export const useSchedules = () => {
  const context = useSchedulesContext();
  
  return {
    schedules: context.schedules,
    loading: context.loading,
    addSchedule: context.addSchedule,
    updateSchedule: context.updateSchedule,
    deleteSchedule: context.deleteSchedule,
    refresh: context.refresh
  };
};
