-- ==========================================
-- 1. Extensions
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. Tables
-- ==========================================

-- COUPLES TABLE
create table public.couples (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  anniversary_date date,
  invite_code text unique
);

-- PROFILES TABLE
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  updated_at timestamptz default now(),
  nickname text,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null
);

-- PLACES TABLE
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

-- VISITS TABLE
create table public.visits (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  place_id uuid not null references public.places(id) on delete cascade,
  visited_at date not null,
  image_url text,
  comment text,
  region text not null
);

-- DIARIES TABLE
create table public.diaries (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  mood text,
  image_url text,
  place_id uuid references public.places(id) on delete set null,
  region text
);

-- QUESTIONS TABLE
create table public.questions (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  content text not null,
  publish_date date not null unique
);

-- ANSWERS TABLE
create table public.answers (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  question_id uuid not null references public.questions(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  content text
);

-- POINT HISTORY TABLE
create table public.point_history (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null,
  points int not null,
  description text
);

-- ATTENDANCES TABLE
create table public.attendances (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null default (current_timestamp at time zone 'Asia/Seoul')::date,
  unique (user_id, check_in_date)
);

-- ==========================================
-- 3. Security & RLS
-- ==========================================

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.visits enable row level security;
alter table public.diaries enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.point_history enable row level security;
alter table public.attendances enable row level security;

-- Helper Function
create or replace function get_auth_couple_id()
returns uuid language sql security definer stable as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

-- Policies: Couples
create policy "Users can view their own couple" on public.couples for select using ( id = get_auth_couple_id() );
create policy "Users can update their own couple" on public.couples for update using ( id = get_auth_couple_id() );
create policy "Authenticated users can create couples" on public.couples for insert to authenticated with check ( true );

-- Policies: Profiles
create policy "Users can view own and partner profile" on public.profiles for select using ( auth.uid() = id or (couple_id is not null and couple_id = get_auth_couple_id()) );
create policy "Users can update own profile" on public.profiles for update using ( auth.uid() = id );

-- Policies: Places
create policy "Couples can view their own places" on public.places for select using ( couple_id = get_auth_couple_id() );
create policy "Couples can insert their own places" on public.places for insert with check ( couple_id = get_auth_couple_id() );
create policy "Couples can update their own places" on public.places for update using ( couple_id = get_auth_couple_id() );
create policy "Couples can delete their own places" on public.places for delete using ( couple_id = get_auth_couple_id() );

-- Policies: Visits
create policy "Couples can view visits for their places" on public.visits for select using ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );
create policy "Couples can insert visits for their places" on public.visits for insert with check ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );
create policy "Couples can update visits for their places" on public.visits for update using ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );
create policy "Couples can delete visits for their places" on public.visits for delete using ( place_id in (select id from public.places where couple_id = get_auth_couple_id()) );

-- Policies: Diaries
create policy "Couples can view their diaries" on public.diaries for select using ( couple_id = get_auth_couple_id() );
create policy "Users can insert diaries for their couple" on public.diaries for insert with check ( auth.uid() = writer_id and couple_id = get_auth_couple_id() );
create policy "Writers can update their diaries" on public.diaries for update using ( auth.uid() = writer_id );
create policy "Writers can delete their diaries" on public.diaries for delete using ( auth.uid() = writer_id );

-- Policies: Questions
create policy "Everyone authenticated can view questions" on public.questions for select to authenticated using ( true );

-- Policies: Answers
create policy "Couples can view their answers" on public.answers for select using ( couple_id = get_auth_couple_id() );
create policy "Users can answer for their couple" on public.answers for insert with check ( auth.uid() = writer_id and couple_id = get_auth_couple_id() );
create policy "Users can update their own answers" on public.answers for update using ( auth.uid() = writer_id );

-- Policies: Point History
create policy "Couples can view their own point history" on public.point_history for select using ( couple_id = get_auth_couple_id() );

-- Policies: Attendances
create policy "Users can view their own couple's attendances" on public.attendances for select using ( couple_id = get_auth_couple_id() );
create policy "Users can insert their own attendance" on public.attendances for insert with check ( auth.uid() = user_id );

-- ==========================================
-- 4. Functions & RPCs
-- ==========================================

-- Create Couple & Link
create or replace function create_couple_and_link_profile(invite_code_input text)
returns json language plpgsql security definer as $$
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

-- Join Couple
create or replace function join_couple_by_code(invite_code_input text)
returns json language plpgsql security definer as $$
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

-- Verify Visit
create or replace function verify_visit(p_place_id uuid, p_visited_at date, p_image_url text, p_comment text, p_region text)
returns void language plpgsql security definer as $$
begin
  insert into public.visits (place_id, visited_at, image_url, comment, region) values (p_place_id, p_visited_at, p_image_url, p_comment, p_region);
  update public.places set status = 'visited', updated_at = now() where id = p_place_id;
end;
$$;

-- Legacy Get Couple ID
create or replace function get_couple_id_by_code(code text)
returns uuid language plpgsql security definer as $$
declare target_id uuid;
begin
  select id into target_id from public.couples where invite_code = code limit 1;
  return target_id;
end;
$$;

-- ==========================================
-- 5. Triggers
-- ==========================================

-- Handle New User
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Points System
create or replace function public.add_couple_points()
returns trigger language plpgsql security definer as $$
declare
  target_couple_id uuid;
  point_type text;
  point_val int;
  desc_text text;
begin
  if tg_table_name = 'answers' then
    target_couple_id := new.couple_id; point_type := 'answer'; point_val := 10; desc_text := '오늘의 질문 답변 완료';
  elsif tg_table_name = 'diaries' then
    target_couple_id := new.couple_id; point_type := 'diary'; point_val := 10; desc_text := '새로운 일기 작성';
  elsif tg_table_name = 'places' then
    if new.status = 'wishlist' then target_couple_id := new.couple_id; point_type := 'wishlist'; point_val := 5; desc_text := '가고 싶은 곳 저장: ' || new.name; else return new; end if;
  elsif tg_table_name = 'visits' then
    select couple_id into target_couple_id from public.places where id = new.place_id; point_type := 'visit'; point_val := 20; desc_text := '장소 방문 인증 완료';
  elsif tg_table_name = 'attendances' then
    target_couple_id := new.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';
  end if;
  if target_couple_id is not null then
    insert into public.point_history (couple_id, type, points, description) values (target_couple_id, point_type, point_val, desc_text);
  end if;
  return new;
end;
$$;

drop trigger if exists tr_add_points_on_answer on public.answers;
create trigger tr_add_points_on_answer after insert on public.answers for each row execute procedure add_couple_points();
drop trigger if exists tr_add_points_on_diary on public.diaries;
create trigger tr_add_points_on_diary after insert on public.diaries for each row execute procedure add_couple_points();
drop trigger if exists tr_add_points_on_wishlist on public.places;
create trigger tr_add_points_on_wishlist after insert on public.places for each row execute procedure add_couple_points();
drop trigger if exists tr_add_points_on_visit on public.visits;
create trigger tr_add_points_on_visit after insert on public.visits for each row execute procedure add_couple_points();
drop trigger if exists tr_add_points_on_attendance on public.attendances;
create trigger tr_add_points_on_attendance after insert on public.attendances for each row execute procedure add_couple_points();

-- ==========================================
-- 6. Storage (Manual Setup Required in Console)
-- ==========================================
-- bucket: diary-images (public: true)
-- bucket: visit-photos (public: true)
