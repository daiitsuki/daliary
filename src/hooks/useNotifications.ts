import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Requirement 9: VAPID Public Key
const VAPID_PUBLIC_KEY = "BHXdwwDFB6xCRvcKwTU0Tx042GdgS1aljUdZC1ECuzH4EEu1fT2ChM72Yrt82hVTGmFxVvDNLJT5-Yw7H2eHcS4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

export const useNotifications = (userId: string | null) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    is_enabled: false,
    notify_question_answered: true,
    notify_question_request: true,
    notify_schedule_change: true,
    notify_place_added: true,
    notify_visit_verified: true,
    notify_level_up: true,
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setSettings({
        is_enabled: data.is_enabled,
        notify_question_answered: data.notify_question_answered,
        notify_question_request: data.notify_question_request,
        notify_schedule_change: data.notify_schedule_change,
        notify_place_added: data.notify_place_added,
        notify_visit_verified: data.notify_visit_verified,
        notify_level_up: data.notify_level_up,
      });
    }
  }, [userId]);

  const updateGranularSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('notification_settings')
      .update({ [key]: value })
      .eq('user_id', userId);

    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }));
      return true;
    }
    return false;
  };

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    // Requirement 5: 서버 트래픽 최소화 (최대 20개, 캐싱은 React State로 처리)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setNotifications(data);
    setLoading(false);
  }, [userId]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return false;
    
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    
    if (permission === 'granted') {
      await registerPushSubscription();
      return true;
    }
    return false;
  };

  const registerPushSubscription = async () => {
    if (!userId || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Requirement 4: 1개의 기기로만 받을 수 있도록 함
      // 신규 구독 생성
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      if (subscription) {
        await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Push subscription error:', err);
    }
  };

  const toggleNotifications = async (targetState: boolean) => {
    if (!userId) return;

    if (targetState) {
      const granted = await requestPermission();
      if (!granted && Notification.permission !== 'granted') {
        return false; // Permission denied or ignored
      }
    }

    const { error } = await supabase
      .from('notification_settings')
      .upsert({ user_id: userId, is_enabled: targetState });

    if (!error) {
      setSettings(prev => ({ ...prev, is_enabled: targetState }));
      return true;
    }
    return false;
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSettings();
      fetchNotifications();

      // Realtime 알림 수신
      const channel = supabase
        .channel(`notifications_${userId}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            const newNotif = payload.new as AppNotification;
            setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
            
            // 브라우저 알림 표시 (포그라운드)
            // 세부 설정 확인 로직 추가
            const settingKey = `notify_${newNotif.type}` as keyof NotificationSettings;
            const isGranularEnabled = settings[settingKey] !== false; // 기본값 true

            if (settings.is_enabled && isGranularEnabled && Notification.permission === 'granted') {
              new Notification(newNotif.title, {
                body: newNotif.content,
                icon: '/logo.png',
                tag: newNotif.type // Requirement 7: 타입별 스택
              });
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [userId, fetchSettings, fetchNotifications, settings]);

  return {
    settings,
    notifications,
    loading,
    permissionStatus,
    toggleNotifications,
    updateGranularSetting,
    requestPermission,
    markAsRead,
    refresh: fetchNotifications
  };
};
