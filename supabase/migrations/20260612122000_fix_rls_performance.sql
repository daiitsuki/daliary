-- Fix performance issues in RLS policies by wrapping auth.<function>() in (select ...)
-- This prevents the function from being evaluated on every row.

-- 1. public.questions
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON "public"."questions";
CREATE POLICY "Questions are viewable by everyone"
ON "public"."questions" AS permissive FOR SELECT TO public
USING ((( SELECT auth.role()) = 'authenticated'::text));

-- 2. public.profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON "public"."profiles";
CREATE POLICY "Profiles are viewable by authenticated users"
ON "public"."profiles" AS permissive FOR SELECT TO public
USING ((( SELECT auth.role()) = 'authenticated'::text));

-- 3. public.timetable_blocks (select, delete, insert, update)
DROP POLICY IF EXISTS "couple members can select timetable_blocks" ON "public"."timetable_blocks";
CREATE POLICY "couple members can select timetable_blocks"
ON "public"."timetable_blocks" AS permissive FOR SELECT TO public
USING ((couple_id IN ( SELECT profiles.couple_id FROM public.profiles WHERE (profiles.id = ( SELECT auth.uid())))));

DROP POLICY IF EXISTS "writer can delete timetable_blocks" ON "public"."timetable_blocks";
CREATE POLICY "writer can delete timetable_blocks"
ON "public"."timetable_blocks" AS permissive FOR DELETE TO public
USING ((writer_id = ( SELECT auth.uid())));

DROP POLICY IF EXISTS "writer can insert timetable_blocks" ON "public"."timetable_blocks";
CREATE POLICY "writer can insert timetable_blocks"
ON "public"."timetable_blocks" AS permissive FOR INSERT TO public
WITH CHECK (((writer_id = ( SELECT auth.uid())) AND (couple_id IN ( SELECT profiles.couple_id FROM public.profiles WHERE (profiles.id = ( SELECT auth.uid()))))));

DROP POLICY IF EXISTS "writer can update timetable_blocks" ON "public"."timetable_blocks";
CREATE POLICY "writer can update timetable_blocks"
ON "public"."timetable_blocks" AS permissive FOR UPDATE TO public
USING ((writer_id = ( SELECT auth.uid())));

-- 4. public.visits
DROP POLICY IF EXISTS "Writers can delete their own visits" ON "public"."visits";
CREATE POLICY "Writers can delete their own visits"
ON "public"."visits" AS permissive FOR DELETE TO public
USING (((writer_id = ( SELECT auth.uid())) OR ((writer_id IS NULL) AND (place_id IN ( SELECT places.id FROM public.places WHERE (places.couple_id = public.get_auth_couple_id()))))));

-- 5. public.visit_likes (Fix both auth_rls_initplan and multiple_permissive_policies)
-- Drop the "for all" policy and split it into insert, update, delete.
-- The existing "Couples can view likes for their visits" policy covers the SELECT action adequately.
DROP POLICY IF EXISTS "Users can manage their own likes" ON "public"."visit_likes";

CREATE POLICY "Users can insert their own likes"
ON "public"."visit_likes" AS permissive FOR INSERT TO public
WITH CHECK ((( SELECT auth.uid()) = user_id));

CREATE POLICY "Users can update their own likes"
ON "public"."visit_likes" AS permissive FOR UPDATE TO public
USING ((( SELECT auth.uid()) = user_id));

CREATE POLICY "Users can delete their own likes"
ON "public"."visit_likes" AS permissive FOR DELETE TO public
USING ((( SELECT auth.uid()) = user_id));
