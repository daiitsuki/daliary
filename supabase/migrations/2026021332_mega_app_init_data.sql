-- Mega Update: Consolidated App Initial Data
-- 한 번의 요청으로 앱에 필요한 거의 모든 초기 데이터를 가져옵니다.
create or replace function public.get_app_init_data()
returns json language plpgsql security definer 
set search_path = public
as $$
declare
  v_user_id uuid;
  v_couple_id uuid;
  v_profile record;
  v_couple record;
  v_member_count int;
  v_notif_settings record;
  v_members json;
  v_notifications json;
  v_schedules json;
  v_points bigint;
  v_has_checked_in boolean;
  v_today_question record;
  v_today_answers json;
  v_today date;
  v_result json;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return null; end if;

  -- 1. 내 프로필 정보
  select id, nickname, avatar_url, couple_id, last_active_at into v_profile 
  from public.profiles where id = v_user_id;
  
  if v_profile.id is null then return null; end if;

  v_couple_id := v_profile.couple_id;
  v_today := (current_timestamp at time zone 'Asia/Seoul')::date;

  -- 2. 커플 관련 정보 (커플이 연결된 경우에만)
  if v_couple_id is not null then
    -- 커플 기본 정보
    select id, created_at, anniversary_date, invite_code into v_couple 
    from public.couples where id = v_couple_id;

    -- 커플 멤버 목록
    select json_agg(t) into v_members from (
      select id, nickname, avatar_url, last_active_at from public.profiles where couple_id = v_couple_id
    ) t;

    select count(*) into v_member_count from public.profiles where couple_id = v_couple_id;

    -- 누적 포인트
    select coalesce(sum(points), 0) into v_points from public.point_history where couple_id = v_couple_id;
    
    -- 오늘 출석 여부
    select exists(select 1 from public.attendances where user_id = v_user_id and check_in_date = v_today) into v_has_checked_in;

    -- 전체 일정 (캘린더용)
    select json_agg(t) into v_schedules from (
      select id, created_at, couple_id, writer_id, title, description, start_date, end_date, color, category 
      from public.schedules where couple_id = v_couple_id order by start_date asc
    ) t;

    -- 오늘의 질문 및 답변
    select id, content into v_today_question from public.questions where publish_date = v_today;
    if v_today_question.id is not null then
      select json_agg(t) into v_today_answers from (
        select id, content, writer_id, created_at from public.answers 
        where couple_id = v_couple_id and question_id = v_today_question.id
      ) t;
    else
      v_today_question := (null, '아직 오늘의 질문이 준비되지 않았어요. 새로운 질문을 기다려주세요!');
      v_today_answers := '[]'::json;
    end if;

  else
    v_couple := null;
    v_members := '[]'::json;
    v_member_count := 0;
    v_points := 0;
    v_has_checked_in := false;
    v_schedules := '[]'::json;
    v_today_question := (null, '커플 연결이 필요합니다.');
    v_today_answers := '[]'::json;
  end if;

  -- 3. 알림 설정 (없으면 생성)
  select is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up
  into v_notif_settings from public.notification_settings where user_id = v_user_id;
  
  if v_notif_settings is null then
    insert into public.notification_settings (user_id) values (v_user_id)
    returning is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up
    into v_notif_settings;
  end if;

  -- 4. 최근 알림 내역 (최대 20개)
  select json_agg(t) into v_notifications from (
    select id, type, title, content, is_read, created_at, metadata 
    from public.notifications where user_id = v_user_id order by created_at desc limit 20
  ) t;

  -- 최종 데이터 조립
  v_result := json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'is_couple_formed', (v_member_count >= 2),
    'notification_settings', row_to_json(v_notif_settings),
    'members', coalesce(v_members, '[]'::json),
    'notifications', coalesce(v_notifications, '[]'::json),
    'schedules', coalesce(v_schedules, '[]'::json),
    'total_points', v_points,
    'has_checked_in_today', v_has_checked_in,
    'today_data', json_build_object(
      'question', row_to_json(v_today_question),
      'answers', coalesce(v_today_answers, '[]'::json)
    )
  );

  return v_result;
end;
$$;
