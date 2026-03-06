


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_couple_points"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  target_couple_id UUID;
  point_type TEXT;
  point_val INT;
  desc_text TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME = 'answers' THEN
    target_couple_id := NEW.couple_id; point_type := 'answer'; point_val := 30; desc_text := '오늘의 질문 답변 완료';
  
  ELSIF TG_TABLE_NAME = 'places' THEN
    IF NEW.status = 'wishlist' THEN 
      target_couple_id := NEW.couple_id; point_type := 'wishlist'; point_val := 5; desc_text := '가고 싶은 곳 저장: ' || NEW.name; 
    ELSE 
      RETURN NEW; 
    END IF;
  
  ELSIF TG_TABLE_NAME = 'visits' THEN
    SELECT couple_id INTO target_couple_id FROM public.places WHERE id = NEW.place_id; 
    point_type := 'visit'; point_val := 30; desc_text := '장소 방문 인증 완료';
  
  ELSIF TG_TABLE_NAME = 'attendances' THEN
    target_couple_id := NEW.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';

  ELSIF TG_TABLE_NAME = 'visit_comments' THEN
    SELECT p.couple_id INTO target_couple_id 
    FROM public.visits v
    JOIN public.places p ON v.place_id = p.id
    WHERE v.id = NEW.visit_id;
    point_type := 'visit_comment'; point_val := 3; desc_text := '방문 인증 댓글 작성';
  END IF;

  IF target_couple_id IS NOT NULL THEN
    INSERT INTO public.point_history (couple_id, type, points, description) 
    VALUES (target_couple_id, point_type, point_val, desc_text);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_couple_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_debug_points"("p_points" integer, "p_description" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_couple_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();

  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NO_COUPLE_FOUND');
  end if;

  insert into public.point_history (couple_id, user_id, type, points, description)
  values (v_couple_id, v_user_id, 'debug', p_points, p_description);

  return json_build_object('success', true);
end;
$$;


ALTER FUNCTION "public"."add_debug_points"("p_points" integer, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_level_from_points"("p_points" bigint) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  v_level INT := 1;
  v_accumulated_exp BIGINT := 0;
  v_required_exp BIGINT;
BEGIN
  LOOP
    -- Formula: round(1.95 * pow(level, 1.5) + 50)
    v_required_exp := round(1.95 * pow(v_level, 1.5) + 50)::BIGINT;
    IF p_points < v_accumulated_exp + v_required_exp THEN
      RETURN v_level;
    END IF;
    v_accumulated_exp := v_accumulated_exp + v_required_exp;
    v_level := v_level + 1;
    IF v_level > 1000 THEN RETURN 1000; END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."calculate_level_from_points"("p_points" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_blind_timer_reward"("p_session_id" "uuid", "p_diff_seconds" double precision) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_session record;
  v_reward_points int;
  v_rank text;
  v_server_elapsed_seconds float;
  v_abs_diff float;
  v_client_reported_elapsed float;
begin
  select * into v_session from public.game_sessions where id = p_session_id;
  
  if v_session.id is null then return json_build_object('success', false, 'error', 'INVALID_SESSION'); end if;
  if v_session.user_id != auth.uid() then return json_build_object('success', false, 'error', 'UNAUTHORIZED'); end if;
  if v_session.status != 'active' then return json_build_object('success', false, 'error', 'SESSION_CLOSED'); end if;
  if v_session.started_at is null or v_session.stopped_at is null then 
    return json_build_object('success', false, 'error', 'ROUND_NOT_COMPLETED'); 
  end if;

  -- Verify with Server Timing
  v_server_elapsed_seconds := extract(epoch from (v_session.stopped_at - v_session.started_at));
  v_client_reported_elapsed := p_diff_seconds + v_session.target_time;

  if abs(v_server_elapsed_seconds - v_client_reported_elapsed) > 1.0 then
    -- Verification failed: still delete but return error
    delete from public.game_sessions where id = p_session_id;
    return json_build_object('success', false, 'error', 'VERIFICATION_FAILED');
  end if;

  v_abs_diff := abs(p_diff_seconds);
  
  -- Calculate Rank & Reward
  if v_abs_diff < 0.005 then v_reward_points := 500; v_rank := 'Perfect';
  elsif v_abs_diff <= 0.05 then v_reward_points := 300; v_rank := 'Great';
  elsif v_abs_diff <= 0.20 then v_reward_points := 150; v_rank := 'Good';
  elsif v_abs_diff <= 0.50 then v_reward_points := 100; v_rank := 'Normal';
  elsif v_abs_diff <= 1.00 then v_reward_points := 50; v_rank := 'Bad';
  else v_reward_points := 0; v_rank := 'Fail';
  end if;

  -- [CHANGE] Delete Session immediately instead of updating status
  delete from public.game_sessions where id = p_session_id;

  if v_reward_points > 0 then
    insert into public.point_history (couple_id, user_id, type, points, description)
    values (v_session.couple_id, v_session.user_id, 'game_reward_blind_timer', v_reward_points, '블라인드 타이머: ' || v_rank);
  end if;

  return json_build_object('success', true, 'rank', v_rank, 'reward', v_reward_points);
end;
$$;


ALTER FUNCTION "public"."claim_blind_timer_reward"("p_session_id" "uuid", "p_diff_seconds" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_game_sessions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Delete sessions older than 1 day or completed sessions
  delete from public.game_sessions 
  where (expires_at < now()) 
     or (status = 'completed' and updated_at < (now() - interval '7 days'));
end;
$$;


ALTER FUNCTION "public"."cleanup_game_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_couple_and_link_profile"("invite_code_input" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_couple_record record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Ensure profile exists (Auto-repair if trigger was delayed or failed)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id) VALUES (v_user_id);
  END IF;

  -- 2. Check if already has couple
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND couple_id IS NOT NULL) THEN
    RAISE EXCEPTION 'ALREADY_HAS_COUPLE';
  END IF;

  -- 3. Create couple
  INSERT INTO public.couples (invite_code) VALUES (invite_code_input) RETURNING * INTO new_couple_record;

  -- 4. Link profile
  UPDATE public.profiles SET couple_id = new_couple_record.id WHERE id = v_user_id;

  RETURN row_to_json(new_couple_record);
END;
$$;


ALTER FUNCTION "public"."create_couple_and_link_profile"("invite_code_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_couple_and_all_data"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  target_couple_id uuid;
begin
  select couple_id into target_couple_id from public.profiles where id = auth.uid();
  if target_couple_id is not null then
    delete from public.couples where id = target_couple_id;
  else
    raise exception '연결된 커플 정보를 찾을 수 없습니다.';
  end if;
end;
$$;


ALTER FUNCTION "public"."delete_couple_and_all_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_app_init_data"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_couple_id uuid;
  v_profile record;
  v_couple record;
  v_settings record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Ensure Profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, nickname, avatar_url)
    SELECT 
      id, 
      COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '사용자'),
      COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Ensure Notification Settings exist
  IF NOT EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = v_user_id) THEN
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (v_user_id, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 3. Fetch data
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  v_couple_id := v_profile.couple_id;
  
  IF v_couple_id IS NOT NULL THEN
    SELECT * INTO v_couple FROM public.couples WHERE id = v_couple_id;
  END IF;
  
  SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_user_id;

  RETURN json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'notification_settings', row_to_json(v_settings),
    'is_couple_formed', v_couple_id IS NOT NULL
  );
