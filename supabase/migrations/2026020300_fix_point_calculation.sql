-- Fix Point Calculation Logic and Permissions

-- 0. Helper: Get Auth Couple ID (Optimized to avoid RLS re-evaluation warning)
-- Wraps auth.uid() in (select ...) and marked STABLE to ensure it's calculated once per query
create or replace function public.get_auth_couple_id()
returns uuid language sql security definer stable 
set search_path = public
as $$
  select couple_id from public.profiles where id = (select auth.uid());
$$;

-- 1. Redefine get_couple_total_points to be robust
create or replace function public.get_couple_total_points(target_couple_id uuid)
returns bigint language plpgsql security definer
set search_path = public
as $$
declare
  total bigint;
  auth_couple_id uuid;
begin
  -- Use the helper function for consistency
  auth_couple_id := get_auth_couple_id();

  -- Access Check:
  -- 1. User must have a couple_id (must be in a couple)
  -- 2. User's couple_id must match the requested target_couple_id
  if auth_couple_id is null or auth_couple_id != target_couple_id then
    raise exception 'Access denied: You can only view points for your own couple.';
  end if;

  -- Calculate Total Points
  -- Since this is SECURITY DEFINER, it sees all rows in point_history
  select coalesce(sum(points), 0) into total
  from public.point_history
  where couple_id = target_couple_id;
  
  return total;
end;
$$;

-- 2. Ensure point_history RLS is correct and performant
alter table public.point_history enable row level security;

drop policy if exists "Couples can view their own point history" on public.point_history;
-- Use the STABLE helper function instead of inline subquery to fix performance warning
create policy "Couples can view their own point history" on public.point_history
  for select using ( couple_id = get_auth_couple_id() );

-- 3. Consolidated Trigger Function to ensure points are always added correctly
create or replace function public.add_couple_points()
returns trigger language plpgsql security definer 
set search_path = public
as $$
declare
  target_couple_id uuid;
  point_type text;
  point_val int;
  desc_text text;
begin
  if tg_table_name = 'answers' then
    target_couple_id := new.couple_id; point_type := 'answer'; point_val := 10; desc_text := '오늘의 질문 답변 완료';
  
  elsif tg_table_name = 'places' then
    if new.status = 'wishlist' then 
      target_couple_id := new.couple_id; point_type := 'wishlist'; point_val := 5; desc_text := '가고 싶은 곳 저장: ' || new.name; 
    else 
      return new; 
    end if;
  
  elsif tg_table_name = 'visits' then
    -- Verify place exists and get couple_id
    select couple_id into target_couple_id from public.places where id = new.place_id; 
    point_type := 'visit'; point_val := 30; desc_text := '장소 방문 인증 완료';
  
  elsif tg_table_name = 'attendances' then
    target_couple_id := new.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';

  elsif tg_table_name = 'visit_comments' then
    -- Join to find the couple_id from the visit -> place
    select p.couple_id into target_couple_id 
    from public.visits v
    join public.places p on v.place_id = p.id
    where v.id = new.visit_id;
    point_type := 'visit_comment'; point_val := 3; desc_text := '방문 인증 댓글 작성';
  end if;

  if target_couple_id is not null then
    insert into public.point_history (couple_id, type, points, description) 
    values (target_couple_id, point_type, point_val, desc_text);
  end if;
  
  return new;
end;
$$;