CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attendances INT;
  v_answers INT;
  v_visits INT;
  v_comments INT;
  v_likes INT;
  v_total_points INT;
  v_couple_id UUID;
BEGIN
  -- 유저의 커플 ID 찾기
  SELECT couple_id INTO v_couple_id FROM profiles WHERE id = p_user_id;

  -- 1. 누적 출석일
  SELECT count(*) INTO v_attendances FROM attendances WHERE user_id = p_user_id;
  
  -- 2. 남긴 답변 수
  SELECT count(*) INTO v_answers FROM answers WHERE writer_id = p_user_id;
  
  -- 3. 장소 인증 수
  SELECT count(*) INTO v_visits FROM visits WHERE writer_id = p_user_id;
  
  -- 4. 남긴 댓글 수
  SELECT count(*) INTO v_comments FROM visit_comments WHERE writer_id = p_user_id;
  
  -- 5. 누른 하트 수
  SELECT count(*) INTO v_likes FROM visit_likes WHERE user_id = p_user_id;
  
  -- 6. 우리 커플의 총 획득 포인트 (couple_id 기준)
  SELECT COALESCE(SUM(points), 0) INTO v_total_points FROM point_history WHERE couple_id = v_couple_id AND points > 0;

  RETURN json_build_object(
    'attendances', v_attendances,
    'answers', v_answers,
    'visits', v_visits,
    'comments', v_comments,
    'likes', v_likes,
    'total_points', v_total_points
  );
END;
$$;
