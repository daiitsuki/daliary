-- 1. verify_visit 함수 중복 및 모호성 해결
-- 기존 5개 매개변수 버전 삭제
DROP FUNCTION IF EXISTS public.verify_visit(uuid, date, text, text, text);

-- 6개 매개변수 버전(sub_region 포함) 재정의
CREATE OR REPLACE FUNCTION public.verify_visit(
  p_place_id uuid,
  p_visited_at date,
  p_image_url text,
  p_comment text,
  p_region text,
  p_sub_region text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.places WHERE id = p_place_id;
  
  IF v_couple_id IS NULL OR v_couple_id != (SELECT couple_id FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to verify this visit.';
  END IF;

  INSERT INTO public.visits (place_id, visited_at, image_url, comment, region, sub_region) 
  VALUES (p_place_id, p_visited_at, p_image_url, p_comment, p_region, p_sub_region);
  
  UPDATE public.places SET status = 'visited', updated_at = NOW() WHERE id = p_place_id;
END;
$$;

-- 2. handle_notification_trigger 함수 필드 접근 오류 해결
-- 중첩 IF문을 사용하여 해당 테이블일 때만 특정 필드(status, type 등)에 접근하도록 수정
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
BEGIN
    -- DELETE 시 NEW는 NULL이므로 분기 처리
    IF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'schedules') THEN
            SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
            FROM public.profiles WHERE id = auth.uid();
            SELECT id, nickname INTO v_partner_id, v_partner_nickname 
            FROM public.profiles 
            WHERE couple_id = v_couple_id AND id != auth.uid()
            LIMIT 1;
            IF v_partner_id IS NOT NULL THEN
                v_type := 'schedule_change';
                v_title := '일정 소식';
                v_content := v_my_nickname || '님이 ' || to_char(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
                INSERT INTO public.notifications (user_id, couple_id, type, title, content)
                VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
            END IF;
        END IF;
        RETURN OLD;
    END IF;

    -- INSERT/UPDATE 처리
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    SELECT id, nickname INTO v_partner_id, v_partner_nickname 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN NEW; END IF;

    -- 테이블별 안전한 필드 접근
    IF (TG_TABLE_NAME = 'answers') THEN
        v_type := 'question_answered';
        v_title := '오늘의 질문 답변 완료';
        v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!';
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        v_type := 'schedule_change';
        v_title := '일정 소식';
        IF (TG_OP = 'INSERT') THEN
            v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
        ELSIF (TG_OP = 'UPDATE') THEN
            v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
        END IF;
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    ELSIF (TG_TABLE_NAME = 'places') THEN
        -- NEW.status는 places 테이블일 때만 접근
        IF (NEW.status = 'wishlist') THEN
            v_type := 'place_added';
            v_title := '새로운 장소';
            v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';
            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        END IF;

    ELSIF (TG_TABLE_NAME = 'visits') THEN
        v_type := 'visit_verified';
        v_title := '방문 인증 완료';
        v_content := NEW.region || '의 방문 인증이 완료되었어요!';
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        -- NEW.type은 point_history 테이블일 때만 접근
        IF (NEW.type = 'level_up') THEN
            v_type := 'level_up';
            v_title := '레벨 업! 🎉';
            v_content := '커플 레벨이 올랐어요! 축하합니다!';
            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (auth.uid(), v_couple_id, v_type, v_title, v_content);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. add_couple_points 함수 필드 접근 오류 해결
CREATE OR REPLACE FUNCTION public.add_couple_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  target_couple_id uuid;
  point_type text;
  point_val int;
  desc_text text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  IF tg_table_name = 'answers' THEN
    target_couple_id := new.couple_id; point_type := 'answer'; point_val := 10; desc_text := '오늘의 질문 답변 완료';
  
  ELSIF tg_table_name = 'places' THEN
    -- NEW.status 안전하게 접근
    IF new.status = 'wishlist' THEN 
      target_couple_id := new.couple_id; point_type := 'wishlist'; point_val := 5; desc_text := '가고 싶은 곳 저장: ' || new.name; 
    ELSE 
      RETURN new; 
    END IF;
  
  ELSIF tg_table_name = 'visits' THEN
    SELECT couple_id INTO target_couple_id FROM public.places WHERE id = new.place_id; 
    point_type := 'visit'; point_val := 30; desc_text := '장소 방문 인증 완료';
  
  ELSIF tg_table_name = 'attendances' THEN
    target_couple_id := new.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';

  ELSIF tg_table_name = 'visit_comments' THEN
    SELECT p.couple_id INTO target_couple_id 
    FROM public.visits v
    JOIN public.places p ON v.place_id = p.id
    WHERE v.id = new.visit_id;
    point_type := 'visit_comment'; point_val := 3; desc_text := '방문 인증 댓글 작성';
  END IF;

  IF target_couple_id IS NOT NULL THEN
    INSERT INTO public.point_history (couple_id, type, points, description) 
    VALUES (target_couple_id, point_type, point_val, desc_text);
  END IF;
  
  RETURN NEW;
END;
$$;
