-- Game Scores Table
create table if not exists public.game_scores (
  user_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  game_type text not null,
  high_score int default 0,
  last_reward_date date,
  updated_at timestamptz default now(),
  primary key (user_id, game_type)
);

-- Index for couple-based lookups if needed
create index if not exists idx_game_scores_couple_id on public.game_scores(couple_id);

-- Enable RLS
alter table public.game_scores enable row level security;

-- RLS Policies
create policy "Users can view their own game scores" on public.game_scores
  for select using ( auth.uid() = user_id );

-- RPC to record score and reward points
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
  -- Get user's couple_id
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then
    raise exception 'NOT_IN_COUPLE';
  end if;
  
  -- Get current stats
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

  -- Reward Logic (Daily first 2048)
  -- If reached 2048 (target) and haven't received reward today
  if p_reached_target and (v_last_reward is null or v_last_reward < v_today) then
    insert into public.point_history (couple_id, type, points, description)
    values (v_couple_id, 'game_reward_' || p_game_type, 100, '게임 보상: ' || p_game_type || ' 2048 달성!');
    
    update public.game_scores
    set last_reward_date = v_today
    where user_id = v_user_id and game_type = p_game_type;
    
    v_reward_given := true;
  end if;

  return json_build_object(
    'high_score', greatest(coalesce(v_current_high, 0), p_score),
    'reward_given', v_reward_given
  );
end;
$$;
