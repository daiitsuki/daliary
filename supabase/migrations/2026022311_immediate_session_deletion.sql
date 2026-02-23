-- Migration: 2026022311_immediate_session_deletion.sql

-- ==========================================
-- Update Blind Timer: Immediate deletion after reward
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
