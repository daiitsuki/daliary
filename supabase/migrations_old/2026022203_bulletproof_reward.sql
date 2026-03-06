-- Bulletproof game reward logic using ROW_COUNT
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
  v_rows_affected int;
begin
  -- 1. 커플 ID 확인
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then raise exception 'NOT_IN_COUPLE'; end if;
  
  -- 2. 행이 없으면 생성 (최고 점수 기록용)
  insert into public.game_scores (user_id, couple_id, game_type, high_score)
  values (v_user_id, v_couple_id, p_game_type, p_score)
  on conflict (user_id, game_type) do nothing;

  -- 3. 최고 점수 업데이트
  update public.game_scores
  set high_score = greatest(high_score, p_score),
      updated_at = now()
  where user_id = v_user_id and game_type = p_game_type;

  -- 4. 원자적 보상 체크 및 지급
  -- 조건에 맞는 경우에만 last_reward_date를 오늘로 업데이트함
  if p_reached_target then
    update public.game_scores
    set last_reward_date = v_today
    where user_id = v_user_id 
      and game_type = p_game_type
      and (last_reward_date is null or last_reward_date < v_today);
    
    -- 실제로 업데이트된 행이 있다면 (즉, 오늘 처음 성공했다면)
    get diagnostics v_rows_affected = row_count;
    
    if v_rows_affected > 0 then
      insert into public.point_history (couple_id, type, points, description)
      values (v_couple_id, 'game_reward_' || p_game_type, 100, '게임 보상: ' || p_game_type || ' 2048 달성!');
      v_reward_given := true;
    end if;
  end if;

  return json_build_object(
    'reward_given', v_reward_given
  );
end;
$$;
