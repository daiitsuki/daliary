-- ==========================================
-- CONSOLIDATED SCHEMA (As of 2026-02-19)
-- Includes all migrations up to 2026021802
-- ==========================================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_net";

-- ==========================================
-- 2. Tables
-- ==========================================

-- COUPLES
create table if not exists public.couples (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  anniversary_date date,
  invite_code text unique
);

-- PROFILES
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  updated_at timestamptz default now(),
  nickname text,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null,
  last_active_at timestamptz default now()
);

-- PLACES
create table if not exists public.places (
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
create table if not exists public.visits (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  place_id uuid not null references public.places(id) on delete cascade,
  visited_at date not null,
  image_url text,
  comment text,
  region text not null,
  sub_region text
);

-- VISIT COMMENTS
create table if not exists public.visit_comments (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  content text not null
);

-- QUESTIONS
create table if not exists public.questions (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  content text not null,
  publish_date date not null unique
);

-- ANSWERS
create table if not exists public.answers (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  question_id uuid not null references public.questions(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  content text
);

-- POINT HISTORY
create table if not exists public.point_history (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null,
  points int not null,
  description text
);

-- ATTENDANCES
create table if not exists public.attendances (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null default (current_timestamp at time zone 'Asia/Seoul')::date,
  unique (user_id, check_in_date)
);

-- TOOLS
create table if not exists public.tools (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  url text not null,
  icon_key text not null,
  sort_order int not null default 0
);

-- SCHEDULES
create table if not exists public.schedules (
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

-- NOTIFICATION SETTINGS
create table if not exists public.notification_settings (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    is_enabled boolean default false,
    updated_at timestamptz default now(),
    notify_question_answered boolean default true,
    notify_question_request boolean default true,
    notify_schedule_change boolean default true,
    notify_place_added boolean default true,
    notify_visit_verified boolean default true,
    notify_level_up boolean default true,
    notify_trip_change boolean default true
);

-- PUSH SUBSCRIPTIONS
create table if not exists public.push_subscriptions (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    subscription jsonb not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    couple_id uuid not null references public.couples(id) on delete cascade,
    type text not null,
    title text not null,
    content text not null,
    is_read boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- TRIPS
create table if not exists public.trips (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid not null references public.couples(id) on delete cascade,
    title text not null,
    start_date date not null,
    end_date date not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- TRIP PLANS
create table if not exists public.trip_plans (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references public.trips(id) on delete cascade,
    day_number integer not null,
    category text not null,
    start_time time,
    end_time time,
    memo text,
    place_name text,
    address text,
    lat double precision,
    lng double precision,
    order_index integer not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==========================================
-- 3. Indexes
-- ==========================================
create index if not exists idx_point_history_couple_id on public.point_history(couple_id);
create index if not exists idx_notifications_user_id_created_at on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_couple_id on public.notifications(couple_id);

-- ==========================================
-- 4. Functions & RPCs
-- ==========================================

-- Helper: Get Auth Couple ID
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

-- Action: Verify Visit (Updated with sub_region)
create or replace function public.verify_visit(
  p_place_id uuid,
  p_visited_at date,
  p_image_url text,
  p_comment text,
  p_region text,
  p_sub_region text default null
)
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

  insert into public.visits (place_id, visited_at, image_url, comment, region, sub_region) 
  values (p_place_id, p_visited_at, p_image_url, p_comment, p_region, p_sub_region);
  
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

-- Trigger Function: Add Points (Updated)
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
  if (tg_op = 'DELETE') then
    return old;
  end if;

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

-- Trigger Function: Handle Updated At (Trips)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger Function: Notification Settings for New User
create or replace function public.handle_new_user_notification_settings()
returns trigger as $$
begin
    insert into public.notification_settings (user_id, is_enabled)
    values (new.id, false);
    return new;
end;
$$ language plpgsql security definer;

-- Trigger Function: Notifications (Comprehensive including Trips)
create or replace function public.handle_notification_trigger()
returns trigger as $$
declare
    v_partner_id uuid;
    v_my_nickname text;
    v_couple_id uuid;
    v_title text;
    v_content text;
    v_type text;
begin
    -- Get current user info
    select nickname, couple_id into v_my_nickname, v_couple_id 
    from public.profiles where id = auth.uid();

    -- Find partner ID
    select id into v_partner_id 
    from public.profiles 
    where couple_id = v_couple_id and id != auth.uid()
    limit 1;

    if v_partner_id is null then return coalesce(new, old); end if;

    -- CASE 1: Answers
    if (tg_table_name = 'answers') then
        v_type := 'question_answered';
        v_title := '오늘의 질문 답변 완료';
        v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!';
        
        insert into public.notifications (user_id, couple_id, type, title, content)
        values (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 2: Schedules
    elsif (tg_table_name = 'schedules') then
        v_type := 'schedule_change';
        v_title := '일정 소식';
        if (tg_op = 'INSERT') then
            v_content := v_my_nickname || '님이 ' || to_char(new.start_date, 'MM') || '월 일정을 추가했어요!';
        elsif (tg_op = 'UPDATE') then
            v_content := v_my_nickname || '님이 ' || to_char(new.start_date, 'MM') || '월 일정을 수정했어요!';
        elsif (tg_op = 'DELETE') then
            v_content := v_my_nickname || '님이 ' || to_char(old.start_date, 'MM') || '월 일정을 삭제했어요!';
        end if;

        insert into public.notifications (user_id, couple_id, type, title, content)
        values (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 3: Places
    elsif (tg_table_name = 'places' and new.status = 'wishlist') then
        v_type := 'place_added';
        v_title := '새로운 장소';
        v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';

        insert into public.notifications (user_id, couple_id, type, title, content)
        values (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 4: Visits
    elsif (tg_table_name = 'visits') then
        v_type := 'visit_verified';
        v_title := '방문 인증 완료';
        v_content := new.region || '의 방문 인증이 완료되었어요!';

        insert into public.notifications (user_id, couple_id, type, title, content)
        values (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 5: Level Up
    elsif (tg_table_name = 'point_history' and new.type = 'level_up') then
        v_type := 'level_up';
        v_title := '레벨 업! 🎉';
        v_content := '커플 레벨이 올랐어요! 축하합니다!';

        insert into public.notifications (user_id, couple_id, type, title, content)
        values (v_partner_id, v_couple_id, v_type, v_title, v_content);
        insert into public.notifications (user_id, couple_id, type, title, content)
        values (auth.uid(), v_couple_id, v_type, v_title, v_content);

    -- CASE 6: Trips (NEW)
    elsif (tg_table_name = 'trips') then
        v_type := 'trip_change';
        v_title := '여행 계획 소식';
        declare
            v_date_range text;
            v_target_row record;
        begin
            v_target_row := coalesce(new, old);
            v_date_range := to_char(v_target_row.start_date, 'MM.DD') || '~' || to_char(v_target_row.end_date, 'MM.DD');
            
            if (tg_op = 'INSERT') then
                v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 추가했어요!';
            elsif (tg_op = 'UPDATE') then
                v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 수정했어요!';
            elsif (tg_op = 'DELETE') then
                v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 삭제했어요!';
            end if;

            insert into public.notifications (user_id, couple_id, type, title, content)
            values (v_partner_id, v_couple_id, v_type, v_title, v_content);
        end;
    end if;

    return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Helper: Request Push Notification (Vercel Hook)
create or replace function public.request_push_notification()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://daliary.vercel.app/api/push', 
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(new))
    );
  return new;
end;
$$ language plpgsql security definer;

-- Helper: Get App Init Data (Updated)
create or replace function public.get_app_init_data()
returns json language plpgsql security definer 
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile record;
  v_couple record;
  v_member_count int;
  v_notif_settings record;
  v_result json;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return null; end if;

  -- 1. 필수 프로필 정보
  select id, nickname, avatar_url, couple_id, last_active_at into v_profile 
  from public.profiles where id = v_user_id;
  
  if v_profile.id is null then return null; end if;

  -- 2. 필수 커플 연결 정보
  if v_profile.couple_id is not null then
    select id, created_at, anniversary_date, invite_code into v_couple 
    from public.couples where id = v_profile.couple_id;

    select count(*) into v_member_count from public.profiles where couple_id = v_profile.couple_id;
  else
    v_couple := null;
    v_member_count := 0;
  end if;

  -- 3. 필수 알림 기본 설정 (푸시 알림 초기화용)
  select is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up, notify_trip_change
  into v_notif_settings from public.notification_settings where user_id = v_user_id;
  
  if v_notif_settings is null then
    insert into public.notification_settings (user_id) values (v_user_id)
    returning is_enabled, notify_question_answered, notify_question_request, notify_schedule_change, notify_place_added, notify_visit_verified, notify_level_up, notify_trip_change
    into v_notif_settings;
  end if;

  v_result := json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'is_couple_formed', (v_member_count >= 2),
    'notification_settings', row_to_json(v_notif_settings)
  );

  return v_result;
end;
$$;


-- ==========================================
-- 5. Triggers
-- ==========================================

-- Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Notification Settings
drop trigger if exists on_auth_user_created_notification on public.profiles;
create trigger on_auth_user_created_notification after insert on public.profiles for each row execute procedure public.handle_new_user_notification_settings();

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
drop trigger if exists set_updated_at on public.schedules;
create trigger set_updated_at before update on public.schedules for each row execute procedure update_updated_at_column();

-- Notifications
drop trigger if exists tr_notify_answer on public.answers;
create trigger tr_notify_answer after insert on public.answers for each row execute procedure handle_notification_trigger();

drop trigger if exists tr_notify_schedule on public.schedules;
create trigger tr_notify_schedule after insert or update or delete on public.schedules for each row execute procedure handle_notification_trigger();

drop trigger if exists tr_notify_place on public.places;
create trigger tr_notify_place after insert on public.places for each row execute procedure handle_notification_trigger();

drop trigger if exists tr_notify_visit on public.visits;
create trigger tr_notify_visit after insert on public.visits for each row execute procedure handle_notification_trigger();

drop trigger if exists tr_notify_trip on public.trips;
create trigger tr_notify_trip after insert or update or delete on public.trips for each row execute procedure handle_notification_trigger();

-- Push Webhook
drop trigger if exists tr_request_push_notification on public.notifications;
create trigger tr_request_push_notification after insert on public.notifications for each row execute procedure public.request_push_notification();

-- Trips Timestamps
drop trigger if exists tr_trips_updated_at on public.trips;
create trigger tr_trips_updated_at before update on public.trips for each row execute procedure handle_updated_at();

drop trigger if exists tr_trip_plans_updated_at on public.trip_plans;
create trigger tr_trip_plans_updated_at before update on public.trip_plans for each row execute procedure handle_updated_at();

-- ==========================================
-- 6. Security & RLS Policies
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
alter table public.notification_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.trips enable row level security;
alter table public.trip_plans enable row level security;

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

-- SCHEDULES (Updated Policies)
create policy "Couples can view their own schedules" on public.schedules
  for select using ( couple_id = get_auth_couple_id() );
create policy "Users can insert schedules for their couple" on public.schedules
  for insert with check ( (select auth.uid()) = writer_id and couple_id = get_auth_couple_id() );
create policy "Couples can update their schedules" on public.schedules
  for update using ( couple_id = get_auth_couple_id() );
create policy "Couples can delete their schedules" on public.schedules
  for delete using ( couple_id = get_auth_couple_id() );

-- NOTIFICATION SETTINGS
create policy "Users can view own notification settings" on public.notification_settings
    for select using (auth.uid() = user_id);
create policy "Users can insert/update own notification settings" on public.notification_settings
    for all using (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS (Optimized Policies)
create policy "Users can manage their own push subscriptions" on public.push_subscriptions
    for all
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- NOTIFICATIONS (Updated Policies)
create policy "Users can view own notifications" on public.notifications
    for select using (auth.uid() = user_id);
create policy "Users can update own notifications (mark as read)" on public.notifications
    for update using (auth.uid() = user_id);
create policy "Users can delete own notifications" on public.notifications
    for delete using (auth.uid() = user_id);
create policy "Users can insert notifications" on public.notifications
    for insert with check (
        user_id = (select auth.uid())
        or exists (
            select 1 from public.profiles recipient
            where recipient.id = user_id
            and recipient.couple_id = (
                select couple_id from public.profiles where id = (select auth.uid())
            )
        )
    );

-- TRIPS
create policy "Users can view their couple's trips" on public.trips for select
    using (couple_id in (select couple_id from public.profiles where id = auth.uid()));
create policy "Users can insert their couple's trips" on public.trips for insert
    with check (couple_id in (select couple_id from public.profiles where id = auth.uid()));
create policy "Users can update their couple's trips" on public.trips for update
    using (couple_id in (select couple_id from public.profiles where id = auth.uid()));
create policy "Users can delete their couple's trips" on public.trips for delete
    using (couple_id in (select couple_id from public.profiles where id = auth.uid()));

-- TRIP PLANS
create policy "Users can view their couple's trip plans" on public.trip_plans for select
    using (trip_id in (select id from public.trips where couple_id in (select couple_id from public.profiles where id = auth.uid())));
create policy "Users can insert their couple's trip plans" on public.trip_plans for insert
    with check (trip_id in (select id from public.trips where couple_id in (select couple_id from public.profiles where id = auth.uid())));
create policy "Users can update their couple's trip plans" on public.trip_plans for update
    using (trip_id in (select id from public.trips where couple_id in (select couple_id from public.profiles where id = auth.uid())));
create policy "Users can delete their couple's trip plans" on public.trip_plans for delete
    using (trip_id in (select id from public.trips where couple_id in (select couple_id from public.profiles where id = auth.uid())));
