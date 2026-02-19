-- 1. Remove the column from notification_settings
ALTER TABLE public.notification_settings 
DROP COLUMN IF EXISTS notify_visit_comment;

-- 2. Drop the trigger that was specifically for visit comments
DROP TRIGGER IF EXISTS tr_notify_visit_comment ON public.visit_comments;

-- 3. Update handle_notification_trigger to remove Case 7 (Visit Comments)
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
    v_my_nickname TEXT;
    v_couple_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_type TEXT;
    v_settings RECORD;
    v_should_notify BOOLEAN;
BEGIN
    -- Get current user info (sender)
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- Find partner ID (recipient)
    SELECT id INTO v_partner_id 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- Fetch recipient's notification settings
    SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_partner_id;
    
    -- If settings don't exist yet, assume TRUE
    IF v_settings IS NULL THEN
        v_should_notify := TRUE;
    ELSE
        v_should_notify := v_settings.is_enabled; -- Global switch
    END IF;

    -- If global switch is off, return early
    IF v_should_notify = FALSE THEN RETURN COALESCE(NEW, OLD); END IF;

    v_should_notify := FALSE; -- Reset to check specific type

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        IF v_settings.notify_question_answered THEN
            v_type := 'question_answered';
            v_title := '오늘의 질문 답변 완료';
            v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        IF v_settings.notify_schedule_change THEN
            v_type := 'schedule_change';
            v_title := '일정 소식';
            IF (TG_OP = 'INSERT') THEN
                v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
            ELSIF (TG_OP = 'UPDATE') THEN
                v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
            ELSIF (TG_OP = 'DELETE') THEN
                v_content := v_my_nickname || '님이 ' || to_char(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
            END IF;
            v_should_notify := TRUE;
        END IF;

    -- CASE 3: Places
    ELSIF (TG_TABLE_NAME = 'places' AND NEW.status = 'wishlist') THEN
        IF v_settings.notify_place_added THEN
            v_type := 'place_added';
            v_title := '새로운 장소';
            v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        IF v_settings.notify_visit_verified THEN
            v_type := 'visit_verified';
            v_title := '방문 인증 완료';
            v_content := NEW.region || '의 방문 인증이 완료되었어요!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 5: Level Up
    ELSIF (TG_TABLE_NAME = 'point_history' AND NEW.type = 'level_up') THEN
        IF v_settings.notify_level_up THEN
            v_type := 'level_up';
            v_title := '레벨 업! 🎉';
            v_content := '커플 레벨이 올랐어요! 축하합니다!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 6: Trips
    ELSIF (TG_TABLE_NAME = 'trips') THEN
        IF v_settings.notify_trip_change THEN
            v_type := 'trip_change';
            v_title := '여행 계획 소식';
            DECLARE
                v_date_range TEXT;
                v_target_row RECORD;
            BEGIN
                v_target_row := COALESCE(NEW, OLD);
                v_date_range := to_char(v_target_row.start_date, 'MM.DD') || '~' || to_char(v_target_row.end_date, 'MM.DD');
                
                IF (TG_OP = 'INSERT') THEN
                    v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 추가했어요!';
                ELSIF (TG_OP = 'UPDATE') THEN
                    v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 수정했어요!';
                ELSIF (TG_OP = 'DELETE') THEN
                    v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 삭제했어요!';
                END IF;
                v_should_notify := TRUE;
            END;
        END IF;
    END IF;

    -- Insert Notification if Allowed
    IF v_should_notify THEN
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        
        IF v_type = 'level_up' THEN
            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (auth.uid(), v_couple_id, v_type, v_title, v_content);
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_app_init_data to exclude notify_visit_comment
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_couple record;
  v_member_count int;
  v_notif_settings record;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  -- 1. Profile
  SELECT id, nickname, avatar_url, couple_id, last_active_at INTO v_profile 
  FROM public.profiles WHERE id = v_user_id;
  
  IF v_profile.id IS NULL THEN RETURN NULL; END IF;

  -- 2. Couple
  IF v_profile.couple_id IS NOT NULL THEN
    SELECT id, created_at, anniversary_date, invite_code INTO v_couple 
    FROM public.couples WHERE id = v_profile.couple_id;

    SELECT count(*) INTO v_member_count FROM public.profiles WHERE couple_id = v_profile.couple_id;
  ELSE
    v_couple := NULL;
    v_member_count := 0;
  END IF;

  -- 3. Notification Settings (Updated columns - notify_visit_comment removed)
  SELECT 
    is_enabled, 
    notify_question_answered, 
    notify_question_request, 
    notify_schedule_change, 
    notify_place_added, 
    notify_visit_verified, 
    notify_level_up,
    notify_trip_change
  INTO v_notif_settings 
  FROM public.notification_settings WHERE user_id = v_user_id;
  
  IF v_notif_settings IS NULL THEN
    INSERT INTO public.notification_settings (user_id) VALUES (v_user_id)
    RETURNING 
        is_enabled, 
        notify_question_answered, 
        notify_question_request, 
        notify_schedule_change, 
        notify_place_added, 
        notify_visit_verified, 
        notify_level_up,
        notify_trip_change
    INTO v_notif_settings;
  END IF;

  v_result := json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'is_couple_formed', (v_member_count >= 2),
    'notification_settings', row_to_json(v_notif_settings)
  );

  RETURN v_result;
END;
$$;
