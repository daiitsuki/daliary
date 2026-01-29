-- ==========================================
-- 1. Extensions
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. Tables
-- ==========================================

-- COUPLES
create table public.couples (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  anniversary_date date,
  invite_code text unique
);

-- PROFILES
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  updated_at timestamptz default now(),
  nickname text,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null
);

-- PLACES
create table public.places (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  kakao_place_id text not null,
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  status text not null check (status in ('wishlist', 'visited')),
  unique (couple_id, kakao_place_id)
);

-- VISITS
create table public.visits (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  place_id uuid not null references public.places(id) on delete cascade,
  visited_at date not null,
  image_url text,
  comment text,
  region text not null
);

-- VISIT COMMENTS
create table public.visit_comments (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  content text not null
);

-- QUESTIONS
create table public.questions (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  content text not null,
  publish_date date not null unique
);

-- ANSWERS
create table public.answers (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  question_id uuid not null references public.questions(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  content text
);

-- POINT HISTORY
create table public.point_history (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null,
  points int not null,
  description text
);

-- ATTENDANCES
create table public.attendances (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null default (current_timestamp at time zone 'Asia/Seoul')::date,
  unique (user_id, check_in_date)
);

-- TOOLS
create table public.tools (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  url text not null,
  icon_key text not null,
  sort_order int not null default 0
);

-- SCHEDULES
create table public.schedules (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  color text default '#FDA4AF',
  category text not null default 'couple' check (category in ('me', 'partner', 'couple'))
);

-- ==========================================
-- 3. Functions & RPCs (Security & Logic)
-- ==========================================

-- Helper: Get Auth Couple ID (Optimized)
create or replace function public.get_auth_couple_id()
returns uuid language sql security definer stable 
set search_path = public
as $$
  select couple_id from public.profiles where id = (select auth.uid());
$$;

-- Helper: Get Couple Total Points
create or replace function public.get_couple_total_points(target_couple_id uuid)
returns bigint language plpgsql security definer
set search_path = public
as $$
declare
  total bigint;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and couple_id = target_couple_id) then
    raise exception 'Access denied';
  end if;

  select coalesce(sum(points), 0) into total
  from public.point_history
  where couple_id = target_couple_id;
  
  return total;
end;
$$;

-- Helper: Get Couple ID by Invite Code
create or replace function public.get_couple_id_by_code(code text)
returns uuid language plpgsql security definer 
set search_path = public
as $$
declare target_id uuid;
begin
  select id into target_id from public.couples where invite_code = code limit 1;
  return target_id;
end;
$$;

-- Action: Create Couple
create or replace function public.create_couple_and_link_profile(invite_code_input text)
returns json language plpgsql security definer 
set search_path = public
as $$
declare
  new_couple_record record;
begin
  if exists (select 1 from public.profiles where id = auth.uid() and couple_id is not null) then
    raise exception 'ALREADY_HAS_COUPLE';
  end if;
  insert into public.couples (invite_code) values (invite_code_input) returning * into new_couple_record;
  update public.profiles set couple_id = new_couple_record.id where id = auth.uid();
  return row_to_json(new_couple_record);
end;
$$;

-- Action: Join Couple
create or replace function public.join_couple_by_code(invite_code_input text)
returns json language plpgsql security definer 
set search_path = public
as $$
declare
  target_couple_id uuid;
  member_count int;
  updated_couple record;
begin
  select id into target_couple_id from public.couples where invite_code = invite_code_input for update;
  if target_couple_id is null then raise exception 'INVALID_CODE'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and couple_id is not null) then raise exception 'ALREADY_HAS_COUPLE'; end if;
  select count(*) into member_count from public.profiles where couple_id = target_couple_id;
  if member_count >= 2 then raise exception 'COUPLE_FULL'; end if;
  update public.profiles set couple_id = target_couple_id where id = auth.uid();
  update public.couples set invite_code = null where id = target_couple_id returning * into updated_couple;
  return row_to_json(updated_couple);
end;
$$;

-- Action: Verify Visit
create or replace function public.verify_visit(p_place_id uuid, p_visited_at date, p_image_url text, p_comment text, p_region text)
returns void language plpgsql security definer 
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  select couple_id into v_couple_id from public.places where id = p_place_id;
  
  if v_couple_id is null or v_couple_id != (select couple_id from public.profiles where id = auth.uid()) then
    raise exception 'Access denied: You do not have permission to verify this visit.';
  end if;

  insert into public.visits (place_id, visited_at, image_url, comment, region) 
  values (p_place_id, p_visited_at, p_image_url, p_comment, p_region);
  
  update public.places set status = 'visited', updated_at = now() where id = p_place_id;
end;
$$;

-- Action: Delete Couple
create or replace function public.delete_couple_and_all_data()
returns void language plpgsql security definer 
set search_path = public
as $$
declare
  target_couple_id uuid;
begin
  select couple_id into target_couple_id from public.profiles where id = auth.uid();
  if target_couple_id is not null then
    delete from public.couples where id = target_couple_id;
  else
    raise exception '연결된 커플 정보를 찾을 수 없습니다.';
  end if;
end;
$$;

-- Trigger Function: Handle New User
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer 
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Trigger Function: Add Points (Consolidated)
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
    select couple_id into target_couple_id from public.places where id = new.place_id; 
    point_type := 'visit'; point_val := 30; desc_text := '장소 방문 인증 완료';
  
  elsif tg_table_name = 'attendances' then
    target_couple_id := new.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';

  elsif tg_table_name = 'visit_comments' then
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

