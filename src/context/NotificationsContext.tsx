import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useCouple } from "../hooks";
import { usePushSubscription } from '../hooks/system/usePushSubscription';
import { useNotificationSettings } from '../hooks/features/useNotificationSettings';
import { useNotificationHistory } from '../hooks/features/useNotificationHistory';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

export interface NotificationSettings {
  is_enabled: boolean;
  notify_communication: boolean;
  notify_schedule_trip: boolean;
  notify_visit_verified: boolean;
  notify_game_activity: boolean;
}

interface NotificationsContextType {
  settings: NotificationSettings | null;
  notifications: AppNotification[];
  loading: boolean;
  permissionStatus: NotificationPermission;
  isDeviceActive: boolean;
  toggleNotifications: (targetState: boolean) => Promise<boolean>;
  updateGranularSetting: (key: keyof NotificationSettings, value: boolean) => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, notificationSettings: initialSettings, loading: coupleLoading } = useCouple();

  const { settings, updateGranularSetting } = useNotificationSettings(profile, initialSettings, coupleLoading);
  const { notifications, loading, markAsRead, markAllAsRead, refresh } = useNotificationHistory(profile, coupleLoading);
  const { isDeviceActive, permissionStatus, toggleNotifications, requestPermission } = usePushSubscription(profile);

  const contextValue = useMemo(() => ({
    settings,
    notifications,
    loading,
    permissionStatus,
    isDeviceActive,
    toggleNotifications,
    updateGranularSetting,
    requestPermission,
    markAsRead,
    markAllAsRead,
    refresh
  }), [
    settings,
    notifications,
    loading,
    permissionStatus,
    isDeviceActive,
    toggleNotifications,
    updateGranularSetting,
    requestPermission,
    markAsRead,
    markAllAsRead,
    refresh
  ]);

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  return context;
};
