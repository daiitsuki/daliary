import { useNotificationsContext } from '../context/NotificationsContext';

/**
 * useNotifications 훅은 이제 NotificationsContext의 상태를 제공하는 래퍼입니다.
 * 모든 데이터 페칭과 실시간 동기화는 전역적으로 한 번만 수행됩니다.
 */
export const useNotifications = () => {
  return useNotificationsContext();
};