-- Trigger Function: Update Timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==========================================
-- 4. Triggers
-- ==========================================

-- Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Points
drop trigger if exists tr_add_points_on_answer on public.answers;
create trigger tr_add_points_on_answer after insert on public.answers for each row execute procedure add_couple_points();

drop trigger if exists tr_add_points_on_wishlist on public.places;
create trigger tr_add_points_on_wishlist after insert on public.places for each row execute procedure add_couple_points();

drop trigger if exists tr_add_points_on_visit on public.visits;
create trigger tr_add_points_on_visit after insert on public.visits for each row execute procedure add_couple_points();

drop trigger if exists tr_add_points_on_attendance on public.attendances;
create trigger tr_add_points_on_attendance after insert on public.attendances for each row execute procedure add_couple_points();

drop trigger if exists tr_add_points_on_visit_comment on public.visit_comments;
create trigger tr_add_points_on_visit_comment after insert on public.visit_comments for each row execute procedure add_couple_points();

-- Schedules Timestamp
create trigger set_updated_at before update on public.schedules for each row execute procedure update_updated_at_column();

-- ==========================================
-- 5. Security & RLS Policies
-- ==========================================

-- Enable RLS
alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.visits enable row level security;
alter table public.visit_comments enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.point_history enable row level security;
alter table public.attendances enable row level security;
alter table public.tools enable row level security;
alter table public.schedules enable row level security;

-- COUPLES
create policy "Users can view their own couple" on public.couples for select using ( id = get_auth_couple_id() );
create policy "Users can update their own couple" on public.couples for update using ( id = get_auth_couple_id() );

-- PROFILES
create policy "Users can view own and partner profile" on public.profiles 
  for select using ( (select auth.uid()) = id or (couple_id is not null and couple_id = get_auth_couple_id()) );
create policy "Users can update own profile" on public.profiles 
  for update using ( (select auth.uid()) = id );

-- PLACES
create policy "Couples can view their own places" on public.places for select using ( couple_id = get_auth_couple_id() );
create policy "Couples can insert their own places" on public.places for insert with check ( couple_id = get_auth_couple_id() );
create policy "Couples can update their own places" on public.places for update using ( couple_id = get_auth_couple_id() );
create policy "Couples can delete their own places" on public.places for delete using ( couple_id = get_auth_couple_id() );

-- VISITS
create policy "Couples can view visits for their places" on public.visits for select using ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );
create policy "Couples can insert visits for their places" on public.visits for insert with check ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );
create policy "Couples can update visits for their places" on public.visits for update using ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );
create policy "Couples can delete visits for their places" on public.visits for delete using ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );

-- VISIT COMMENTS
create policy "Couples can view comments for their visits" on public.visit_comments
  for select using (
    exists (
      select 1 from public.visits v
      join public.places p on v.place_id = p.id
      where v.id = visit_comments.visit_id
      and p.couple_id = get_auth_couple_id()
    )
  );
create policy "Users can insert comments for their couple's visits" on public.visit_comments
  for insert with check (
    (select auth.uid()) = writer_id and
    exists (
      select 1 from public.visits v
      join public.places p on v.place_id = p.id
      where v.id = visit_comments.visit_id
      and p.couple_id = get_auth_couple_id()
    )
  );
create policy "Writers can delete their own comments" on public.visit_comments
  for delete using ( (select auth.uid()) = writer_id );

-- QUESTIONS
create policy "Everyone authenticated can view questions" on public.questions for select to authenticated using ( true );

-- ANSWERS
create policy "Couples can view their answers" on public.answers for select using ( couple_id = get_auth_couple_id() );
create policy "Users can answer for their couple" on public.answers 
  for insert with check ( (select auth.uid()) = writer_id and couple_id = get_auth_couple_id() );
create policy "Users can update their own answers" on public.answers 
  for update using ( (select auth.uid()) = writer_id );

-- POINT HISTORY
create policy "Couples can view their own point history" on public.point_history for select using ( couple_id = get_auth_couple_id() );

-- ATTENDANCES
create policy "Users can view their own couple's attendances" on public.attendances for select using ( couple_id = get_auth_couple_id() );
create policy "Users can insert their own attendance" on public.attendances 
  for insert with check ( (select auth.uid()) = user_id );

-- TOOLS
create policy "Couples can view their own tools" on public.tools for select using ( couple_id = get_auth_couple_id() );
create policy "Couples can insert their own tools" on public.tools for insert with check ( couple_id = get_auth_couple_id() );
create policy "Couples can update their own tools" on public.tools for update using ( couple_id = get_auth_couple_id() );
create policy "Couples can delete their own tools" on public.tools for delete using ( couple_id = get_auth_couple_id() );

-- SCHEDULES
create policy "Couples can view their own schedules" on public.schedules
  for select using ( couple_id = get_auth_couple_id() );
create policy "Users can insert schedules for their couple" on public.schedules
  for insert with check ( (select auth.uid()) = writer_id and couple_id = get_auth_couple_id() );
create policy "Writers can update their schedules" on public.schedules
  for update using ( (select auth.uid()) = writer_id );
create policy "Writers can delete their schedules" on public.schedules
  for delete using ( (select auth.uid()) = writer_id );
