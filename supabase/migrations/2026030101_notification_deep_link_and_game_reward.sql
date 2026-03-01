-- Migration: 2026030101_notification_deep_link_and_game_reward.sql
-- 1. Add notify_game_reward to notification_settings
ALTER TABLE public.notification_settings ADD COLUMN IF NOT EXISTS notify_game_reward boolean DEFAULT true;

-- 2. Update get_app_init_data to include new setting
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
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = v_user_id;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  SELECT * INTO v_couple FROM public.couples WHERE id = v_couple_id;
  SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_user_id;

  RETURN json_build_object(
    'profile', v_profile,
    'couple', v_couple,
    'notification_settings', v_settings,
    'is_couple_formed', v_couple_id IS NOT NULL
  );
END;
$$;

-- 3. Update handle_notification_trigger to support URL metadata and game rewards
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_couple_id uuid;
    v_partner_id uuid;
    v_my_nickname text;
    v_type text;
    v_title text;
    v_content text;
    v_url text;
    v_settings record;
    v_should_notify boolean;
BEGIN
    -- 1. Sender Info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- 2. Recipient (Partner)
    SELECT id INTO v_partner_id FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid() LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- 3. Settings Check
    SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_partner_id;
    IF v_settings IS NULL THEN v_should_notify := true;
    ELSE v_should_notify := v_settings.is_enabled; END IF;

    IF v_should_notify = false THEN RETURN COALESCE(NEW, OLD); END IF;
    v_should_notify := false;
    v_url := '/home'; -- Default URL

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        IF v_settings.notify_question_answered THEN
            v_type := 'question_answered'; v_title := '오늘의 질문 답변 완료';
            v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!'; 
            v_url := '/home';
            v_should_notify := true;
        END IF;

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        IF v_settings.notify_schedule_change THEN
            v_type := 'schedule_change'; v_title := '일정 소식';
            IF (TG_OP = 'INSERT') THEN 
                v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
                v_url := '/calendar?date=' || to_char(NEW.start_date, 'YYYY-MM-DD');
            ELSIF (TG_OP = 'UPDATE') THEN 
                v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
                v_url := '/calendar?date=' || to_char(NEW.start_date, 'YYYY-MM-DD');
            ELSIF (TG_OP = 'DELETE') THEN 
                v_content := v_my_nickname || '님이 ' || to_char(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
                v_url := '/calendar?date=' || to_char(OLD.start_date, 'YYYY-MM-DD');
            END IF;
            v_should_notify := true;
        END IF;

    -- CASE 3: Places
    ELSIF (TG_TABLE_NAME = 'places') THEN
        IF NEW.status = 'wishlist' AND v_settings.notify_place_added THEN
            v_type := 'place_added'; v_title := '새로운 장소';
            v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!'; 
            v_url := '/places?tab=wishlist';
            v_should_notify := true;
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        IF v_settings.notify_visit_verified THEN
            v_type := 'visit_verified'; v_title := '방문 인증 완료';
            v_content := NEW.region || '의 방문 인증이 완료되었어요!'; 
            v_url := '/places?tab=dashboard';
            v_should_notify := true;
        END IF;

    -- CASE 5: Point History (Level up, Items, Game Rewards)
    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        IF NEW.type = 'level_up' AND v_settings.notify_level_up THEN
            v_type := 'level_up'; v_title := '레벨 업! 🎉'; 
            v_content := '커플 레벨이 올랐어요! 축하합니다!'; 
            v_url := '/home';
            v_should_notify := true;
        ELSIF NEW.type LIKE 'purchase_%' AND v_settings.notify_item_purchased THEN
            v_type := 'item_purchased'; v_title := '아이템 구매 소식';
            v_content := v_my_nickname || '님이 ' || replace(NEW.description, ' 구매', '') || '을 구매하였습니다.'; 
            v_url := '/home';
            v_should_notify := true;
        ELSIF NEW.type LIKE 'game_reward_%' AND v_settings.notify_game_reward THEN
            v_type := 'game_reward'; v_title := '게임 미션 달성';
            v_content := v_my_nickname || '님이 ' || replace(NEW.description, '게임 보상: ', '') || ' 포인트를 획득했어요!';
            v_url := '/games';
            v_should_notify := true;
        END IF;

    -- CASE 6: Trips
    ELSIF (TG_TABLE_NAME = 'trips') THEN
        IF v_settings.notify_trip_change THEN
            v_type := 'trip_change'; v_title := '여행 계획 업데이트';
            v_content := '여행 계획이 업데이트 되었습니다.'; 
            v_url := '/places?tab=plans';
            v_should_notify := true;
        END IF;
    END IF;

    -- Final Insert
    IF v_should_notify THEN
        INSERT INTO public.notifications (user_id, type, title, content, metadata)
        VALUES (v_partner_id, v_type, v_title, v_content, jsonb_build_object('url', v_url));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;
