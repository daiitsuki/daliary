-- Secure Level Up Notification Logic
-- Adds a last_notified_level column to the couples table to prevent duplicate notifications.

-- 1. Helper Function to calculate level from cumulative points (re-implementing frontend logic in SQL)
CREATE OR REPLACE FUNCTION public.calculate_level_from_points(p_points BIGINT)
RETURNS INT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_level INT := 1;
  v_accumulated_exp BIGINT := 0;
  v_required_exp BIGINT;
BEGIN
  LOOP
    -- Formula: round(1.95 * pow(level, 1.5) + 50)
    v_required_exp := round(1.95 * pow(v_level, 1.5) + 50)::BIGINT;
    IF p_points < v_accumulated_exp + v_required_exp THEN
      RETURN v_level;
    END IF;
    v_accumulated_exp := v_accumulated_exp + v_required_exp;
    v_level := v_level + 1;
    IF v_level > 1000 THEN RETURN 1000; END IF;
  END LOOP;
END;
$$;

-- 2. Add last_notified_level column to couples table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'last_notified_level') THEN
    ALTER TABLE public.couples ADD COLUMN last_notified_level INT DEFAULT 1;
  END IF;
END $$;

-- 3. Initialize last_notified_level for existing couples based on their current points
UPDATE public.couples c
SET last_notified_level = calculate_level_from_points(
  (SELECT COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0)
   FROM public.point_history
   WHERE couple_id = c.id)
);

-- 4. Update trigger_level_up_notification to be atomic and check last_notified_level
CREATE OR REPLACE FUNCTION public.trigger_level_up_notification(p_level INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id UUID;
  v_last_level INT;
  v_user_record RECORD;
  v_settings RECORD;
BEGIN
  v_couple_id := get_auth_couple_id();
  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  -- Lock the couple row for update to prevent concurrent notification calls
  SELECT last_notified_level INTO v_last_level
  FROM public.couples
  WHERE id = v_couple_id
  FOR UPDATE;

  -- Only proceed if the provided level is higher than what was already notified
  IF p_level <= v_last_level THEN
    RETURN;
  END IF;

  -- Update the last notified level immediately
  UPDATE public.couples
  SET last_notified_level = p_level
  WHERE id = v_couple_id;

  -- Notify all members of the couple
  FOR v_user_record IN (
    SELECT id FROM public.profiles WHERE couple_id = v_couple_id
  ) LOOP
    -- Fetch each user's settings
    SELECT is_enabled, notify_level_up INTO v_settings 
    FROM public.notification_settings 
    WHERE user_id = v_user_record.id;

    -- Send notification if enabled (default to true if settings row missing)
    IF v_settings IS NULL OR (v_settings.is_enabled AND v_settings.notify_level_up) THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, content)
      VALUES (
        v_user_record.id, 
        v_couple_id, 
        'level_up', 
        '레벨 업! 🎉', 
        '커플 레벨 ' || p_level || ' 달성! 축하합니다!'
      );
    END IF;
  END LOOP;
END;
$$;

-- 5. Update get_app_init_data to include last_notified_level
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_couple RECORD;
  v_member_count INT;
  v_notif_settings RECORD;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT id, nickname, avatar_url, couple_id, last_active_at INTO v_profile 
  FROM public.profiles WHERE id = v_user_id;
  IF v_profile.id IS NULL THEN RETURN NULL; END IF;

  IF v_profile.couple_id IS NOT NULL THEN
    SELECT id, created_at, anniversary_date, invite_code, last_notified_level INTO v_couple 
    FROM public.couples WHERE id = v_profile.couple_id;
    SELECT COUNT(*) INTO v_member_count FROM public.profiles WHERE couple_id = v_profile.couple_id;
  ELSE v_couple := NULL; v_member_count := 0; END IF;

  SELECT is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up, notify_trip_change, notify_item_purchased
  INTO v_notif_settings FROM public.notification_settings WHERE user_id = v_user_id;
  
  IF v_notif_settings IS NULL THEN
    INSERT INTO public.notification_settings (user_id) VALUES (v_user_id)
    RETURNING is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up, notify_trip_change, notify_item_purchased
    INTO v_notif_settings;
  END IF;

  RETURN json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'is_couple_formed', (v_member_count >= 2),
    'notification_settings', row_to_json(v_notif_settings)
  );
END;
$$;
