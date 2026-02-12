-- Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
    v_partner_nickname TEXT;
    v_my_nickname TEXT;
    v_couple_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_type TEXT;
    v_region TEXT;
BEGIN
    -- Get current user info (writer/actor)
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- Find partner ID
    SELECT id, nickname INTO v_partner_id, v_partner_nickname 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    -- If no partner or notifications disabled, exit early (unless it's a level-up, but level-up is usually for the couple)
    -- Actually, we'll just insert the notification, and the frontend will decide whether to show the push.
    IF v_partner_id IS NULL THEN RETURN NEW; END IF;

    -- CASE 1: Answers (Daily Question)
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

    -- CASE 3: Places (Wishlist)
    ELSIF (TG_TABLE_NAME = 'places' AND NEW.status = 'wishlist') THEN
        v_type := 'place_added';
        v_title := '새로운 장소';
        v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        v_type := 'visit_verified';
        v_title := '방문 인증 완료';
        v_content := NEW.region || '의 방문 인증이 완료되었어요!';

        -- Send to both maybe? No, let's keep it to partner as per requirement 4
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 5: Point History (Level Up)
    -- Point history adds are already automated. We can check if a level up occurred.
    -- This is complex in a trigger, usually handled by checking threshold. 
    -- For simplicity, let's skip level-up trigger here and handle it when points are added if needed,
    -- or just trigger on 'point_history' insert if the description contains '레벨업'.
    ELSIF (TG_TABLE_NAME = 'point_history' AND NEW.type = 'level_up') THEN
        v_type := 'level_up';
        v_title := '레벨 업! 🎉';
        v_content := '커플 레벨이 올랐어요! 축하합니다!';

        -- Send to both
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (auth.uid(), v_couple_id, v_type, v_title, v_content);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers
DROP TRIGGER IF EXISTS tr_notify_answer ON public.answers;
CREATE TRIGGER tr_notify_answer AFTER INSERT ON public.answers FOR EACH ROW EXECUTE PROCEDURE handle_notification_trigger();

DROP TRIGGER IF EXISTS tr_notify_schedule ON public.schedules;
CREATE TRIGGER tr_notify_schedule AFTER INSERT OR UPDATE OR DELETE ON public.schedules FOR EACH ROW EXECUTE PROCEDURE handle_notification_trigger();

DROP TRIGGER IF EXISTS tr_notify_place ON public.places;
CREATE TRIGGER tr_notify_place AFTER INSERT ON public.places FOR EACH ROW EXECUTE PROCEDURE handle_notification_trigger();

DROP TRIGGER IF EXISTS tr_notify_visit ON public.visits;
CREATE TRIGGER tr_notify_visit AFTER INSERT ON public.visits FOR EACH ROW EXECUTE PROCEDURE handle_notification_trigger();