END;
$$;


ALTER FUNCTION "public"."get_app_init_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_couple_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select couple_id from public.profiles where id = (select auth.uid());
$$;


ALTER FUNCTION "public"."get_auth_couple_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_couple_id_by_code"("code" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare target_id uuid;
begin
  select id into target_id from public.couples where invite_code = code limit 1;
  return target_id;
end;
$$;


ALTER FUNCTION "public"."get_couple_id_by_code"("code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_couple_points_summary"("target_couple_id" "uuid") RETURNS TABLE("cumulative_points" bigint, "current_points" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND couple_id = target_couple_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0)::bigint,
    COALESCE(SUM(points), 0)::bigint
  FROM public.point_history
  WHERE couple_id = target_couple_id;
END;
$$;


ALTER FUNCTION "public"."get_couple_points_summary"("target_couple_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_couple_total_points"("target_couple_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  total bigint;
  auth_couple_id uuid;
begin
  -- Use the helper function for consistency
  auth_couple_id := get_auth_couple_id();

  -- Access Check:
  -- 1. User must have a couple_id (must be in a couple)
  -- 2. User's couple_id must match the requested target_couple_id
  if auth_couple_id is null or auth_couple_id != target_couple_id then
    raise exception 'Access denied: You can only view points for your own couple.';
  end if;

  -- Calculate Total Points
  -- Since this is SECURITY DEFINER, it sees all rows in point_history
  select coalesce(sum(points), 0) into total
  from public.point_history
  where couple_id = target_couple_id;
  
  return total;
end;
$$;


ALTER FUNCTION "public"."get_couple_total_points"("target_couple_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
    v_nickname text;
    v_avatar text;
BEGIN
    -- Extract metadata with fallbacks
    v_nickname := COALESCE(
        new.raw_user_meta_data ->> 'full_name', 
        new.raw_user_meta_data ->> 'nickname', 
        new.raw_user_meta_data ->> 'name',
        '사용자'
    );
    v_avatar := COALESCE(
        new.raw_user_meta_data ->> 'avatar_url', 
        new.raw_user_meta_data ->> 'picture',
        new.raw_user_meta_data ->> 'avatar'
    );

    -- Insert Profile
    INSERT INTO public.profiles (id, nickname, avatar_url)
    VALUES (new.id, v_nickname, v_avatar)
    ON CONFLICT (id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- Insert Notification Settings
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (new.id, false)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Even if metadata extraction fails, create a bare-minimum profile
    INSERT INTO public.profiles (id, nickname)
    VALUES (new.id, '사용자')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_from_id"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '새 사용자'),
    COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
  FROM auth.users WHERE id = p_user_id
  ON CONFLICT (id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_from_id"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_notification_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (new.id, FALSE);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_notification_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_notification_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_partner_id uuid;
    v_my_nickname text;
    v_couple_id uuid;
    v_title text;
    v_content text;
    v_type text;
    v_url text;
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

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        IF v_settings IS NULL OR v_settings.notify_question_answered THEN
            v_type := 'question_answered'; 
            v_title := '오늘의 질문 답변 완료';
            v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!'; 
            v_url := '/home';
            v_should_notify := TRUE;
        END IF;

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        IF v_settings IS NULL OR v_settings.notify_schedule_change THEN
            v_type := 'schedule_change'; 
            v_title := '일정 소식';
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
            v_title := '새로운 장소';
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
            v_title := '아이템 구매 소식';
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

    -- CASE 6: Trips
    ELSIF (TG_TABLE_NAME = 'trips') THEN
        IF v_settings IS NULL OR v_settings.notify_trip_change THEN
            v_type := 'trip_change'; 
            v_title := '여행 계획 업데이트';
            v_content := '여행 계획이 업데이트 되었습니다.'; 
            v_url := '/places?tab=plans';
            v_should_notify := TRUE;
        END IF;
    END IF;

    -- Final: Insert notification if applicable
    IF v_should_notify THEN
        INSERT INTO public.notifications (user_id, couple_id, type, title, content, metadata)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content, jsonb_build_object('url', v_url));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."handle_notification_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_couple_by_code"("invite_code_input" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  target_couple_id uuid;
  member_count int;
  updated_couple record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id) VALUES (v_user_id);
  END IF;

  -- 2. Find couple
  SELECT id INTO target_couple_id FROM public.couples WHERE invite_code = invite_code_input FOR UPDATE;
  IF target_couple_id IS NULL THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;

  -- 3. Check membership
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND couple_id IS NOT NULL) THEN RAISE EXCEPTION 'ALREADY_HAS_COUPLE'; END IF;
  
  SELECT count(*) INTO member_count FROM public.profiles WHERE couple_id = target_couple_id;
  IF member_count >= 2 THEN RAISE EXCEPTION 'COUPLE_FULL'; END IF;

  -- 4. Link and clear code
  UPDATE public.profiles SET couple_id = target_couple_id WHERE id = v_user_id;
  UPDATE public.couples SET invite_code = NULL WHERE id = target_couple_id RETURNING * INTO updated_couple;

  RETURN row_to_json(updated_couple);
END;
$$;


ALTER FUNCTION "public"."join_couple_by_code"("invite_code_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchase_item"("p_item_type" "text", "p_price" integer, "p_description" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_current_points bigint;
  v_new_quantity int;
  v_already_purchased boolean;
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  -- [NEW] Daily Limit Check for Blind Timer Ticket (1 per person per day)
  if p_item_type = 'blind_timer_ticket' then
    select exists (
      select 1 from public.point_history 
      where user_id = v_user_id 
        and type = 'purchase_blind_timer_ticket'
        and created_at::date = (current_timestamp at time zone 'Asia/Seoul')::date
    ) into v_already_purchased;

    if v_already_purchased then
      return json_build_object('success', false, 'error', 'DAILY_LIMIT_REACHED');
    end if;
  end if;

  -- Points Check
  select current_points into v_current_points
  from public.get_couple_points_summary(v_couple_id);

  if v_current_points < p_price then
    return json_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  end if;

  -- Record in Point History (with user_id)
  insert into public.point_history (couple_id, user_id, type, points, description)
  values (v_couple_id, v_user_id, 'purchase_' || p_item_type, -p_price, p_description);

  -- Update/Insert into Inventory
  insert into public.couple_items (couple_id, item_type, quantity)
  values (v_couple_id, p_item_type, 1)
  on conflict (couple_id, item_type)
  do update set 
    quantity = couple_items.quantity + 1,
    updated_at = now()
  returning quantity into v_new_quantity;

  return json_build_object(
    'success', true, 
    'new_quantity', v_new_quantity,
    'remaining_points', v_current_points - p_price
  );
end;
$$;


ALTER FUNCTION "public"."purchase_item"("p_item_type" "text", "p_price" integer, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_blind_timer_start"("p_session_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.game_sessions 
  set started_at = now()
  where id = p_session_id 
    and user_id = auth.uid() 
    and status = 'active';

  if not found then
    return json_build_object('success', false, 'error', 'SESSION_NOT_FOUND_OR_INACTIVE');
  end if;

  return json_build_object('success', true);
end;
$$;


ALTER FUNCTION "public"."record_blind_timer_start"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_blind_timer_stop"("p_session_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.game_sessions 
  set stopped_at = now()
  where id = p_session_id 
    and user_id = auth.uid() 
    and status = 'active';

  if not found then
    return json_build_object('success', false, 'error', 'SESSION_NOT_FOUND_OR_INACTIVE');
  end if;

  return json_build_object('success', true);
end;
$$;


ALTER FUNCTION "public"."record_blind_timer_stop"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_game_result"("p_game_type" "text", "p_score" integer, "p_reached_target" boolean) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_reward_given boolean := false;
  v_today_start timestamptz := (current_timestamp at time zone 'Asia/Seoul')::date;
  v_current_high int;
  v_last_reward_date date;
  v_reward_desc text;
  v_reward_count int;
begin
  -- 1. Get user's couple_id
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then
    raise exception 'NOT_IN_COUPLE';
  end if;
  
  -- 2. Get current game stats
  select high_score, last_reward_date into v_current_high, v_last_reward_date
  from public.game_scores
  where user_id = v_user_id and game_type = p_game_type;

  -- 3. Update high score (Always update if higher)
  insert into public.game_scores (user_id, couple_id, game_type, high_score, updated_at)
  values (v_user_id, v_couple_id, p_game_type, p_score, now())
  on conflict (user_id, game_type)
  do update set 
    high_score = greatest(game_scores.high_score, p_score),
    updated_at = now();

  -- 4. Reward Logic
  -- Condition: reached target AND (never rewarded OR last reward was before today)
  if p_reached_target and (v_last_reward_date is null or v_last_reward_date < v_today_start::date) then
    
    -- Check global limit (max 2 games per day)
    -- count from game_scores where last_reward_date is today
    select count(*) into v_reward_count
    from public.game_scores
    where user_id = v_user_id and last_reward_date = v_today_start::date;

    if v_reward_count < 2 then
      -- Prepare description
      if p_game_type = '2048' then
        v_reward_desc := '게임 보상: 2048 달성!';
      elsif p_game_type = 'watermelon' then
        v_reward_desc := '게임 보상: 수박 완성!';
      elsif p_game_type = 'brick_breaker' then
        v_reward_desc := '게임 보상: 벽돌깨기 100단계 달성!';
      else
        v_reward_desc := '게임 보상: ' || p_game_type || ' 달성!';
      end if;

      -- A. Give points
      insert into public.point_history (couple_id, type, points, description)
      values (v_couple_id, 'game_reward_' || p_game_type, 150, v_reward_desc);
      
      -- B. Mark as rewarded today in game_scores
      update public.game_scores
      set last_reward_date = v_today_start::date
      where user_id = v_user_id and game_type = p_game_type;
      
      v_reward_given := true;
    end if;
  end if;

  return json_build_object(
    'high_score', greatest(coalesce(v_current_high, 0), p_score),
    'reward_given', v_reward_given
  );
end;
$$;


ALTER FUNCTION "public"."record_game_result"("p_game_type" "text", "p_score" integer, "p_reached_target" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_push_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Perform an asynchronous HTTP POST request to the Vercel API
  -- TODO: Replace 'https://daliary.vercel.app' with your actual Vercel deployment URL
  PERFORM
    net.http_post(
      url := 'https://daliary.vercel.app/api/push', 
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."request_push_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_blind_timer_game"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_session_id uuid;
  v_target_time int;
  v_ticket_count int;
  v_item_type text := 'blind_timer_ticket';
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NO_COUPLE');
  end if;

  -- 1. Check for Ticket
  select quantity into v_ticket_count
  from public.couple_items
  where couple_id = v_couple_id and item_type = v_item_type;

  if v_ticket_count is null or v_ticket_count <= 0 then
    return json_build_object('success', false, 'error', 'NO_TICKET');
  end if;

  -- 2. Consume Ticket
  update public.couple_items
  set quantity = quantity - 1, updated_at = now()
  where couple_id = v_couple_id and item_type = v_item_type
  returning quantity into v_ticket_count;

  -- 3. Generate New Range (15.00 - 20.00 integer seconds)
  -- floor(random() * 6) gives 0-5. Adding 15 gives 15-20.
  v_target_time := floor(random() * 6) + 15;

  -- 4. Create Session
  insert into public.game_sessions (couple_id, user_id, game_type, target_time)
  values (v_couple_id, v_user_id, 'blind_timer', v_target_time)
  returning id into v_session_id;

  return json_build_object(
    'success', true, 
    'session_id', v_session_id, 
    'target_time', v_target_time,
    'remaining_tickets', v_ticket_count
  );
end;
$$;


ALTER FUNCTION "public"."start_blind_timer_game"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_level_up_notification"("p_level" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_couple_id UUID;
  v_last_level INT;
  v_user_record RECORD;
  v_settings RECORD;
BEGIN
  v_couple_id := get_auth_couple_id();
  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  -- Lock the couple row for update to prevent concurrent notification calls
  SELECT last_notified_level INTO v_last_level
  FROM public.couples
  WHERE id = v_couple_id
  FOR UPDATE;

  -- Only proceed if the provided level is higher than what was already notified
  IF p_level <= v_last_level THEN
    RETURN;
  END IF;

  -- Update the last notified level immediately
  UPDATE public.couples
  SET last_notified_level = p_level
  WHERE id = v_couple_id;

  -- Notify all members of the couple
  FOR v_user_record IN (
    SELECT id FROM public.profiles WHERE couple_id = v_couple_id
  ) LOOP
    -- Fetch each user's settings
    SELECT is_enabled, notify_level_up INTO v_settings 
    FROM public.notification_settings 
    WHERE user_id = v_user_record.id;

    -- Send notification if enabled (default to true if settings row missing)
    IF v_settings IS NULL OR (v_settings.is_enabled AND v_settings.notify_level_up) THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, content)
      VALUES (
        v_user_record.id, 
        v_couple_id, 
        'level_up', 
        '레벨 업! 🎉', 
        '커플 레벨 ' || p_level || ' 달성! 축하합니다!'
      );
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."trigger_level_up_notification"("p_level" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_item"("p_item_type" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_couple_id uuid;
  v_current_quantity int;
begin
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  select quantity into v_current_quantity
  from public.couple_items
  where couple_id = v_couple_id and item_type = p_item_type;

  if v_current_quantity is null or v_current_quantity <= 0 then
    return json_build_object('success', false, 'error', 'NO_ITEMS_LEFT');
  end if;

  update public.couple_items
  set quantity = quantity - 1, updated_at = now()
  where couple_id = v_couple_id and item_type = p_item_type
  returning quantity into v_current_quantity;

  return json_build_object('success', true, 'new_quantity', v_current_quantity);
end;
$$;


ALTER FUNCTION "public"."use_item"("p_item_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_visit"("p_place_id" "uuid", "p_visited_at" "date", "p_image_url" "text", "p_comment" "text", "p_region" "text", "p_sub_region" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."verify_visit"("p_place_id" "uuid", "p_visited_at" "date", "p_image_url" "text", "p_comment" "text", "p_region" "text", "p_sub_region" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "question_id" "uuid" NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "writer_id" "uuid" NOT NULL,
    "content" "text"
);

ALTER TABLE ONLY "public"."answers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "couple_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "check_in_date" "date" DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'::"text"))::"date" NOT NULL
);

ALTER TABLE ONLY "public"."attendances" REPLICA IDENTITY FULL;


ALTER TABLE "public"."attendances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_items" (
    "couple_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."couple_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couples" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "anniversary_date" "date",
    "invite_code" "text",
    "last_notified_level" integer DEFAULT 1
);


ALTER TABLE "public"."couples" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_scores" (
    "user_id" "uuid" NOT NULL,
    "couple_id" "uuid",
    "game_type" "text" NOT NULL,
    "high_score" integer DEFAULT 0,
    "last_reward_date" "date",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."game_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "couple_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_type" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "score_info" "jsonb",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '01:00:00'::interval),
    "target_time" double precision,
    "started_at" timestamp with time zone,
    "stopped_at" timestamp with time zone
);


ALTER TABLE "public"."game_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "user_id" "uuid" NOT NULL,
    "is_enabled" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notify_question_answered" boolean DEFAULT true,
    "notify_question_request" boolean DEFAULT true,
    "notify_schedule_change" boolean DEFAULT true,
    "notify_place_added" boolean DEFAULT true,
    "notify_visit_verified" boolean DEFAULT true,
    "notify_level_up" boolean DEFAULT true,
    "notify_trip_change" boolean DEFAULT true,
    "notify_item_purchased" boolean DEFAULT true,
    "notify_game_reward" boolean DEFAULT true
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."places" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "couple_id" "uuid" NOT NULL,
    "kakao_place_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "status" "text" NOT NULL,
    CONSTRAINT "places_status_check" CHECK (("status" = ANY (ARRAY['wishlist'::"text", 'visited'::"text"])))
);


ALTER TABLE "public"."places" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "couple_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "points" integer NOT NULL,
    "description" "text",
    "user_id" "uuid"
);

ALTER TABLE ONLY "public"."point_history" REPLICA IDENTITY FULL;


ALTER TABLE "public"."point_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "nickname" "text",
    "avatar_url" "text",
    "couple_id" "uuid",
    "last_active_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "user_id" "uuid" NOT NULL,
    "subscription" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "endpoint" "text" NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content" "text" NOT NULL,
    "publish_date" "date" NOT NULL
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "couple_id" "uuid" NOT NULL,
    "writer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "color" "text" DEFAULT '#FDA4AF'::"text",
    "category" "text" DEFAULT 'couple'::"text" NOT NULL,
    CONSTRAINT "schedules_category_check" CHECK (("category" = ANY (ARRAY['me'::"text", 'partner'::"text", 'couple'::"text"])))
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "couple_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "icon_key" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."tools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "day_number" integer NOT NULL,
    "category" "text" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "memo" "text",
    "place_name" "text",
    "address" "text",
    "lat" double precision,
    "lng" double precision,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trip_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visit_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "visit_id" "uuid" NOT NULL,
    "writer_id" "uuid" NOT NULL,
    "content" "text" NOT NULL
);


ALTER TABLE "public"."visit_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "place_id" "uuid" NOT NULL,
    "visited_at" "date" NOT NULL,
    "image_url" "text",
    "comment" "text",
    "region" "text" NOT NULL,
    "sub_region" "text"
);


ALTER TABLE "public"."visits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_user_id_check_in_date_key" UNIQUE ("user_id", "check_in_date");



ALTER TABLE ONLY "public"."couple_items"
    ADD CONSTRAINT "couple_items_pkey" PRIMARY KEY ("couple_id", "item_type");



ALTER TABLE ONLY "public"."couples"
    ADD CONSTRAINT "couples_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."couples"
    ADD CONSTRAINT "couples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_scores"
    ADD CONSTRAINT "game_scores_pkey" PRIMARY KEY ("user_id", "game_type");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_couple_id_kakao_place_id_key" UNIQUE ("couple_id", "kakao_place_id");



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_history"
    ADD CONSTRAINT "point_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("user_id", "endpoint");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_publish_date_key" UNIQUE ("publish_date");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tools"
    ADD CONSTRAINT "tools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_plans"
    ADD CONSTRAINT "trip_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_comments"
    ADD CONSTRAINT "visit_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_game_scores_couple_id" ON "public"."game_scores" USING "btree" ("couple_id");



CREATE INDEX "idx_notifications_couple_id" ON "public"."notifications" USING "btree" ("couple_id");



CREATE INDEX "idx_notifications_user_id_created_at" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_point_history_couple_id" ON "public"."point_history" USING "btree" ("couple_id");



CREATE INDEX "idx_push_subscriptions_user_id" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "places_couple_id_idx" ON "public"."places" USING "btree" ("couple_id");



CREATE INDEX "visits_place_id_idx" ON "public"."visits" USING "btree" ("place_id");



CREATE OR REPLACE TRIGGER "on_auth_user_created_notification" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_notification_settings"();



CREATE OR REPLACE TRIGGER "send-push-notification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://daliary.vercel.app/api/push', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "tr_add_points_on_answer" AFTER INSERT ON "public"."answers" FOR EACH ROW EXECUTE FUNCTION "public"."add_couple_points"();



CREATE OR REPLACE TRIGGER "tr_add_points_on_attendance" AFTER INSERT ON "public"."attendances" FOR EACH ROW EXECUTE FUNCTION "public"."add_couple_points"();



CREATE OR REPLACE TRIGGER "tr_add_points_on_visit" AFTER INSERT ON "public"."visits" FOR EACH ROW EXECUTE FUNCTION "public"."add_couple_points"();



CREATE OR REPLACE TRIGGER "tr_add_points_on_visit_comment" AFTER INSERT ON "public"."visit_comments" FOR EACH ROW EXECUTE FUNCTION "public"."add_couple_points"();



CREATE OR REPLACE TRIGGER "tr_add_points_on_wishlist" AFTER INSERT ON "public"."places" FOR EACH ROW EXECUTE FUNCTION "public"."add_couple_points"();



CREATE OR REPLACE TRIGGER "tr_notify_answer" AFTER INSERT ON "public"."answers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_notification_trigger"();



CREATE OR REPLACE TRIGGER "tr_notify_place" AFTER INSERT ON "public"."places" FOR EACH ROW EXECUTE FUNCTION "public"."handle_notification_trigger"();



CREATE OR REPLACE TRIGGER "tr_notify_point_history" AFTER INSERT ON "public"."point_history" FOR EACH ROW EXECUTE FUNCTION "public"."handle_notification_trigger"();



CREATE OR REPLACE TRIGGER "tr_notify_schedule" AFTER INSERT OR DELETE OR UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."handle_notification_trigger"();



CREATE OR REPLACE TRIGGER "tr_notify_trip" AFTER INSERT OR DELETE OR UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."handle_notification_trigger"();



CREATE OR REPLACE TRIGGER "tr_notify_visit" AFTER INSERT ON "public"."visits" FOR EACH ROW EXECUTE FUNCTION "public"."handle_notification_trigger"();



CREATE OR REPLACE TRIGGER "tr_request_push_notification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."request_push_notification"();



CREATE OR REPLACE TRIGGER "tr_trip_plans_updated_at" BEFORE UPDATE ON "public"."trip_plans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "tr_trips_updated_at" BEFORE UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couple_items"
    ADD CONSTRAINT "couple_items_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_scores"
    ADD CONSTRAINT "game_scores_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_scores"
    ADD CONSTRAINT "game_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_history"
    ADD CONSTRAINT "point_history_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_history"
    ADD CONSTRAINT "point_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tools"
    ADD CONSTRAINT "tools_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_plans"
    ADD CONSTRAINT "trip_plans_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_comments"
    ADD CONSTRAINT "visit_comments_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_comments"
    ADD CONSTRAINT "visit_comments_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE;



CREATE POLICY "Couples can delete their own places" ON "public"."places" FOR DELETE USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can delete their own tools" ON "public"."tools" FOR DELETE USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can delete their schedules" ON "public"."schedules" FOR DELETE USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can delete visits for their places" ON "public"."visits" FOR DELETE USING (("place_id" IN ( SELECT "places"."id"
   FROM "public"."places"
  WHERE ("places"."couple_id" = "public"."get_auth_couple_id"()))));



CREATE POLICY "Couples can insert their own places" ON "public"."places" FOR INSERT WITH CHECK (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can insert their own tools" ON "public"."tools" FOR INSERT WITH CHECK (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can insert visits for their places" ON "public"."visits" FOR INSERT WITH CHECK (("place_id" IN ( SELECT "places"."id"
   FROM "public"."places"
  WHERE ("places"."couple_id" = "public"."get_auth_couple_id"()))));



CREATE POLICY "Couples can update their own places" ON "public"."places" FOR UPDATE USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can update their own tools" ON "public"."tools" FOR UPDATE USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can update their schedules" ON "public"."schedules" FOR UPDATE USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can update visits for their places" ON "public"."visits" FOR UPDATE USING (("place_id" IN ( SELECT "places"."id"
   FROM "public"."places"
  WHERE ("places"."couple_id" = "public"."get_auth_couple_id"()))));



CREATE POLICY "Couples can view comments for their visits" ON "public"."visit_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."visits" "v"
     JOIN "public"."places" "p" ON (("v"."place_id" = "p"."id")))
  WHERE (("v"."id" = "visit_comments"."visit_id") AND ("p"."couple_id" = "public"."get_auth_couple_id"())))));



