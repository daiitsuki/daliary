import { supabase } from '../lib/supabase';

export interface SendNotificationParams {
  userId: string;
  type: string;
  title: string;
  content: string;
  coupleId?: string;
  metadata?: Record<string, any>;
}

export const sendNotification = async (params: SendNotificationParams) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    couple_id: params.coupleId,
    type: params.type,
    title: params.title,
    content: params.content,
    metadata: params.metadata || {},
  });
  
  if (error) {
    console.error('[NotificationUtils] Failed to send notification:', error);
  }
  
  return { error };
};
