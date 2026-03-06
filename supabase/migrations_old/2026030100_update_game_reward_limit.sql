-- Migration: 2026030100_update_game_reward_limit.sql
-- Increase game reward to 150 points and limit to 2 games per day

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
  v_reward_desc text;
  v_reward_count int;
begin
  -- Get user's couple_id
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then
    raise exception 'NOT_IN_COUPLE';
  end if;
  
  -- Get current stats for this game
  select high_score, last_reward_date into v_current_high, v_last_reward
  from public.game_scores
  where user_id = v_user_id and game_type = p_game_type;

  -- Upsert high score
  insert into public.game_scores (user_id, couple_id, game_type, high_score, updated_at)
  values (v_user_id, v_couple_id, p_game_type, p_score, now())
  on conflict (user_id, game_type)
  do update set 
    high_score = greatest(game_scores.high_score, p_score),
    updated_at = now();

  -- Reward Logic
  -- 1. Check if this game already gave reward today
  -- 2. Check if reached target
  -- 3. Check if user already reached the limit of 2 games today
  if p_reached_target and (v_last_reward is null or v_last_reward < v_today) then
    -- Count how many games already gave rewards to this user today
    select count(*) into v_reward_count
    from public.game_scores
    where user_id = v_user_id and last_reward_date = v_today;

    if v_reward_count < 2 then
      if p_game_type = '2048' then
        v_reward_desc := '게임 보상: 2048 달성!';
      elsif p_game_type = 'watermelon' then
        v_reward_desc := '게임 보상: 수박 완성!';
      elsif p_game_type = 'brick_breaker' then
        v_reward_desc := '게임 보상: 벽돌깨기 100단계 달성!';
      else
        v_reward_desc := '게임 보상: ' || p_game_type || ' 달성!';
      end if;

      -- Increase points to 150
      insert into public.point_history (couple_id, type, points, description)
      values (v_couple_id, 'game_reward_' || p_game_type, 150, v_reward_desc);
      
      update public.game_scores
      set last_reward_date = v_today
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
