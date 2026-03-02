-- Migration: 2026030202_robust_onboarding.sql
-- Goal: Ensure profiles exist and onboarding is robust by auto-repairing missing profiles

-- 1. Update create_couple_and_link_profile to be more robust
CREATE OR REPLACE FUNCTION public.create_couple_and_link_profile(invite_code_input text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_couple_record record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Ensure profile exists (Auto-repair if trigger was delayed or failed)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id) VALUES (v_user_id);
  END IF;

  -- 2. Check if already has couple
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND couple_id IS NOT NULL) THEN
    RAISE EXCEPTION 'ALREADY_HAS_COUPLE';
  END IF;

  -- 3. Create couple
  INSERT INTO public.couples (invite_code) VALUES (invite_code_input) RETURNING * INTO new_couple_record;

  -- 4. Link profile
  UPDATE public.profiles SET couple_id = new_couple_record.id WHERE id = v_user_id;

  RETURN row_to_json(new_couple_record);
END;
$$;

-- 2. Update join_couple_by_code to be more robust
CREATE OR REPLACE FUNCTION public.join_couple_by_code(invite_code_input text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  target_couple_id uuid;
  member_count int;
  updated_couple record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id) VALUES (v_user_id);
  END IF;

  -- 2. Find couple
  SELECT id INTO target_couple_id FROM public.couples WHERE invite_code = invite_code_input FOR UPDATE;
  IF target_couple_id IS NULL THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;

  -- 3. Check membership
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND couple_id IS NOT NULL) THEN RAISE EXCEPTION 'ALREADY_HAS_COUPLE'; END IF;
  
  SELECT count(*) INTO member_count FROM public.profiles WHERE couple_id = target_couple_id;
  IF member_count >= 2 THEN RAISE EXCEPTION 'COUPLE_FULL'; END IF;

  -- 4. Link and clear code
  UPDATE public.profiles SET couple_id = target_couple_id WHERE id = v_user_id;
  UPDATE public.couples SET invite_code = NULL WHERE id = target_couple_id RETURNING * INTO updated_couple;

  RETURN row_to_json(updated_couple);
END;
$$;
