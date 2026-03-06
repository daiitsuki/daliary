-- Migration: 2026030201_refine_game_reward_logic_v2.sql
-- Refine game reward logic with explicit locking and improved transaction order

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
  v_today_kst date := (current_timestamp at time zone 'Asia/Seoul')::date;
  v_last_reward_date date;
  v_reward_desc text;
  v_reward_count int;
  v_current_high int;
begin
  -- 1. Get user's couple_id
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then
    raise exception 'NOT_IN_COUPLE';
  end if;
  
  -- 2. Get current game stats (Lock for update to prevent concurrent reward issues)
  -- IMPORTANT: We check the reward status BEFORE we potentially update anything
  select high_score, last_reward_date into v_current_high, v_last_reward_date
  from public.game_scores
  where user_id = v_user_id and game_type = p_game_type
  for update;

  -- 3. Calculate today's reward count (BEFORE the current transaction might update one)
  select count(*) into v_reward_count
  from public.game_scores
  where user_id = v_user_id and last_reward_date = v_today_kst;

  -- 4. Reward Logic
  -- Condition: reached target AND (never rewarded OR last reward was before today KST)
  if p_reached_target and (v_last_reward_date is null or v_last_reward_date < v_today_kst) then
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
      
      -- B. Update the reward date in the record we'll upsert/update
      v_last_reward_date := v_today_kst;
      v_reward_given := true;
    end if;
  end if;

  -- 5. Upsert high score and last_reward_date
  insert into public.game_scores (user_id, couple_id, game_type, high_score, last_reward_date, updated_at)
  values (v_user_id, v_couple_id, p_game_type, p_score, v_last_reward_date, now())
  on conflict (user_id, game_type)
  do update set 
    high_score = greatest(game_scores.high_score, p_score),
    last_reward_date = coalesce(v_last_reward_date, game_scores.last_reward_date),
    updated_at = now()
  returning high_score into v_current_high;

  return json_build_object(
    'high_score', v_current_high,
    'reward_given', v_reward_given
  );
end;
$$;
