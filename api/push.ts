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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // [S1] Supabase webhook 호출자 인증
  // Supabase Dashboard → Database → Webhooks → HTTP Headers에
  // Authorization: Bearer <WEBHOOK_SECRET> 을 반드시 설정해야 합니다.
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Push] WEBHOOK_SECRET 환경 변수가 설정되지 않았습니다. 요청을 거부합니다.');
    return res.status(500).json({ error: 'Server misconfiguration: missing WEBHOOK_SECRET' });
  }

  const authHeader = req.headers['authorization'] as string | undefined;
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    console.warn('[Push] 인증 실패: 유효하지 않은 Authorization 헤더');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { record } = req.body;

    if (!record || !record.user_id) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // 1. 해당 유저의 알림 설정 확인
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('is_enabled, notify_communication, notify_schedule_trip, notify_visit_verified, notify_game_activity')
      .eq('user_id', record.user_id)
      .single();

    if (!settings?.is_enabled) {
      return res.status(200).json({ message: 'User disabled notifications' });
    }

    // record.type을 새로운 4개의 통합 카테고리로 매핑
    let mappedSettingKey = '';

    switch (record.type) {
      case 'question_answered':
      case 'question_request':
      case 'comment_added':
      case 'profile_updated':
        mappedSettingKey = 'notify_communication';
        break;
      case 'schedule_change':
      case 'trip_change':
      case 'place_added':
      case 'trip_schedule_change':
        mappedSettingKey = 'notify_schedule_trip';
        break;
      case 'visit_verified':
        mappedSettingKey = 'notify_visit_verified';
        break;
      case 'level_up':
      case 'item_purchased':
      case 'game_reward':
        mappedSettingKey = 'notify_game_activity';
        break;
    }

    if (mappedSettingKey && settings.hasOwnProperty(mappedSettingKey) && !(settings as any)[mappedSettingKey]) {
      return res.status(200).json({ message: `User disabled notifications for ${mappedSettingKey}` });
    }

    // 2. 유저의 모든 Push 구독 정보 조회
    const { data: pushSubs } = await supabase
      .from('push_subscriptions')
      .select('subscription, endpoint')
      .eq('user_id', record.user_id);

    if (!pushSubs || pushSubs.length === 0) {
      return res.status(200).json({ message: 'No push subscriptions found' });
    }

    // 3. 실제 Push 발송
    // metadata에 url이 있으면 해당 URL을 사용하고, 없으면 기본값인 '/'를 사용합니다.
    const deepLink = record.metadata?.url || '/';

    const payload = JSON.stringify({
      title: record.title,
      body: record.content,
      tag: record.type,
      data: {
        url: deepLink,
        id: record.id
      }
    });

    const results = await Promise.allSettled(
      pushSubs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            sub.subscription as any,
            payload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // 4. 만료된 구독 정보 처리 (410 Gone 또는 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', record.user_id)
              .eq('endpoint', sub.endpoint);
          }
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    return res.status(200).json({ 
      success: true, 
      sent_to: successCount, 
      total: pushSubs.length 
    });
  } catch (error: any) {
    console.error('Push Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
