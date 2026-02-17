-- Fix notification trigger error: record "new" has no field "type" and "status"
-- Ensure all field accesses are scoped within their respective table checks.

CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
    v_my_nickname TEXT;
    v_couple_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_type TEXT;
BEGIN
    -- Get current user info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- Find partner ID
    SELECT id INTO v_partner_id 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        v_type := 'question_answered';
        v_title := '오늘의 질문 답변 완료';
        v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!';
        
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        v_type := 'schedule_change';
        v_title := '일정 소식';
        IF (TG_OP = 'INSERT') THEN
            v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
        ELSIF (TG_OP = 'UPDATE') THEN
            v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
        ELSIF (TG_OP = 'DELETE') THEN
            v_content := v_my_nickname || '님이 ' || to_char(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
        END IF;

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 3: Places
    ELSIF (TG_TABLE_NAME = 'places') THEN
        -- Only notify if it's a wishlist item
        IF (NEW.status = 'wishlist') THEN
            v_type := 'place_added';
            v_title := '새로운 장소';
            v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';

            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        v_type := 'visit_verified';
        v_title := '방문 인증 완료';
        v_content := NEW.region || '의 방문 인증이 완료되었어요!';

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 5: Point History (Level Up)
    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        IF (NEW.type = 'level_up') THEN
            v_type := 'level_up';
            v_title := '레벨 업! 🎉';
            v_content := '커플 레벨이 올랐어요! 축하합니다!';

            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (auth.uid(), v_couple_id, v_type, v_title, v_content);
        END IF;

    -- CASE 6: Trips
    ELSIF (TG_TABLE_NAME = 'trips') THEN
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

            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        END;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
