-- 1. Security Fix: Set search_path for functions
-- This prevents search_path mutation attacks.

ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_notification_trigger() SET search_path = public;
ALTER FUNCTION public.request_push_notification() SET search_path = public;

-- 2. Performance Fix: Optimize RLS policies by wrapping auth.uid() in (SELECT auth.uid())
-- This allows Postgres to evaluate the function once per query instead of once per row.

-- Notifications table
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Trips table
DROP POLICY IF EXISTS "Users can view their couple's trips" ON public.trips;
CREATE POLICY "Users can view their couple's trips"
    ON public.trips FOR SELECT
    USING (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert their couple's trips" ON public.trips;
CREATE POLICY "Users can insert their couple's trips"
    ON public.trips FOR INSERT
    WITH CHECK (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update their couple's trips" ON public.trips;
CREATE POLICY "Users can update their couple's trips"
    ON public.trips FOR UPDATE
    USING (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can delete their couple's trips" ON public.trips;
CREATE POLICY "Users can delete their couple's trips"
    ON public.trips FOR DELETE
    USING (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid())));

-- Trip Plans table
DROP POLICY IF EXISTS "Users can view their couple's trip plans" ON public.trip_plans;
CREATE POLICY "Users can view their couple's trip plans"
    ON public.trip_plans FOR SELECT
    USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can insert their couple's trip plans" ON public.trip_plans;
CREATE POLICY "Users can insert their couple's trip plans"
    ON public.trip_plans FOR INSERT
    WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can update their couple's trip plans" ON public.trip_plans;
CREATE POLICY "Users can update their couple's trip plans"
    ON public.trip_plans FOR UPDATE
    USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Users can delete their couple's trip plans" ON public.trip_plans;
CREATE POLICY "Users can delete their couple's trip plans"
    ON public.trip_plans FOR DELETE
    USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid()))));
