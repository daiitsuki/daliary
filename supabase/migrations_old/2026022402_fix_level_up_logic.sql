-- Fix Level Up Notification Logic
-- Re-defining trigger_level_up_notification to insert directly into notifications table
-- instead of point_history table, avoiding zero-point entries in the history list.

create or replace function public.trigger_level_up_notification(p_level int)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_user_record record;
  v_settings record;
begin
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Notify all members of the couple
  for v_user_record in (
    select id from public.profiles where couple_id = v_couple_id
  ) loop
    -- Fetch each user's settings
    select is_enabled, notify_level_up into v_settings 
    from public.notification_settings 
    where user_id = v_user_record.id;

    -- Send notification if enabled (default to true if settings row missing)
    if v_settings is null or (v_settings.is_enabled and v_settings.notify_level_up) then
      insert into public.notifications (user_id, couple_id, type, title, content)
      values (
        v_user_record.id, 
        v_couple_id, 
        'level_up', 
        '레벨 업! 🎉', 
        '커플 레벨 ' || p_level || ' 달성! 축하합니다!'
      );
    end if;
  end loop;
end;
$$;

-- Update handle_notification_trigger to remove level_up handling from point_history
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
    -- Get sender info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- Find partner
    SELECT id INTO v_partner_id 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- Fetch recipient's settings
    SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_partner_id;
    
    IF v_settings IS NULL THEN
        v_should_notify := TRUE;
    ELSE
        v_should_notify := v_settings.is_enabled;
    END IF;

    IF v_should_notify = FALSE THEN RETURN COALESCE(NEW, OLD); END IF;

    v_should_notify := FALSE;

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

    -- CASE 3: Places (Defensive check for status)
    ELSIF (TG_TABLE_NAME = 'places') THEN
        IF NEW.status = 'wishlist' THEN
            IF v_settings.notify_place_added THEN
                v_type := 'place_added';
                v_title := '새로운 장소';
                v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';
                v_should_notify := TRUE;
            END IF;
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        IF v_settings.notify_visit_verified THEN
            v_type := 'visit_verified';
            v_title := '방문 인증 완료';
            v_content := NEW.region || '의 방문 인증이 완료되었어요!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 5: Point History (Item Purchase only, Level Up moved to RPC)
    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        IF NEW.type LIKE 'purchase_%' THEN
            IF v_settings.notify_item_purchased THEN
                v_type := 'item_purchased';
                v_title := '아이템 구매 소식';
                v_content := v_my_nickname || '님이 ' || REPLACE(NEW.description, ' 구매', '') || '을 구매하였습니다. 보관함을 확인해보세요.';
                v_should_notify := TRUE;
            END IF;
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

    -- Final Notification Insert
    IF v_should_notify THEN
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
