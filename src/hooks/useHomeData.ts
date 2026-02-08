import { useHomeContext } from '../context/HomeContext';
import { useCouple } from './useCouple';

/**
 * useHomeData 훅은 이제 HomeContext를 사용하여
 * 전역적으로 캐싱된 홈 화면 데이터(질문, 답변, D-Day 등)를 제공합니다.
 */
export const useHomeData = () => {
  const context = useHomeContext();
  const { couple } = useCouple(); // couple 객체 접근을 위해 유지

  return {
    couple,
    currentUserId: context.currentUserId,
    loading: context.loading,
    dDay: context.dDay,
    todayQuestion: context.todayQuestion,
    partnerProfile: context.partnerProfile,
    myProfile: context.myProfile,
    myAnswer: context.myAnswer,
    partnerAnswer: context.partnerAnswer,
    refresh: context.refresh
  };
};