CREATE POLICY "Couples can view their answers" ON "public"."answers" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can view their own items" ON "public"."couple_items" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can view their own places" ON "public"."places" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can view their own point history" ON "public"."point_history" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can view their own schedules" ON "public"."schedules" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can view their own tools" ON "public"."tools" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Couples can view visits for their places" ON "public"."visits" FOR SELECT USING (("place_id" IN ( SELECT "places"."id"
   FROM "public"."places"
  WHERE ("places"."couple_id" = "public"."get_auth_couple_id"()))));



CREATE POLICY "Profiles are viewable by authenticated users" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Questions are viewable by everyone" ON "public"."questions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can answer for their couple" ON "public"."answers" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "writer_id") AND ("couple_id" = "public"."get_auth_couple_id"())));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their couple's trip plans" ON "public"."trip_plans" FOR DELETE USING (("trip_id" IN ( SELECT "trips"."id"
   FROM "public"."trips"
  WHERE ("trips"."couple_id" IN ( SELECT "profiles"."couple_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can delete their couple's trips" ON "public"."trips" FOR DELETE USING (("couple_id" IN ( SELECT "profiles"."couple_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert comments for their couple's visits" ON "public"."visit_comments" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "writer_id") AND (EXISTS ( SELECT 1
   FROM ("public"."visits" "v"
     JOIN "public"."places" "p" ON (("v"."place_id" = "p"."id")))
  WHERE (("v"."id" = "visit_comments"."visit_id") AND ("p"."couple_id" = "public"."get_auth_couple_id"()))))));



CREATE POLICY "Users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "recipient"
  WHERE (("recipient"."id" = "notifications"."user_id") AND ("recipient"."couple_id" = ( SELECT "profiles"."couple_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))))))));



CREATE POLICY "Users can insert own game scores" ON "public"."game_scores" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert schedules for their couple" ON "public"."schedules" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "writer_id") AND ("couple_id" = "public"."get_auth_couple_id"())));



CREATE POLICY "Users can insert their couple's trip plans" ON "public"."trip_plans" FOR INSERT WITH CHECK (("trip_id" IN ( SELECT "trips"."id"
   FROM "public"."trips"
  WHERE ("trips"."couple_id" IN ( SELECT "profiles"."couple_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert their couple's trips" ON "public"."trips" FOR INSERT WITH CHECK (("couple_id" IN ( SELECT "profiles"."couple_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert their own attendance" ON "public"."attendances" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own notification settings" ON "public"."notification_settings" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own push subscriptions" ON "public"."push_subscriptions" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own game scores" ON "public"."game_scores" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own notifications (mark as read)" ON "public"."notifications" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their couple's trip plans" ON "public"."trip_plans" FOR UPDATE USING (("trip_id" IN ( SELECT "trips"."id"
   FROM "public"."trips"
  WHERE ("trips"."couple_id" IN ( SELECT "profiles"."couple_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can update their couple's trips" ON "public"."trips" FOR UPDATE USING (("couple_id" IN ( SELECT "profiles"."couple_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update their own answers" ON "public"."answers" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "writer_id"));



CREATE POLICY "Users can update their own couple" ON "public"."couples" FOR UPDATE USING (("id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own sessions" ON "public"."game_sessions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view relevant game scores" ON "public"."game_scores" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("couple_id" = ( SELECT "profiles"."couple_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view their couple's trip plans" ON "public"."trip_plans" FOR SELECT USING (("trip_id" IN ( SELECT "trips"."id"
   FROM "public"."trips"
  WHERE ("trips"."couple_id" IN ( SELECT "profiles"."couple_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view their couple's trips" ON "public"."trips" FOR SELECT USING (("couple_id" IN ( SELECT "profiles"."couple_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their own couple" ON "public"."couples" FOR SELECT USING (("id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Users can view their own couple's attendances" ON "public"."attendances" FOR SELECT USING (("couple_id" = "public"."get_auth_couple_id"()));



CREATE POLICY "Writers can delete their own comments" ON "public"."visit_comments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "writer_id"));



ALTER TABLE "public"."answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visit_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visits" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."answers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."attendances";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."point_history";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."add_couple_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_couple_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_couple_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_debug_points"("p_points" integer, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_debug_points"("p_points" integer, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_debug_points"("p_points" integer, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_level_from_points"("p_points" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_level_from_points"("p_points" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_level_from_points"("p_points" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_blind_timer_reward"("p_session_id" "uuid", "p_diff_seconds" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."claim_blind_timer_reward"("p_session_id" "uuid", "p_diff_seconds" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_blind_timer_reward"("p_session_id" "uuid", "p_diff_seconds" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_game_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_game_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_game_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_couple_and_link_profile"("invite_code_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_couple_and_link_profile"("invite_code_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_couple_and_link_profile"("invite_code_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_couple_and_all_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_couple_and_all_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_couple_and_all_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_app_init_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_app_init_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_app_init_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_couple_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_couple_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_couple_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_couple_id_by_code"("code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_couple_id_by_code"("code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_couple_id_by_code"("code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_couple_points_summary"("target_couple_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_couple_points_summary"("target_couple_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_couple_points_summary"("target_couple_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_couple_total_points"("target_couple_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_couple_total_points"("target_couple_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_couple_total_points"("target_couple_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_from_id"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_from_id"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_from_id"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_notification_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_notification_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_notification_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_notification_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_notification_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_notification_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."join_couple_by_code"("invite_code_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_couple_by_code"("invite_code_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_couple_by_code"("invite_code_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."purchase_item"("p_item_type" "text", "p_price" integer, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."purchase_item"("p_item_type" "text", "p_price" integer, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchase_item"("p_item_type" "text", "p_price" integer, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_blind_timer_start"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_blind_timer_start"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_blind_timer_start"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_blind_timer_stop"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_blind_timer_stop"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_blind_timer_stop"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_game_result"("p_game_type" "text", "p_score" integer, "p_reached_target" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."record_game_result"("p_game_type" "text", "p_score" integer, "p_reached_target" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_game_result"("p_game_type" "text", "p_score" integer, "p_reached_target" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."request_push_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."request_push_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_push_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."start_blind_timer_game"() TO "anon";
GRANT ALL ON FUNCTION "public"."start_blind_timer_game"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_blind_timer_game"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_level_up_notification"("p_level" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_level_up_notification"("p_level" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_level_up_notification"("p_level" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."use_item"("p_item_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."use_item"("p_item_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_item"("p_item_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_visit"("p_place_id" "uuid", "p_visited_at" "date", "p_image_url" "text", "p_comment" "text", "p_region" "text", "p_sub_region" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_visit"("p_place_id" "uuid", "p_visited_at" "date", "p_image_url" "text", "p_comment" "text", "p_region" "text", "p_sub_region" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_visit"("p_place_id" "uuid", "p_visited_at" "date", "p_image_url" "text", "p_comment" "text", "p_region" "text", "p_sub_region" "text") TO "service_role";
























GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON TABLE "public"."attendances" TO "anon";
GRANT ALL ON TABLE "public"."attendances" TO "authenticated";
GRANT ALL ON TABLE "public"."attendances" TO "service_role";



GRANT ALL ON TABLE "public"."couple_items" TO "anon";
GRANT ALL ON TABLE "public"."couple_items" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_items" TO "service_role";



GRANT ALL ON TABLE "public"."couples" TO "anon";
GRANT ALL ON TABLE "public"."couples" TO "authenticated";
GRANT ALL ON TABLE "public"."couples" TO "service_role";



GRANT ALL ON TABLE "public"."game_scores" TO "anon";
GRANT ALL ON TABLE "public"."game_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."game_scores" TO "service_role";



GRANT ALL ON TABLE "public"."game_sessions" TO "anon";
GRANT ALL ON TABLE "public"."game_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."places" TO "anon";
GRANT ALL ON TABLE "public"."places" TO "authenticated";
GRANT ALL ON TABLE "public"."places" TO "service_role";



GRANT ALL ON TABLE "public"."point_history" TO "anon";
GRANT ALL ON TABLE "public"."point_history" TO "authenticated";
GRANT ALL ON TABLE "public"."point_history" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."tools" TO "anon";
GRANT ALL ON TABLE "public"."tools" TO "authenticated";
GRANT ALL ON TABLE "public"."tools" TO "service_role";



GRANT ALL ON TABLE "public"."trip_plans" TO "anon";
GRANT ALL ON TABLE "public"."trip_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_plans" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON TABLE "public"."visit_comments" TO "anon";
GRANT ALL ON TABLE "public"."visit_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_comments" TO "service_role";



GRANT ALL ON TABLE "public"."visits" TO "anon";
GRANT ALL ON TABLE "public"."visits" TO "authenticated";
GRANT ALL ON TABLE "public"."visits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Anyone can view images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'diary-images'::text));



  create policy "Anyone can view visit photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'visit-photos'::text));



  create policy "Authenticated users can upload images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'diary-images'::text));



  create policy "Authenticated users can upload visit photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'visit-photos'::text));



  create policy "Users can delete their own images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = owner));



  create policy "Users can delete their own visit photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = owner));



  create policy "Users can update their own images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((auth.uid() = owner))
with check ((bucket_id = 'diary-images'::text));



