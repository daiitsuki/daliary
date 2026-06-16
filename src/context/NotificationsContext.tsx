import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';
import { useToast } from './ToastContext';

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

// Requirement 9: VAPID Public Key
const VAPID_PUBLIC_KEY = "BHXdwwDFB6xCRvcKwTU0Tx042GdgS1aljUdZC1ECuzH4EEu1fT2ChM72Yrt82hVTGmFxVvDNLJT5-Yw7H2eHcS4";
// 사용자 의도(알림 ON/OFF)와 재시도 쿨다운을 저장하는 localStorage 키 prefix (user_id 포함으로 멀티유저 안전)
const PUSH_INTENT_KEY_PREFIX = 'daliary_push_intent_';
const PUSH_RETRY_KEY_PREFIX = 'daliary_push_retry_until_';

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
  const { showToast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isDeviceActive, setIsDeviceActive] = useState(false);
  const lastDeviceCheckRef = useRef<number>(0);
  // 수동 토글 조작 중 자동 재구독이 동시에 실행되는 경쟁 조건 방지용 뮤텍스
  const isManualOperationRef = useRef(false);

  // 1. Notification Settings Query
  const { data: settings = initialSettings } = useQuery({
    queryKey: ['notification_settings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('notification_settings')
        .select('is_enabled, notify_communication, notify_schedule_trip, notify_visit_verified, notify_game_activity')
        .eq('user_id', profile.id)
        .single();
      if (error) throw error;
      return data as NotificationSettings;
    },
    initialData: initialSettings,
    enabled: !!profile?.id && !coupleLoading,
    staleTime: 1000 * 60 * 60,
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
    staleTime: 1000 * 60 * 5,
  });

  // [포커스 체크] 창 포커스 시 실행 (10분 쿨다운 적용, 뮤텍스 보호)
  const checkDeviceActive = useCallback(async () => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (isManualOperationRef.current) return; // 수동 토글 중이면 스킵

    const now = Date.now();
    if (now - lastDeviceCheckRef.current < 600000) return; // 10분 쿨다운

    const profileId = profile.id;
    const intentKey = `${PUSH_INTENT_KEY_PREFIX}${profileId}`;
    const retryKey = `${PUSH_RETRY_KEY_PREFIX}${profileId}`;
    // ① intent 먼저 확인 → ② 쿨다운 나중 확인 (순서 중요)
    const intent = localStorage.getItem(intentKey);
    const retryUntil = parseInt(localStorage.getItem(retryKey) || '0');

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // [Auto-Recovery] 사용자 의도가 'enabled'이고, 구독이 유실된 경우에만 자동 재구독
      // is_enabled(서버 값)가 아닌 localStorage intent만 기준 → 기기별 독립 제어 설계 유지
      if (!subscription && intent === 'enabled' && Notification.permission === 'granted' && now >= retryUntil) {
        console.log('[Push] Focus auto-recovery: resubscribing...');
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          if (subscription) {
            await supabase.from('push_subscriptions').upsert({
              user_id: profileId,
              endpoint: subscription.endpoint,
              subscription: subscription.toJSON(),
              updated_at: new Date().toISOString(),
            });
            console.log('[Push] Focus auto-recovery succeeded.');
          }
        } catch (subErr) {
          console.error('[Push] Focus auto-recovery failed:', subErr);
          localStorage.setItem(retryKey, String(now + 3_600_000)); // 실패 시 1시간 재시도 쿨다운
        }
      }

      if (!subscription) {
        setIsDeviceActive(false);
        lastDeviceCheckRef.current = now;
        return;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint')
        .eq('user_id', profileId)
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();

      if (!error) {
        if (!data && intent === 'enabled') {
          // [Case 9] 브라우저에 구독이 있는데 DB에 없는 불일치 → 재등록 시도
          console.log('[Push] Subscription/DB desync detected (focus). Re-registering...');
          const { error: upsertError } = await supabase.from('push_subscriptions').upsert({
            user_id: profileId,
            endpoint: subscription.endpoint,
            subscription: subscription.toJSON(),
            updated_at: new Date().toISOString(),
          });
          if (!upsertError) {
            localStorage.removeItem(retryKey); // 재등록 성공 → 재시도 쿨다운 초기화
            setIsDeviceActive(true);
          } else {
            setIsDeviceActive(false);
          }
        } else {
          setIsDeviceActive(!!data);
        }
        lastDeviceCheckRef.current = now;
      }
    } catch (err) {
      console.error('[Push] Device check error:', err);
    }
  }, [profile?.id]);

  // [마운트 체크] 앱 최초 로드 / 로그인 시 1회 강제 체크 (쿨다운 없음)
  // StrictMode 이중 실행 방지: useRef 대신 cancelled 클로저 변수 사용
  // (ref는 언마운트 시 소멸하지만, 클로저 변수는 cleanup 함수가 true로 설정해 진행 중인 async를 중단)
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    const profileId = profile.id; // async 작업 전에 미리 캡처 (unmount 후 profile 변경 대비)
    const intentKey = `${PUSH_INTENT_KEY_PREFIX}${profileId}`;
    const retryKey = `${PUSH_RETRY_KEY_PREFIX}${profileId}`;

    const runMountCheck = async () => {
      if (cancelled || isManualOperationRef.current) return;

      // ① intent 먼저 → ② cooldown 나중 (순서 중요)
      const intent = localStorage.getItem(intentKey);
      const retryUntil = parseInt(localStorage.getItem(retryKey) || '0');
      const now = Date.now();

      try {
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;
        let subscription = await registration.pushManager.getSubscription();
        if (cancelled) return;

        if (!subscription && intent === 'enabled' && Notification.permission === 'granted' && now >= retryUntil) {
          console.log('[Push] Mount auto-recovery: resubscribing...');
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            // StrictMode cleanup이 실행된 경우 구독 즉시 취소
            if (cancelled) { await subscription?.unsubscribe(); return; }
            if (subscription) {
              await supabase.from('push_subscriptions').upsert({
                user_id: profileId,
                endpoint: subscription.endpoint,
                subscription: subscription.toJSON(),
                updated_at: new Date().toISOString(),
              });
              if (!cancelled) console.log('[Push] Mount auto-recovery succeeded.');
            }
          } catch (subErr) {
            if (!cancelled) {
              console.error('[Push] Mount auto-recovery failed:', subErr);
              localStorage.setItem(retryKey, String(now + 3_600_000)); // 1시간 재시도 쿨다운
            }
          }
        }

        if (cancelled) return;

        if (!subscription) {
          setIsDeviceActive(false);
          lastDeviceCheckRef.current = now;
          return;
        }

        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('endpoint')
          .eq('user_id', profileId)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();

        if (cancelled) return;
        if (!error) {
          if (!data && intent === 'enabled') {
            // [Case 9] 브라우저에 구독이 있는데 DB에 없는 불일치 → 재등록 시도
            console.log('[Push] Subscription/DB desync detected (mount). Re-registering...');
            const { error: upsertError } = await supabase.from('push_subscriptions').upsert({
              user_id: profileId,
              endpoint: subscription.endpoint,
              subscription: subscription.toJSON(),
              updated_at: new Date().toISOString(),
            });
            if (cancelled) return;
            if (!upsertError) {
              localStorage.removeItem(retryKey); // 재등록 성공 → 재시도 쿨다운 초기화
              setIsDeviceActive(true);
            } else {
              setIsDeviceActive(false);
            }
          } else {
            setIsDeviceActive(!!data);
          }
          lastDeviceCheckRef.current = now;
        }
      } catch (err) {
        if (!cancelled) console.error('[Push] Mount check error:', err);
      }
    };

    runMountCheck();
    return () => { cancelled = true; }; // cleanup: 진행 중인 async 중단
  }, [profile?.id]); // profile.id가 바뀔 때만 실행 (로그인/계정 전환)

  // [포커스 이벤트 바인딩] 10분 쿨다운이 있는 포커스 체크
  useEffect(() => {
    window.addEventListener('focus', checkDeviceActive);
    return () => window.removeEventListener('focus', checkDeviceActive);
  }, [checkDeviceActive]);

  const registerPushSubscription = useCallback(async () => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (Notification.permission !== 'granted') return false;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      if (subscription) {
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: profile.id,
          endpoint: subscription.endpoint,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString(),
        });

        if (!error) {
          setIsDeviceActive(true);
          return true;
        }

        // [Case 10] DB 저장 실패 시 브라우저 구독도 롤백 → dangling subscription 방지
        console.error('[Push] DB upsert failed. Rolling back browser subscription...');
        await subscription.unsubscribe();
      }
      return false;
    } catch (err) {
      console.error('[Push] Subscription error:', err);
      return false;
    }
  }, [profile?.id]);

  const unregisterPushSubscription = useCallback(async () => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 브라우저 구독이 있는 경우: endpoint 기반으로 DB에서 정확히 삭제
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', profile.id)
          .eq('endpoint', subscription.endpoint);

        if (!error) {
          setIsDeviceActive(false);
          await subscription.unsubscribe();
          return true;
        }
        return false;
      } else {
        // 브라우저 구독이 이미 없는 경우 (만료/폐기됨):
        // ⚠️ user_id 전체 삭제 금지 → 다른 기기의 구독까지 삭제되는 버그 방지
        // intent='disabled'가 이미 저장되어 있으므로 자동 재구독은 발생하지 않음.
        // 이 기기의 브라우저 구독은 어차피 없으므로 push도 수신되지 않음.
        // 서버에 혹시 남은 만료 레코드는 push 전송 시 410 응답으로 자동 정리됨.
        console.log('[Push] No browser subscription on this device. Skipping DB cleanup to preserve other devices.');
        setIsDeviceActive(false);
        return true;
      }
    } catch (err) {
      console.error('[Push] Unsubscription error:', err);
      return false;
    }
  }, [profile?.id]);



  const toggleNotifications = async (targetState: boolean) => {
    if (!profile?.id) return false;

    const intentKey = `${PUSH_INTENT_KEY_PREFIX}${profile.id}`;
    const retryKey = `${PUSH_RETRY_KEY_PREFIX}${profile.id}`;

    // 수동 조작 시작: 자동 재구독 로직이 동시에 실행되지 않도록 뮤텍스 설정
    isManualOperationRef.current = true;
    try {
      if (targetState) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission !== 'granted') return false;

        const subscribed = await registerPushSubscription();
        if (!subscribed) {
          showToast("푸시 알림 등록에 실패했어요. 브라우저 설정을 확인해주세요.", "error");
          return false;
        }

        // Ensure account-level is enabled when at least one device is turned on
        const { error } = await supabase
          .from('notification_settings')
          .update({ is_enabled: true })
          .eq('user_id', profile.id);

        if (!error) {
          queryClient.setQueryData(['notification_settings', profile.id], (prev: any) => ({ ...prev, is_enabled: true }));
        }

        // 사용자가 직접 켰다는 의도를 저장 + 재시도 쿨다운 초기화
        localStorage.setItem(intentKey, 'enabled');
        localStorage.removeItem(retryKey);
        setIsDeviceActive(true);
      } else {
        // When turning OFF, we only unregister this device.
        // We DO NOT set is_enabled: false globally, so other devices stay active.

        // ⚠️ 핵심: intent를 unregisterPushSubscription 호출 전에 먼저 저장
        // 이유: 브라우저 구독이 이미 만료/폐기된 상태이면 unregister가 실패를 반환하는데,
        //       이 경우 intent가 저장되지 않으면 다음 마운트/포커스 시 자동 재구독이 실행됨
        localStorage.setItem(intentKey, 'disabled');
        localStorage.removeItem(retryKey); // 재시도 쿨다운도 초기화

        const success = await unregisterPushSubscription();
        setIsDeviceActive(false); // 성공 여부와 무관하게 UI는 OFF로 처리
        if (!success) {
          // DB 정리 실패 시 로그만 남김
          // (push 서버에서 410 응답 시 자동 삭제되므로 큰 문제 없음)
          console.warn('[Push] Unregister partially failed, but intent is saved as disabled.');
        }
      }
      return true;
    } finally {
      // 수동 조작 완료: 뮤텍스 해제
      isManualOperationRef.current = false;
    }
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

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);

    if (!error) {
      queryClient.setQueryData(['notifications', profile.id], (prev: any) => 
        prev?.map((n: AppNotification) => ({ ...n, is_read: true }))
      );
    }
  };

  // Realtime Sync & Click Handling
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notifications_${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload) => {
        const newNotif = payload.new as AppNotification;
        queryClient.setQueryData(['notifications', profile.id], (prev: any) => [newNotif, ...(prev || []).slice(0, 19)]);

        if (Notification.permission === 'granted') {
          const notification = new Notification(newNotif.title, { 
            body: newNotif.content, 
            icon: window.location.origin + '/logo.png', 
            tag: newNotif.type 
          });

          notification.onclick = (e) => {
            e.preventDefault();
            window.focus();
            const url = newNotif.metadata?.url || '/home';
            // 만약 현재 SPA 라우팅을 유지하고 싶다면 브라우저의 navigate API나 
            // 상태를 통한 처리가 필요하지만, 알림 클릭은 보통 전체 페이지 이동으로 처리합니다.
            window.location.href = url;
            notification.close();
          };
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
      isDeviceActive,
      toggleNotifications,
      updateGranularSetting,
      requestPermission: async () => {
        const p = await Notification.requestPermission();
        setPermissionStatus(p);
        if (p === 'granted' && profile?.id) {
          await registerPushSubscription();
          // requestPermission으로 직접 활성화한 경우에도 intent 저장
          localStorage.setItem(`${PUSH_INTENT_KEY_PREFIX}${profile.id}`, 'enabled');
          localStorage.removeItem(`${PUSH_RETRY_KEY_PREFIX}${profile.id}`);
        }
        return p === 'granted';
      },
      markAsRead,
      markAllAsRead,
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
