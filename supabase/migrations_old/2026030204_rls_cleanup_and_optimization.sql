-- Migration: 2026030204_rls_cleanup_and_optimization.sql
-- Goal: Fix performance warnings (Lint 0003) and remove redundant policies (Lint 0006)

-- 1. PROFILES Table Cleanup & Optimization
-- Remove all redundant or slightly different named policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own and partner profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create optimized, non-redundant policies
-- Use (SELECT auth.uid()) for better performance (Plan initialization)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ((SELECT auth.uid()) = id);


-- 2. QUESTIONS Table Cleanup & Optimization
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;
DROP POLICY IF EXISTS "Questions are viewable by authenticated users." ON public.questions;

CREATE POLICY "Questions are viewable by everyone" 
ON public.questions FOR SELECT 
USING (auth.role() = 'authenticated');


-- 3. GAME_SCORES Table Optimization
DROP POLICY IF EXISTS "Users can view own and partner's game scores" ON public.game_scores;
DROP POLICY IF EXISTS "Users can view their own game scores" ON public.game_scores;

CREATE POLICY "Users can view relevant game scores" 
ON public.game_scores FOR SELECT 
USING (
  (SELECT auth.uid()) = user_id OR 
  couple_id = (SELECT couple_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

CREATE POLICY "Users can insert own game scores"
ON public.game_scores FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own game scores"
ON public.game_scores FOR UPDATE
USING ((SELECT auth.uid()) = user_id);


-- 4. GAME_SESSIONS Table Optimization (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'game_sessions') THEN
        DROP POLICY IF EXISTS "Users can view their own sessions" ON public.game_sessions;
        CREATE POLICY "Users can view own sessions" 
        ON public.game_sessions FOR SELECT 
        USING ((SELECT auth.uid()) = user_id);
    END IF;
END $$;


-- 5. Final check on get_app_init_data (Ensure it's using the best patterns)
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid()); -- Optimized
  v_couple_id uuid;
  v_profile record;
  v_couple record;
  v_settings record;
BEGIN
  -- Auto-repair profile if missing
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    PERFORM public.handle_new_user_from_id(v_user_id);
  END IF;

  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = v_user_id;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  SELECT * INTO v_couple FROM public.couples WHERE id = v_couple_id;
  SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_user_id;

  RETURN json_build_object(
    'profile', COALESCE(row_to_json(v_profile), json_build_object('id', v_user_id)),
    'couple', row_to_json(v_couple),
    'notification_settings', row_to_json(v_settings),
    'is_couple_formed', v_couple_id IS NOT NULL
  );
END;
$$;
