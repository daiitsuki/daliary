-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the function to send daily schedule notifications
CREATE OR REPLACE FUNCTION public.send_daily_schedule_notifications()
RETURNS void AS $$
DECLARE
    v_today date;
    v_schedule record;
    v_user record;
    v_settings record;
BEGIN
    -- Calculate today's date in KST (Asia/Seoul)
    v_today := (now() AT TIME ZONE 'Asia/Seoul')::date;

    -- Find schedules that happen today
    FOR v_schedule IN
        SELECT 
            s.id AS schedule_id,
            s.couple_id,
            s.title,
            s.start_date
        FROM public.schedules s
        WHERE v_today >= s.start_date AND v_today <= s.end_date
    LOOP
        -- For each user in the couple
        FOR v_user IN
            SELECT id AS user_id
            FROM public.profiles
            WHERE couple_id = v_schedule.couple_id
        LOOP
            -- Get user's notification settings
            SELECT * INTO v_settings 
            FROM public.notification_settings 
            WHERE user_id = v_user.user_id;

            -- If setting is enabled or null (default on)
            IF v_settings IS NULL OR v_settings.notify_schedule_trip = true THEN
                -- Prevent duplicate notification for the same schedule on the same day
                IF NOT EXISTS (
                    SELECT 1 
                    FROM public.notifications 
                    WHERE user_id = v_user.user_id 
                      AND couple_id = v_schedule.couple_id
                      AND type = 'daily_schedule'
                      AND (metadata->>'schedule_id') = v_schedule.schedule_id::text
                      AND (created_at AT TIME ZONE 'Asia/Seoul')::date = v_today
                ) THEN
                    -- Insert notification
                    INSERT INTO public.notifications (
                        user_id,
                        couple_id,
                        type,
                        title,
                        content,
                        metadata
                    ) VALUES (
                        v_user.user_id,
                        v_schedule.couple_id,
                        'daily_schedule',
                        '오늘의 일정',
                        '[' || v_schedule.title || '] 일정이 있는 날이에요!',
                        jsonb_build_object(
                            'schedule_id', v_schedule.schedule_id,
                            'url', '/calendar?date=' || TO_CHAR(v_today, 'YYYY-MM-DD')
                        )
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unschedule if exists to allow safe reruns
DO $$
BEGIN
    PERFORM cron.unschedule('daily_schedule_notifier');
EXCEPTION
    WHEN OTHERS THEN
        -- ignore if not exists
END;
$$;

-- Schedule job to run at KST 00:00 (UTC 15:00) every day
SELECT cron.schedule('daily_schedule_notifier', '0 15 * * *', 'SELECT public.send_daily_schedule_notifications()');

