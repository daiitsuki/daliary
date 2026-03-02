-- Migration: 2026030205_bulletproof_init.sql
-- Goal: Ensure absolute reliability for initial login and profile setup

-- 1. Make handle_new_user extremely defensive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
    v_nickname text;
    v_avatar text;
BEGIN
    -- Extract metadata with fallbacks
    v_nickname := COALESCE(
        new.raw_user_meta_data ->> 'full_name', 
        new.raw_user_meta_data ->> 'nickname', 
        new.raw_user_meta_data ->> 'name',
        '사용자'
    );
    v_avatar := COALESCE(
        new.raw_user_meta_data ->> 'avatar_url', 
        new.raw_user_meta_data ->> 'picture',
        new.raw_user_meta_data ->> 'avatar'
    );

    -- Insert Profile
    INSERT INTO public.profiles (id, nickname, avatar_url)
    VALUES (new.id, v_nickname, v_avatar)
    ON CONFLICT (id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- Insert Notification Settings
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (new.id, false)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Even if metadata extraction fails, create a bare-minimum profile
    INSERT INTO public.profiles (id, nickname)
    VALUES (new.id, '사용자')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

-- 2. Repair missing notification settings for all existing profiles
INSERT INTO public.notification_settings (user_id, is_enabled)
SELECT id, false FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 3. Upgrade get_app_init_data to be a "Self-Healing" function
-- This function will fix any missing data every time the app starts
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_couple_id uuid;
  v_profile record;
  v_couple record;
  v_settings record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Ensure Profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, nickname, avatar_url)
    SELECT 
      id, 
      COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '사용자'),
      COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Ensure Notification Settings exist
  IF NOT EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = v_user_id) THEN
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (v_user_id, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 3. Fetch data
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  v_couple_id := v_profile.couple_id;
  
  IF v_couple_id IS NOT NULL THEN
    SELECT * INTO v_couple FROM public.couples WHERE id = v_couple_id;
  END IF;
  
  SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_user_id;

  RETURN json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'notification_settings', row_to_json(v_settings),
    'is_couple_formed', v_couple_id IS NOT NULL
  );
END;
$$;

-- 4. loosed RLS during first interaction
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- 5. Ensure all game related tables allow inserts for authenticated users
-- (Sometimes reward requests fail because of missing insert policies)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own game scores') THEN
        CREATE POLICY "Users can insert own game scores" ON public.game_scores FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own game scores') THEN
        CREATE POLICY "Users can update own game scores" ON public.game_scores FOR UPDATE USING ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
