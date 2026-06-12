-- 1. Create missing indexes for foreign keys
-- This prevents full table scans when parent records are updated or deleted (e.g. CASCADE).
CREATE INDEX IF NOT EXISTS idx_answers_couple_id ON public.answers USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers USING btree (question_id);
CREATE INDEX IF NOT EXISTS idx_answers_writer_id ON public.answers USING btree (writer_id);
CREATE INDEX IF NOT EXISTS idx_attendances_couple_id ON public.attendances USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_couple_id ON public.game_sessions USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON public.point_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_schedules_couple_id ON public.schedules USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_schedules_writer_id ON public.schedules USING btree (writer_id);
CREATE INDEX IF NOT EXISTS idx_tools_couple_id ON public.tools USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_trip_id ON public.trip_plans USING btree (trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_couple_id ON public.trips USING btree (couple_id);
CREATE INDEX IF NOT EXISTS idx_visit_comments_visit_id ON public.visit_comments USING btree (visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_comments_writer_id ON public.visit_comments USING btree (writer_id);
CREATE INDEX IF NOT EXISTS idx_visit_likes_user_id ON public.visit_likes USING btree (user_id);

-- 2. Drop unused index
-- Unused indexes consume storage and slow down write operations (INSERT/UPDATE/DELETE).
DROP INDEX IF EXISTS public.idx_visits_writer_id;
