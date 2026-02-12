-- 1. notification_settings 정책 최적화 및 중복 제거
DROP POLICY IF EXISTS "Users can view own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert/update own notification settings" ON public.notification_settings;

CREATE POLICY "Users can manage own notification settings" ON public.notification_settings
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 2. push_subscriptions 정책 최적화 및 중복 제거
DROP POLICY IF EXISTS "Users can view own push subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own push subscription" ON public.push_subscriptions;

CREATE POLICY "Users can manage own push subscription" ON public.push_subscriptions
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 3. notifications 정책 최적화 (성능 개선)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications (mark as read)" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications (mark as read)" ON public.notifications
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING ((SELECT auth.uid()) = user_id);
