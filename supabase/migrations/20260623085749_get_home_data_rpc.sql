CREATE OR REPLACE FUNCTION public.get_home_data(timezone_offset_hours integer DEFAULT 9)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_couple_id uuid;
  v_profiles json := '[]'::json;
  v_question record;
  v_answers json := '[]'::json;
  v_drawing_answers json := '[]'::json;
  v_today date;
  v_has_my_drawing boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get couple_id for the user
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = v_user_id;
  
  IF v_couple_id IS NULL THEN
    RETURN json_build_object(
       'profiles', '[]'::json,
       'question', null,
       'answers', '[]'::json,
       'drawing_answers', '[]'::json
    );
  END IF;

  -- 1. Profiles
  SELECT json_agg(row_to_json(p)) INTO v_profiles 
  FROM (
    SELECT id, nickname, avatar_url, last_active_at 
    FROM public.profiles 
    WHERE couple_id = v_couple_id
  ) p;
  
  -- 2. Today's date (KST default)
  v_today := (now() AT TIME ZONE 'UTC' + (timezone_offset_hours || ' hours')::interval)::date;
  
  -- 3. Today's Question
  SELECT id, content INTO v_question 
  FROM public.questions 
  WHERE publish_date = v_today 
  LIMIT 1;
  
  IF v_question.id IS NOT NULL THEN
    -- 4. Answers
    SELECT json_agg(row_to_json(a)) INTO v_answers
    FROM (
      SELECT id, content, writer_id, created_at 
      FROM public.answers 
      WHERE couple_id = v_couple_id AND question_id = v_question.id
    ) a;
  END IF;
  
  -- 5. Drawing Answers
  -- 내가 그림을 그렸는지 확인
  SELECT EXISTS (
    SELECT 1 FROM public.drawing_answers 
    WHERE couple_id = v_couple_id AND question_date = v_today AND writer_id = v_user_id
  ) INTO v_has_my_drawing;

  SELECT json_agg(row_to_json(d)) INTO v_drawing_answers
  FROM (
    SELECT 
      id, couple_id, writer_id, question_date, question_text, 
      CASE 
        WHEN writer_id = v_user_id THEN image_url -- 내 그림은 항상 원본 URL
        WHEN v_has_my_drawing THEN image_url -- 내가 그렸으면 상대방 그림도 원본 URL
        ELSE 'hidden' -- 내가 안 그렸으면 상대방 그림은 'hidden' 처리
      END as image_url,
      created_at
    FROM public.drawing_answers 
    WHERE couple_id = v_couple_id AND question_date = v_today
  ) d;

  RETURN json_build_object(
     'profiles', COALESCE(v_profiles, '[]'::json),
     'question', CASE WHEN v_question.id IS NOT NULL THEN row_to_json(v_question) ELSE null END,
     'answers', COALESCE(v_answers, '[]'::json),
     'drawing_answers', COALESCE(v_drawing_answers, '[]'::json)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_home_data(integer) TO authenticated, service_role;
