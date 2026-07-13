-- ==============================================================================
-- 1. Update handle_notification_trigger to include visit_comments and profiles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_partner_id uuid;
    v_my_nickname text;
    v_couple_id uuid;
    v_title text;
    v_content text;
    v_type text;
    v_url text;
    v_metadata jsonb;
    v_settings record;
    v_should_notify boolean;
BEGIN
    -- 1. Sender Info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- 2. Partner (Recipient)
    SELECT id INTO v_partner_id FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid() LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- 3. Settings Check
    SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_partner_id;
    
    -- If no settings row, default to notify enabled (defensive)
    IF v_settings IS NULL THEN 
        v_should_notify := TRUE;
    ELSE 
        v_should_notify := v_settings.is_enabled; 
    END IF;

    IF v_should_notify = FALSE THEN RETURN COALESCE(NEW, OLD); END IF;
    
    -- Reset for specific event check
    v_should_notify := FALSE;
    v_url := '/home'; -- Default fallback URL
    v_metadata := NULL;

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        IF v_settings IS NULL OR v_settings.notify_question_answered THEN
            v_type := 'question_answered'; 
            v_title := '오늘의 질문';
            v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!'; 
            v_url := '/home';
            v_should_notify := TRUE;
        END IF;

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        IF v_settings IS NULL OR v_settings.notify_schedule_change THEN
            v_type := 'schedule_change'; 
            v_title := '일정 변경';
            IF (TG_OP = 'INSERT') THEN 
                v_content := v_my_nickname || '님이 ' || TO_CHAR(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
                v_url := '/calendar?date=' || TO_CHAR(NEW.start_date, 'YYYY-MM-DD');
            ELSIF (TG_OP = 'UPDATE') THEN 
                v_content := v_my_nickname || '님이 ' || TO_CHAR(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
                v_url := '/calendar?date=' || TO_CHAR(NEW.start_date, 'YYYY-MM-DD');
            ELSIF (TG_OP = 'DELETE') THEN 
                v_content := v_my_nickname || '님이 ' || TO_CHAR(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
                v_url := '/calendar?date=' || TO_CHAR(OLD.start_date, 'YYYY-MM-DD');
            END IF;
            v_should_notify := TRUE;
        END IF;

    -- CASE 3: Places
    ELSIF (TG_TABLE_NAME = 'places') THEN
        IF NEW.status = 'wishlist' AND (v_settings IS NULL OR v_settings.notify_place_added) THEN
            v_type := 'place_added'; 
            v_title := '새로운 장소 발견';
            v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!'; 
            v_url := '/places?tab=wishlist';
            v_should_notify := TRUE;
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        IF v_settings IS NULL OR v_settings.notify_visit_verified THEN
            v_type := 'visit_verified'; 
            v_title := '방문 인증 완료';
            v_content := NEW.region || '의 방문 인증이 완료되었어요!'; 
            v_url := '/places?tab=dashboard';
            v_should_notify := TRUE;
        END IF;

    -- CASE 5: Point History (Level up, Items, Game Rewards)
    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        IF NEW.type = 'level_up' AND (v_settings IS NULL OR v_settings.notify_level_up) THEN
            v_type := 'level_up'; 
            v_title := '레벨 업! 🎉'; 
            v_content := '커플 레벨이 올랐어요! 축하합니다!'; 
            v_url := '/home';
            v_should_notify := TRUE;
        ELSIF NEW.type LIKE 'purchase_%' AND (v_settings IS NULL OR v_settings.notify_item_purchased) THEN
            v_type := 'item_purchased'; 
            v_title := '아이템 구매';
            v_content := v_my_nickname || '님이 ' || REPLACE(NEW.description, ' 구매', '') || '을 구매하였습니다.'; 
            v_url := '/home';
            v_should_notify := TRUE;
        ELSIF NEW.type LIKE 'game_reward_%' AND (v_settings IS NULL OR (v_settings.notify_game_reward IS NOT FALSE)) THEN
            v_type := 'game_reward'; 
            v_title := '게임 미션 달성';
            v_content := v_my_nickname || '님이 ' || REPLACE(NEW.description, '게임 보상: ', '') || ' 포인트를 획득했어요!';
            v_url := '/games';
            v_should_notify := TRUE;
        END IF;

    -- CASE 6: Trips (전체 여행)
    ELSIF (TG_TABLE_NAME = 'trips') THEN
        IF v_settings IS NULL OR v_settings.notify_trip_change THEN
            v_type := 'trip_change'; 
            v_url := '/places?tab=plans&tripId=' || NEW.id;
            
            IF (TG_OP = 'INSERT') THEN
                v_title := '새로운 여행 계획';
                v_content := v_my_nickname || '님이 새로운 여행을 추가했어요!';
            ELSIF (TG_OP = 'UPDATE') THEN
                v_title := '여행 계획 업데이트';
                v_content := v_my_nickname || '님이 여행 계획을 수정했어요!';
            ELSIF (TG_OP = 'DELETE') THEN
                v_title := '여행 계획 삭제';
                v_content := v_my_nickname || '님이 여행 계획을 삭제했어요!';
                v_url := '/places?tab=plans'; -- 삭제된 여행은 tripId로 접근할 수 없으므로 전체 목록으로 이동
            END IF;
            
            v_should_notify := TRUE;
        END IF;
        
    -- CASE 7: Visit Comments (New Merge)
    ELSIF (TG_TABLE_NAME = 'visit_comments') THEN
        IF v_settings IS NULL OR v_settings.is_enabled THEN
            v_type := 'comment_added'; 
            v_title := '새로운 댓글';
            v_content := '추억 피드에 새로운 댓글이 달렸어요!'; 
            v_url := '/places?tab=dashboard';
            v_metadata := jsonb_build_object('url', v_url, 'visit_id', NEW.visit_id, 'comment_id', NEW.id);
            v_should_notify := TRUE;
        END IF;

    -- CASE 8: Profiles Avatar Update (New Merge)
    ELSIF (TG_TABLE_NAME = 'profiles') THEN
        IF TG_OP = 'UPDATE' AND OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND NEW.avatar_url IS NOT NULL THEN
            IF v_settings IS NULL OR v_settings.is_enabled THEN
                v_type := 'profile_updated'; 
                v_title := '프로필 변경';
                v_content := '상대방이 프로필 사진을 변경했어요!'; 
                v_url := '/home';
                v_metadata := jsonb_build_object('url', v_url, 'profile_id', NEW.id);
                v_should_notify := TRUE;
            END IF;
        END IF;
    END IF;

    -- Final: Insert notification if applicable
    IF v_should_notify THEN
        IF v_metadata IS NULL THEN
            v_metadata := jsonb_build_object('url', v_url);
        END IF;
        
        INSERT INTO public.notifications (user_id, couple_id, type, title, content, metadata)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content, v_metadata);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ==============================================================================
-- 2. Drop the old separate triggers
-- ==============================================================================
DROP TRIGGER IF EXISTS on_visit_comment_added ON public.visit_comments;
DROP TRIGGER IF EXISTS on_profile_avatar_updated ON public.profiles;

-- ==============================================================================
-- 3. Create the new unified triggers
-- ==============================================================================
DROP TRIGGER IF EXISTS tr_notify_visit_comment ON public.visit_comments;
CREATE TRIGGER tr_notify_visit_comment
AFTER INSERT ON public.visit_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER tr_notify_profile
AFTER UPDATE OF avatar_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_trigger();

-- ==============================================================================
-- 4. Drop the old separated functions since they are no longer used
-- ==============================================================================
DROP FUNCTION IF EXISTS public.notify_comment_added();
DROP FUNCTION IF EXISTS public.notify_profile_updated();
