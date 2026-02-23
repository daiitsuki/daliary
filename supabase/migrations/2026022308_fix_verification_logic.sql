-- Migration: 2026022308_fix_verification_logic.sql

-- ==========================================
-- 1. Add stopped_at column to track exact stop time
-- ==========================================
alter table public.game_sessions 
add column if not exists stopped_at timestamptz;

-- ==========================================
-- 2. RPC: Record when the user clicks STOP
-- ==========================================
create or replace function public.record_blind_timer_stop(p_session_id uuid)
returns json language plpgsql security definer
set search_path = public
as $$
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

-- ==========================================
-- 3. Updated Claim RPC: Use recorded stopped_at for verification
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
  if v_session.started_at is null or v_session.stopped_at is null then 
    return json_build_object('success', false, 'error', 'ROUND_NOT_COMPLETED'); 
  end if;

  -- [FIXED] Verify with Server Timing using stopped_at instead of now()
  v_server_elapsed_seconds := extract(epoch from (v_session.stopped_at - v_session.started_at));
  v_client_reported_elapsed := p_diff_seconds + v_session.target_time;

  -- Discrepancy check (Allow 1s for processing/latency)
  if abs(v_server_elapsed_seconds - v_client_reported_elapsed) > 1.0 then
    update public.game_sessions set status = 'completed', score_info = '{"error": "VERIFICATION_FAILED"}' where id = p_session_id;
    return json_build_object('success', false, 'error', 'VERIFICATION_FAILED');
  end if;

  v_abs_diff := abs(p_diff_seconds);
  
  if v_abs_diff < 0.005 then v_reward_points := 5000; v_rank := 'Perfect';
  elsif v_abs_diff <= 0.05 then v_reward_points := 1000; v_rank := 'Great';
  elsif v_abs_diff <= 0.20 then v_reward_points := 300; v_rank := 'Good';
  elsif v_abs_diff <= 0.50 then v_reward_points := 100; v_rank := 'Normal';
  elsif v_abs_diff <= 1.00 then v_reward_points := 50; v_rank := 'Bad';
  else v_reward_points := 0; v_rank := 'Fail';
  end if;

  -- Complete Session
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

  if v_reward_points > 0 then
    insert into public.point_history (couple_id, user_id, type, points, description)
    values (v_session.couple_id, v_session.user_id, 'game_reward_blind_timer', v_reward_points, '블라인드 타이머: ' || v_rank);
  end if;

  return json_build_object('success', true, 'rank', v_rank, 'reward', v_reward_points);
end;
$$;
