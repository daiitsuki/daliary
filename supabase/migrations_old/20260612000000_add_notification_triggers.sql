-- ==========================================
-- 1. 프로필 사진 변경 알림 트리거
-- ==========================================
CREATE OR REPLACE FUNCTION notify_profile_updated()
RETURNS trigger AS $$
DECLARE
  partner_id uuid;
BEGIN
  -- avatar_url이 변경된 경우에만 실행
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND NEW.avatar_url IS NOT NULL AND NEW.couple_id IS NOT NULL THEN
    -- 파트너 ID 찾기
    SELECT id INTO partner_id FROM public.profiles
    WHERE couple_id = NEW.couple_id AND id != NEW.id LIMIT 1;
    
    IF partner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, message, metadata)
      VALUES (
        partner_id,
        NEW.couple_id,
        'profile_updated',
        '프로필 변경',
        '상대방이 프로필 사진을 변경했어요!',
        jsonb_build_object('profile_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_avatar_updated ON public.profiles;
CREATE TRIGGER on_profile_avatar_updated
  AFTER UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_profile_updated();


-- ==========================================
-- 2. 추억 피드 댓글 알림 트리거
-- ==========================================
CREATE OR REPLACE FUNCTION notify_comment_added()
RETURNS trigger AS $$
DECLARE
  partner_id uuid;
  v_couple_id uuid;
BEGIN
  -- 댓글 작성자의 프로필을 통해 couple_id 획득
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = NEW.writer_id;
  
  IF v_couple_id IS NOT NULL THEN
    -- 파트너 ID 찾기
    SELECT id INTO partner_id FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != NEW.writer_id LIMIT 1;
    
    IF partner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, message, metadata)
      VALUES (
        partner_id,
        v_couple_id,
        'comment_added',
        '새로운 댓글',
        '추억 피드에 새로운 댓글이 달렸어요!',
        jsonb_build_object('visit_id', NEW.visit_id, 'comment_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_visit_comment_added ON public.visit_comments;
CREATE TRIGGER on_visit_comment_added
  AFTER INSERT ON public.visit_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_added();
