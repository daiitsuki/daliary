import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { AppNotification } from '../../context/NotificationsContext';

export const useNotificationHistory = (
  profile: { id: string } | null | undefined,
  coupleLoading: boolean
) => {
  const queryClient = useQueryClient();

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

  const markAsRead = useCallback(async (notificationId: string) => {
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
  }, [profile?.id, queryClient]);

  const markAllAsRead = useCallback(async () => {
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
  }, [profile?.id, queryClient]);

  const refresh = useCallback(async () => { await refetch(); }, [refetch]);

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
            window.location.href = url;
            notification.close();
          };
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient]);

  return {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};
