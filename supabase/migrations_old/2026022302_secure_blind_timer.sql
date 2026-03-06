-- Migration: 2026022302_secure_blind_timer.sql

-- ==========================================
-- 1. Table Evolution: Add Server-side Tracking Fields
-- ==========================================
alter table public.game_sessions 
add column if not exists target_time float,
add column if not exists started_at timestamptz;

-- ==========================================
-- 2. New Start Game RPC: Server-side Target Generation
-- ==========================================
create or replace function public.start_blind_timer_game()
returns json language plpgsql security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_points bigint;
  v_session_id uuid;
  v_target_time int;
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NO_COUPLE');
  end if;

  -- Check points
  select current_points into v_points from public.get_couple_points_summary(v_couple_id);
  if v_points < 100 then
    return json_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  end if;

  -- Generate Server-side Target (5.0 - 10.0 seconds)
  v_target_time := floor(random() * 6) + 5;

  -- Deduct points
  insert into public.point_history (couple_id, type, points, description)
  values (v_couple_id, 'game_cost_blind_timer', -100, '블라인드 타이머 게임 참가');

  -- Create Session with Target
  insert into public.game_sessions (couple_id, user_id, game_type, target_time)
  values (v_couple_id, v_user_id, 'blind_timer', v_target_time)
  returning id into v_session_id;

  return json_build_object(
    'success', true, 
    'session_id', v_session_id, 
    'target_time', v_target_time,
    'remaining_points', v_points - 100
  );
end;
$$;

-- ==========================================
-- 3. Action RPC: Record when the round actually starts (after countdown)
-- ==========================================
create or replace function public.record_blind_timer_start(p_session_id uuid)
returns json language plpgsql security definer
set search_path = public
as $$
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

-- ==========================================
-- 4. Secure Claim RPC: Compare with Server-side Elapsed Time
-- ==========================================
create or replace function public.claim_blind_timer_reward(
  p_session_id uuid,
  p_diff_seconds float
)
returns json language plpgsql security definer
set search_path = public
as $$
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
  if v_session.started_at is null then return json_build_object('success', false, 'error', 'ROUND_NOT_STARTED'); end if;

  -- Verify with Server Timing (Anti-Cheat)
  -- Server Elapsed = now() - started_at
  v_server_elapsed_seconds := extract(epoch from (now() - v_session.started_at));
  v_client_reported_elapsed := p_diff_seconds + v_session.target_time;

  -- Allow 1 second network latency/processing delay. If discrepancy > 1s, it's likely cheating.
  if abs(v_server_elapsed_seconds - v_client_reported_elapsed) > 1.0 then
    -- Record cheating attempt and close session
    update public.game_sessions set status = 'completed', score_info = '{"error": "VERIFICATION_FAILED"}' where id = p_session_id;
    return json_build_object('success', false, 'error', 'VERIFICATION_FAILED', 'server_val', v_server_elapsed_seconds, 'client_val', v_client_reported_elapsed);
  end if;

  -- Use client-provided diff for ranking (more precise for the user experience), 
  -- but verified against server values.
  v_abs_diff := abs(p_diff_seconds);
  
  if v_abs_diff < 0.005 then v_reward_points := 5000; v_rank := 'Perfect';
  elsif v_abs_diff <= 0.05 then v_reward_points := 1000; v_rank := 'Great';
  elsif v_abs_diff <= 0.20 then v_reward_points := 300; v_rank := 'Good';
  elsif v_abs_diff <= 0.50 then v_reward_points := 100; v_rank := 'Normal';
  elsif v_abs_diff <= 1.00 then v_reward_points := 50; v_rank := 'Bad';
  else v_reward_points := 0; v_rank := 'Fail';
  end if;

  -- Update Session
  update public.game_sessions 
  set status = 'completed', 
      updated_at = now(),
      score_info = json_build_object(
        'diff', p_diff_seconds, 
        'rank', v_rank, 
        'points', v_reward_points,
        'server_verified', true
      )
  where id = p_session_id;

  -- Add Points
  if v_reward_points > 0 then
    insert into public.point_history (couple_id, type, points, description)
    values (v_session.couple_id, 'game_reward_blind_timer', v_reward_points, '블라인드 타이머: ' || v_rank);
  end if;

  return json_build_object('success', true, 'rank', v_rank, 'reward', v_reward_points);
end;
$$;

-- ==========================================
-- 5. Operational Function: Cleanup Old Sessions
-- ==========================================
create or replace function public.cleanup_game_sessions()
returns void language plpgsql security definer
as $$
begin
  -- Delete sessions older than 1 day or completed sessions
  delete from public.game_sessions 
  where (expires_at < now()) 
     or (status = 'completed' and updated_at < (now() - interval '7 days'));
end;
$$;
