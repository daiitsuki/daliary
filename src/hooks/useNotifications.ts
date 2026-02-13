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
      // 1. 브라우저 권한 확인
      const isPermissionGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
      
      // 2. 현재 기기의 푸시 구독 정보 확인
      let hasActiveSubscription = false;
      if (isPermissionGranted && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        hasActiveSubscription = !!subscription;
      }
      
      // 권한이 없거나 실제 구독 정보가 없는 경우 DB 상태와 무관하게 UI에서는 비활성화로 간주할 수 있지만,
      // DB를 직접 업데이트하는 것은 사이드 이펙트가 크므로 상태만 관리합니다.
      const isActuallyEnabled = data.is_enabled && isPermissionGranted && hasActiveSubscription;

      setSettings({
        is_enabled: isActuallyEnabled,
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
    if (!userId || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Push] Subscription failed: Pre-conditions not met', { userId, hasSW: 'serviceWorker' in navigator });
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker ready');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      if (subscription) {
        console.log('[Push] Subscription created:', subscription.toJSON());
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString()
        });
        
        if (error) {
          console.error('[Push] Failed to save subscription to DB:', error);
          return false;
        }
        console.log('[Push] Subscription saved to DB successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Push] Subscription error:', err);
      return false;
    }
  };

  const toggleNotifications = async (targetState: boolean) => {
    if (!userId) return;

    if (targetState) {
      // 1. 권한 요청
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission !== 'granted') {
        return false;
      }

      // 2. 푸시 구독 등록 (성공해야만 다음 단계로)
      const subscribed = await registerPushSubscription();
      if (!subscribed) {
        alert('푸시 알림 등록에 실패했습니다. 브라우저 설정을 확인해주세요.');
        return false;
      }
    }

    // 3. DB 설정 업데이트
    console.log('[Push] Updating DB settings to:', targetState);
    const { error } = await supabase
      .from('notification_settings')
      .update({ is_enabled: targetState })
      .eq('user_id', userId);

    if (error) {
      console.error('[Push] DB update error:', error);
      return false;
    }

    console.log('[Push] DB update successful');
    setSettings(prev => ({ ...prev, is_enabled: targetState }));
    return true;
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
            // settings 상태를 직접 참조하면 클로저 문제로 인해 이전 값을 참조할 수 있으므로,
            // 실시간 수신 시에는 권한만 확인하거나 별도의 처리가 필요할 수 있습니다.
            if (Notification.permission === 'granted') {
              new Notification(newNotif.title, {
                body: newNotif.content,
                icon: '/logo.png',
                tag: newNotif.type
              });
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [userId, fetchSettings, fetchNotifications]); // settings 제거

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
