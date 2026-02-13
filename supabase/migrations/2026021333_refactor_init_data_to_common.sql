-- Refactor: Simplify get_app_init_data to focus only on Common Data
-- 기능별 데이터(일정, 질문, 포인트 등)는 각 도메인 서비스에서 관리하도록 분리합니다.
create or replace function public.get_app_init_data()
returns json language plpgsql security definer 
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile record;
  v_couple record;
  v_member_count int;
  v_notif_settings record;
  v_result json;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return null; end if;

  -- 1. 필수 프로필 정보
  select id, nickname, avatar_url, couple_id, last_active_at into v_profile 
  from public.profiles where id = v_user_id;
  
  if v_profile.id is null then return null; end if;

  -- 2. 필수 커플 연결 정보
  if v_profile.couple_id is not null then
    select id, created_at, anniversary_date, invite_code into v_couple 
    from public.couples where id = v_profile.couple_id;

    select count(*) into v_member_count from public.profiles where couple_id = v_profile.couple_id;
  else
    v_couple := null;
    v_member_count := 0;
  end if;

  -- 3. 필수 알림 기본 설정 (푸시 알림 초기화용)
  select is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up
  into v_notif_settings from public.notification_settings where user_id = v_user_id;
  
  if v_notif_settings is null then
    insert into public.notification_settings (user_id) values (v_user_id)
    returning is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up
    into v_notif_settings;
  end if;

  v_result := json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'is_couple_formed', (v_member_count >= 2),
    'notification_settings', row_to_json(v_notif_settings)
  );

  return v_result;
end;
$$;
