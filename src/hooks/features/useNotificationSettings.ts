import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { NotificationSettings } from '../../context/NotificationsContext';

export const useNotificationSettings = (
  profile: { id: string } | null | undefined,
  initialSettings: NotificationSettings | null,
  coupleLoading: boolean
) => {
  const queryClient = useQueryClient();

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

  const updateGranularSetting = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
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
  }, [profile?.id, queryClient]);

  return {
    settings,
    updateGranularSetting,
  };
};
