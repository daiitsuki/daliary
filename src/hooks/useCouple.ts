import { useCoupleContext } from '../context/CoupleContext';

/**
 * useCouple 훅은 CoupleContext의 상태를 편리하게 접근하기 위한 래퍼입니다.
 * 이제 모든 상태와 로직은 CoupleContext에서 전역적으로 관리됩니다.
 */
export const useCouple = () => {
  return useCoupleContext();
};
