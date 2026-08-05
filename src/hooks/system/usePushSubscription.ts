import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
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

export const usePushSubscription = (profile: { id: string } | null | undefined) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    try {
      return typeof Notification !== 'undefined' && 'permission' in Notification ? Notification.permission : 'default';
    } catch {
      return 'default';
    }
  });
  const [isDeviceActive, setIsDeviceActive] = useState(false);
  const lastDeviceCheckRef = useRef<number>(0);
  const isManualOperationRef = useRef(false);

  const checkDeviceActive = useCallback(async () => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (isManualOperationRef.current) return;

    const now = Date.now();
    if (now - lastDeviceCheckRef.current < 600000) return;

    const profileId = profile.id;
    const intentKey = `${PUSH_INTENT_KEY_PREFIX}${profileId}`;
    const retryKey = `${PUSH_RETRY_KEY_PREFIX}${profileId}`;
    const intent = localStorage.getItem(intentKey);
    const retryUntil = parseInt(localStorage.getItem(retryKey) || '0');

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

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
          localStorage.setItem(retryKey, String(now + 3_600_000));
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
          console.log('[Push] Subscription/DB desync detected (focus). Re-registering...');
          const { error: upsertError } = await supabase.from('push_subscriptions').upsert({
            user_id: profileId,
            endpoint: subscription.endpoint,
            subscription: subscription.toJSON(),
            updated_at: new Date().toISOString(),
          });
          if (!upsertError) {
            localStorage.removeItem(retryKey);
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

  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    const profileId = profile.id;
    const intentKey = `${PUSH_INTENT_KEY_PREFIX}${profileId}`;
    const retryKey = `${PUSH_RETRY_KEY_PREFIX}${profileId}`;

    const runMountCheck = async () => {
      if (cancelled || isManualOperationRef.current) return;

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
              localStorage.setItem(retryKey, String(now + 3_600_000));
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
            console.log('[Push] Subscription/DB desync detected (mount). Re-registering...');
            const { error: upsertError } = await supabase.from('push_subscriptions').upsert({
              user_id: profileId,
              endpoint: subscription.endpoint,
              subscription: subscription.toJSON(),
              updated_at: new Date().toISOString(),
            });
            if (cancelled) return;
            if (!upsertError) {
              localStorage.removeItem(retryKey);
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
    return () => { cancelled = true; };
  }, [profile?.id]);

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
        console.log('[Push] No browser subscription on this device. Skipping DB cleanup to preserve other devices.');
        setIsDeviceActive(false);
        return true;
      }
    } catch (err) {
      console.error('[Push] Unsubscription error:', err);
      return false;
    }
  }, [profile?.id]);

  const toggleNotifications = useCallback(async (targetState: boolean) => {
    if (!profile?.id) return false;

    const intentKey = `${PUSH_INTENT_KEY_PREFIX}${profile.id}`;
    const retryKey = `${PUSH_RETRY_KEY_PREFIX}${profile.id}`;

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

        const { error } = await supabase
          .from('notification_settings')
          .update({ is_enabled: true })
          .eq('user_id', profile.id);

        if (!error) {
          queryClient.setQueryData(['notification_settings', profile.id], (prev: any) => ({ ...prev, is_enabled: true }));
        }

        localStorage.setItem(intentKey, 'enabled');
        localStorage.removeItem(retryKey);
        setIsDeviceActive(true);
      } else {
        localStorage.setItem(intentKey, 'disabled');
        localStorage.removeItem(retryKey);

        const success = await unregisterPushSubscription();
        setIsDeviceActive(false);
        if (!success) {
          console.warn('[Push] Unregister partially failed, but intent is saved as disabled.');
        }
      }
      return true;
    } finally {
      isManualOperationRef.current = false;
    }
  }, [profile?.id, registerPushSubscription, unregisterPushSubscription, queryClient, showToast]);

  const requestPermission = useCallback(async () => {
    const p = await Notification.requestPermission();
    setPermissionStatus(p);
    if (p === 'granted' && profile?.id) {
      await registerPushSubscription();
      localStorage.setItem(`${PUSH_INTENT_KEY_PREFIX}${profile.id}`, 'enabled');
      localStorage.removeItem(`${PUSH_RETRY_KEY_PREFIX}${profile.id}`);
    }
    return p === 'granted';
  }, [profile?.id, registerPushSubscription]);

  return {
    permissionStatus,
    isDeviceActive,
    toggleNotifications,
    requestPermission,
  };
};
