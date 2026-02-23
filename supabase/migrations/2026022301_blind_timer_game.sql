-- Migration: 2026022301_blind_timer_game.sql

-- ==========================================
-- 1. Game Sessions Table
-- ==========================================
create table if not exists public.game_sessions (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_type text not null, -- 'blind_timer'
  status text not null default 'active', -- 'active', 'completed'
  score_info jsonb, -- store final result
  expires_at timestamptz default (now() + interval '1 hour')
);

-- Enable RLS
alter table public.game_sessions enable row level security;

-- Policy: Users can view their own sessions
create policy "Users can view their own sessions"
on public.game_sessions for select
to authenticated
using (auth.uid() = user_id);

-- ==========================================
-- 2. Start Game RPC
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

  -- Deduct points
  insert into public.point_history (couple_id, type, points, description)
  values (v_couple_id, 'game_cost_blind_timer', -100, '블라인드 타이머 게임 참가');

  -- Create Session
  insert into public.game_sessions (couple_id, user_id, game_type)
  values (v_couple_id, v_user_id, 'blind_timer')
  returning id into v_session_id;

  return json_build_object('success', true, 'session_id', v_session_id, 'remaining_points', v_points - 100);
end;
$$;

-- ==========================================
-- 3. Claim Reward RPC
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
  v_abs_diff float;
begin
  select * into v_session from public.game_sessions where id = p_session_id;
  
  if v_session.id is null then
     return json_build_object('success', false, 'error', 'INVALID_SESSION');
  end if;

  if v_session.user_id != auth.uid() then
     return json_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if v_session.status != 'active' then
     return json_build_object('success', false, 'error', 'SESSION_CLOSED');
  end if;

  v_abs_diff := abs(p_diff_seconds);
  
  -- Calculate Reward (Updated logic: <= 0.05 is Great, 0.00 is Perfect)
  -- Note: Floating point comparison for 0.00 might need epsilon, but client sends what it measured.
  -- We'll use a very small epsilon for Perfect.
  if v_abs_diff < 0.005 then
    v_reward_points := 5000;
    v_rank := 'Perfect';
  elsif v_abs_diff <= 0.05 then
    v_reward_points := 1000;
    v_rank := 'Great';
  elsif v_abs_diff <= 0.20 then
    v_reward_points := 300;
    v_rank := 'Good';
  elsif v_abs_diff <= 0.50 then
    v_reward_points := 100;
    v_rank := 'Normal';
  elsif v_abs_diff <= 1.00 then
    v_reward_points := 50;
    v_rank := 'Bad';
  else
    v_reward_points := 0;
    v_rank := 'Fail';
  end if;

  -- Update Session
  update public.game_sessions 
  set status = 'completed', 
      updated_at = now(),
      score_info = json_build_object('diff', p_diff_seconds, 'rank', v_rank, 'points', v_reward_points)
  where id = p_session_id;

  -- Add Points
  if v_reward_points > 0 then
    insert into public.point_history (couple_id, type, points, description)
    values (v_session.couple_id, 'game_reward_blind_timer', v_reward_points, '블라인드 타이머: ' || v_rank);
  end if;

  return json_build_object('success', true, 'rank', v_rank, 'reward', v_reward_points);
end;
$$;
