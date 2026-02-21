-- Fix duplicate point reward in record_game_result
create or replace function public.record_game_result(
  p_game_type text,
  p_score int,
  p_reached_target boolean
)
returns json language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_reward_given boolean := false;
  v_today date := (current_timestamp at time zone 'Asia/Seoul')::date;
  v_current_high int;
  v_last_reward date;
begin
  -- 1. 유저 정보 및 커플 ID 확인
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then
    raise exception 'NOT_IN_COUPLE';
  end if;
  
  -- 2. 현재 상태 조회 (Row-level Lock 시도하여 경쟁 상태 방지)
  select high_score, last_reward_date into v_current_high, v_last_reward
  from public.game_scores
  where user_id = v_user_id and game_type = p_game_type
  for update;

  -- 3. 최고 점수 업데이트 (Upsert)
  insert into public.game_scores (user_id, couple_id, game_type, high_score, updated_at)
  values (v_user_id, v_couple_id, p_game_type, p_score, now())
  on conflict (user_id, game_type)
  do update set 
    high_score = greatest(game_scores.high_score, p_score),
    updated_at = now();

  -- 4. 보상 로직 (오늘 첫 2048 달성 여부 체크)
  -- 갱신된 데이터를 다시 확인하여 원자성 보장
  if p_reached_target and (v_last_reward is null or v_last_reward < v_today) then
    -- 포인트 중복 지급을 원천 차단하기 위해 last_reward_date를 먼저 업데이트
    update public.game_scores
    set last_reward_date = v_today
    where user_id = v_user_id and game_type = p_game_type;
    
    -- 포인트 지급 (기록은 한 번만)
    insert into public.point_history (couple_id, type, points, description)
    values (v_couple_id, 'game_reward_' || p_game_type, 100, '게임 보상: ' || p_game_type || ' 2048 달성!');
    
    v_reward_given := true;
  end if;

  return json_build_object(
    'high_score', greatest(coalesce(v_current_high, 0), p_score),
    'reward_given', v_reward_given
  );
end;
$$;
