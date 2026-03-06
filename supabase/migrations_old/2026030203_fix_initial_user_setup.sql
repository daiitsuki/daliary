-- Migration: 2026030203_fix_initial_user_setup.sql
-- Goal: Fix profile picture sync, ensure profile existence, and loosen RLS for new users

-- 1. Update handle_new_user to include avatar_url from OAuth providers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'nickname', '새 사용자'),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$;

-- 2. Ensure every user has a profile record (Retroactive fix for existing failed users)
INSERT INTO public.profiles (id, nickname, avatar_url)
SELECT 
    id, 
    COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '새 사용자'),
    COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Relax RLS policies for profiles to ensure users can always see themselves and their partner
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Ensure question access is allowed even without a couple (for the loading state)
DROP POLICY IF EXISTS "Questions are viewable by authenticated users." ON public.questions;
CREATE POLICY "Questions are viewable by authenticated users." ON public.questions FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Fix potential issue in get_app_init_data: return empty objects instead of nulls to prevent frontend crashes
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_profile record;
  v_couple record;
  v_settings record;
BEGIN
  -- Auto-repair profile if missing during init
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

-- Helper function for auto-repair
CREATE OR REPLACE FUNCTION public.handle_new_user_from_id(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '새 사용자'),
    COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
  FROM auth.users WHERE id = p_user_id
  ON CONFLICT (id) DO NOTHING;
END;
$$;
