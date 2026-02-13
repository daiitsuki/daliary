import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// VAPID 설정
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@daliary.app';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Supabase Admin Client (Service Role)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  console.log('[API/Push] Request received:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { record } = req.body;

    if (!record || !record.user_id) {
      console.error('[API/Push] Invalid payload: missing record or user_id');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // 1. 해당 유저의 알림 설정 확인
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', record.user_id)
      .single();

    console.log('[API/Push] User settings:', settings);

    if (!settings?.is_enabled) {
      console.log('[API/Push] User disabled notifications');
      return res.status(200).json({ message: 'User disabled notifications' });
    }

    const settingKey = `notify_${record.type}`;
    if (settings.hasOwnProperty(settingKey) && !settings[settingKey]) {
      console.log(`[API/Push] User disabled notifications for ${record.type}`);
      return res.status(200).json({ message: `User disabled notifications for ${record.type}` });
    }

    // 2. 유저의 Push 구독 정보 조회
    const { data: pushSub } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', record.user_id)
      .single();

    if (!pushSub || !pushSub.subscription) {
      console.error('[API/Push] No push subscription found for user:', record.user_id);
      return res.status(200).json({ message: 'No push subscription found' });
    }

    console.log('[API/Push] Sending push to subscription:', JSON.stringify(pushSub.subscription));

    // 3. 실제 Push 발송
    const payload = JSON.stringify({
      title: record.title,
      body: record.content,
      tag: record.type,
      data: {
        url: '/',
        id: record.id
      }
    });

    await webpush.sendNotification(
      pushSub.subscription as any,
      payload
    );

    console.log('[API/Push] Push sent successfully');
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[API/Push] Error processing push:', error);
    return res.status(500).json({ error: error.message });
  }
}
