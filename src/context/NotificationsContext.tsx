import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';

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
  notify_question_answered: boolean;
  notify_question_request: boolean;
  notify_schedule_change: boolean;
  notify_place_added: boolean;
  notify_visit_verified: boolean;
  notify_level_up: boolean;
}

interface NotificationsContextType {
  settings: NotificationSettings | null;
  notifications: AppNotification[];
  loading: boolean;
  permissionStatus: NotificationPermission;
  toggleNotifications: (targetState: boolean) => Promise<boolean>;
  updateGranularSetting: (key: keyof NotificationSettings, value: boolean) => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Requirement 9: VAPID Public Key
const VAPID_PUBLIC_KEY = "BHXdwwDFB6xCRvcKwTU0Tx042GdgS1aljUdZC1ECuzH4EEu1fT2ChM72Yrt82hVTGmFxVvDNLJT5-Yw7H2eHcS4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, notificationSettings: initialSettings, loading: coupleLoading } = useCouple();
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // 1. Notification Settings Query
  const { data: settings = initialSettings } = useQuery({
    queryKey: ['notification_settings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('notification_settings')
        .select('is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up')
        .eq('user_id', profile.id)
        .single();
      if (error) throw error;
      return data as NotificationSettings;
    },
    initialData: initialSettings,
    enabled: !!profile?.id && !coupleLoading && !initialSettings,
  });

  // 2. Notifications History Query
  const { data: notifications = [], isLoading: notificationsLoading, refetch } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, content, is_read, created_at, metadata')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AppNotification[];
    },
    enabled: !!profile?.id && !coupleLoading,
  });

  const registerPushSubscription = useCallback(async () => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      if (subscription) {
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: profile.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString(),
        });
        return !error;
      }
      return false;
    } catch (err) {
      console.error('[Push] Subscription error:', err);
      return false;
    }
  }, [profile?.id]);

  const toggleNotifications = async (targetState: boolean) => {
    if (!profile?.id) return false;

    if (targetState) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission !== 'granted') return false;

      const subscribed = await registerPushSubscription();
      if (!subscribed) {
        alert('푸시 알림 등록에 실패했습니다. 브라우저 설정을 확인해주세요.');
        return false;
      }
    }

    const { error } = await supabase
      .from('notification_settings')
      .update({ is_enabled: targetState })
      .eq('user_id', profile.id);

    if (!error) {
      queryClient.setQueryData(['notification_settings', profile.id], (prev: any) => ({ ...prev, is_enabled: targetState }));
      return true;
    }
    return false;
  };

  const updateGranularSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!profile?.id) return false;
    const { error } = await supabase
      .from('notification_settings')
      .update({ [key]: value })
      .eq('user_id', profile.id);

    if (!error) {
      queryClient.setQueryData(['notification_settings', profile.id], (prev: any) => ({ ...prev, [key]: value }));
      return true;
    }
    return false;
  };

  const markAsRead = async (notificationId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      queryClient.setQueryData(['notifications', profile.id], (prev: any) => 
        prev?.map((n: AppNotification) => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  // Realtime Sync
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notifications_${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload) => {
        const newNotif = payload.new as AppNotification;
        queryClient.setQueryData(['notifications', profile.id], (prev: any) => [newNotif, ...(prev || []).slice(0, 19)]);

        if (Notification.permission === 'granted') {
          new Notification(newNotif.title, { 
            body: newNotif.content, 
            icon: window.location.origin + '/logo.png', 
            tag: newNotif.type 
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient]);

  return (
    <NotificationsContext.Provider value={{
      settings,
      notifications,
      loading: notificationsLoading,
      permissionStatus,
      toggleNotifications,
      updateGranularSetting,
      requestPermission: async () => {
        const p = await Notification.requestPermission();
        setPermissionStatus(p);
        if (p === 'granted') await registerPushSubscription();
        return p === 'granted';
      },
      markAsRead,
      refresh: async () => { await refetch(); }
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  return context;
};
