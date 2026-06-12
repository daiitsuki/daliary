create extension if not exists "pg_cron" with schema "pg_catalog";


  create table "public"."answers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "question_id" uuid not null,
    "couple_id" uuid not null,
    "writer_id" uuid not null,
    "content" text
      );


alter table "public"."answers" enable row level security;


  create table "public"."attendances" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "couple_id" uuid not null,
    "user_id" uuid not null,
    "check_in_date" date not null default ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'::text))::date
      );


alter table "public"."attendances" enable row level security;


  create table "public"."couple_items" (
    "couple_id" uuid not null,
    "item_type" text not null,
    "quantity" integer not null default 0,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."couple_items" enable row level security;


  create table "public"."couples" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "anniversary_date" date,
    "invite_code" text,
    "last_notified_level" integer default 1
      );


alter table "public"."couples" enable row level security;


  create table "public"."game_scores" (
    "user_id" uuid not null,
    "couple_id" uuid,
    "game_type" text not null,
    "high_score" integer default 0,
    "last_reward_date" date,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."game_scores" enable row level security;


  create table "public"."game_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "couple_id" uuid not null,
    "user_id" uuid not null,
    "game_type" text not null,
    "status" text not null default 'active'::text,
    "score_info" jsonb,
    "expires_at" timestamp with time zone default (now() + '01:00:00'::interval),
    "target_time" double precision,
    "started_at" timestamp with time zone,
    "stopped_at" timestamp with time zone
      );


alter table "public"."game_sessions" enable row level security;


  create table "public"."notification_settings" (
    "user_id" uuid not null,
    "is_enabled" boolean default false,
    "updated_at" timestamp with time zone default now(),
    "notify_visit_verified" boolean default true,
    "notify_communication" boolean default true,
    "notify_schedule_trip" boolean default true,
    "notify_game_activity" boolean default true
      );


alter table "public"."notification_settings" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "couple_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "content" text not null,
    "is_read" boolean default false,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."places" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "couple_id" uuid not null,
    "kakao_place_id" text not null,
    "name" text not null,
    "address" text,
    "lat" double precision not null,
    "lng" double precision not null,
    "status" text not null,
    "category" text
      );


alter table "public"."places" enable row level security;


  create table "public"."point_history" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "couple_id" uuid not null,
    "type" text not null,
    "points" integer not null,
    "description" text,
    "user_id" uuid
      );


alter table "public"."point_history" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "updated_at" timestamp with time zone default now(),
    "nickname" text,
    "avatar_url" text,
    "couple_id" uuid,
    "last_active_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."push_subscriptions" (
    "user_id" uuid not null,
    "subscription" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "endpoint" text not null
      );


alter table "public"."push_subscriptions" enable row level security;


  create table "public"."questions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "content" text not null,
    "publish_date" date not null
      );


alter table "public"."questions" enable row level security;


  create table "public"."schedules" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "couple_id" uuid not null,
    "writer_id" uuid not null,
    "title" text not null,
    "description" text,
    "start_date" date not null,
    "end_date" date not null,
    "color" text default '#FDA4AF'::text,
    "category" text not null default 'couple'::text
      );


alter table "public"."schedules" enable row level security;


  create table "public"."timetable_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "couple_id" uuid not null,
    "writer_id" uuid not null,
    "title" text not null,
    "day_of_week" smallint not null,
    "start_time" text not null,
    "end_time" text not null,
    "place_name" text,
    "place_address" text,
    "color" text not null default '#FDA4AF'::text,
    "memo" text
      );


alter table "public"."timetable_blocks" enable row level security;


  create table "public"."tools" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "couple_id" uuid not null,
    "title" text not null,
    "url" text not null,
    "icon_key" text not null,
    "sort_order" integer not null default 0
      );


alter table "public"."tools" enable row level security;


  create table "public"."trip_plans" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "day_number" integer not null,
    "category" text not null,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "memo" text,
    "place_name" text,
    "address" text,
    "lat" double precision,
    "lng" double precision,
    "order_index" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."trip_plans" enable row level security;


  create table "public"."trips" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null,
    "title" text not null,
    "start_date" date not null,
    "end_date" date not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."trips" enable row level security;


  create table "public"."visit_comments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "visit_id" uuid not null,
    "writer_id" uuid not null,
    "content" text not null
      );


alter table "public"."visit_comments" enable row level security;


  create table "public"."visit_likes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "visit_id" uuid not null,
    "user_id" uuid not null
      );


alter table "public"."visit_likes" enable row level security;


  create table "public"."visits" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "place_id" uuid not null,
    "visited_at" date not null,
    "image_url" text,
    "comment" text,
    "region" text not null,
    "sub_region" text,
    "writer_id" uuid
      );


alter table "public"."visits" enable row level security;

CREATE UNIQUE INDEX answers_pkey ON public.answers USING btree (id);

CREATE UNIQUE INDEX attendances_pkey ON public.attendances USING btree (id);

CREATE UNIQUE INDEX attendances_user_id_check_in_date_key ON public.attendances USING btree (user_id, check_in_date);

CREATE UNIQUE INDEX couple_items_pkey ON public.couple_items USING btree (couple_id, item_type);

CREATE UNIQUE INDEX couples_invite_code_key ON public.couples USING btree (invite_code);

CREATE UNIQUE INDEX couples_pkey ON public.couples USING btree (id);

CREATE UNIQUE INDEX game_scores_pkey ON public.game_scores USING btree (user_id, game_type);

CREATE UNIQUE INDEX game_sessions_pkey ON public.game_sessions USING btree (id);

CREATE INDEX idx_game_scores_couple_id ON public.game_scores USING btree (couple_id);

CREATE INDEX idx_notifications_couple_id ON public.notifications USING btree (couple_id);

CREATE INDEX idx_notifications_user_id_created_at ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX idx_point_history_couple_id ON public.point_history USING btree (couple_id);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);

CREATE INDEX idx_timetable_blocks_couple_id ON public.timetable_blocks USING btree (couple_id);

CREATE INDEX idx_timetable_blocks_writer_id ON public.timetable_blocks USING btree (writer_id);

CREATE INDEX idx_visits_writer_id ON public.visits USING btree (writer_id);

CREATE UNIQUE INDEX notification_settings_pkey ON public.notification_settings USING btree (user_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE INDEX places_couple_id_idx ON public.places USING btree (couple_id);

CREATE UNIQUE INDEX places_couple_id_kakao_place_id_key ON public.places USING btree (couple_id, kakao_place_id);

CREATE UNIQUE INDEX places_pkey ON public.places USING btree (id);

CREATE UNIQUE INDEX point_history_pkey ON public.point_history USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (user_id, endpoint);

CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id);

CREATE UNIQUE INDEX questions_publish_date_key ON public.questions USING btree (publish_date);

CREATE UNIQUE INDEX schedules_pkey ON public.schedules USING btree (id);

CREATE UNIQUE INDEX timetable_blocks_pkey ON public.timetable_blocks USING btree (id);

CREATE UNIQUE INDEX tools_pkey ON public.tools USING btree (id);

CREATE UNIQUE INDEX trip_plans_pkey ON public.trip_plans USING btree (id);

CREATE UNIQUE INDEX trips_pkey ON public.trips USING btree (id);

CREATE UNIQUE INDEX visit_comments_pkey ON public.visit_comments USING btree (id);

CREATE UNIQUE INDEX visit_likes_pkey ON public.visit_likes USING btree (id);

CREATE UNIQUE INDEX visit_likes_visit_id_user_id_key ON public.visit_likes USING btree (visit_id, user_id);

CREATE UNIQUE INDEX visits_pkey ON public.visits USING btree (id);

CREATE INDEX visits_place_id_idx ON public.visits USING btree (place_id);

alter table "public"."answers" add constraint "answers_pkey" PRIMARY KEY using index "answers_pkey";

alter table "public"."attendances" add constraint "attendances_pkey" PRIMARY KEY using index "attendances_pkey";

alter table "public"."couple_items" add constraint "couple_items_pkey" PRIMARY KEY using index "couple_items_pkey";

alter table "public"."couples" add constraint "couples_pkey" PRIMARY KEY using index "couples_pkey";

alter table "public"."game_scores" add constraint "game_scores_pkey" PRIMARY KEY using index "game_scores_pkey";

alter table "public"."game_sessions" add constraint "game_sessions_pkey" PRIMARY KEY using index "game_sessions_pkey";

alter table "public"."notification_settings" add constraint "notification_settings_pkey" PRIMARY KEY using index "notification_settings_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."places" add constraint "places_pkey" PRIMARY KEY using index "places_pkey";

alter table "public"."point_history" add constraint "point_history_pkey" PRIMARY KEY using index "point_history_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."questions" add constraint "questions_pkey" PRIMARY KEY using index "questions_pkey";

alter table "public"."schedules" add constraint "schedules_pkey" PRIMARY KEY using index "schedules_pkey";

alter table "public"."timetable_blocks" add constraint "timetable_blocks_pkey" PRIMARY KEY using index "timetable_blocks_pkey";

alter table "public"."tools" add constraint "tools_pkey" PRIMARY KEY using index "tools_pkey";

alter table "public"."trip_plans" add constraint "trip_plans_pkey" PRIMARY KEY using index "trip_plans_pkey";

alter table "public"."trips" add constraint "trips_pkey" PRIMARY KEY using index "trips_pkey";

alter table "public"."visit_comments" add constraint "visit_comments_pkey" PRIMARY KEY using index "visit_comments_pkey";

alter table "public"."visit_likes" add constraint "visit_likes_pkey" PRIMARY KEY using index "visit_likes_pkey";

alter table "public"."visits" add constraint "visits_pkey" PRIMARY KEY using index "visits_pkey";

alter table "public"."answers" add constraint "answers_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."answers" validate constraint "answers_couple_id_fkey";

alter table "public"."answers" add constraint "answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE not valid;

alter table "public"."answers" validate constraint "answers_question_id_fkey";

alter table "public"."answers" add constraint "answers_writer_id_fkey" FOREIGN KEY (writer_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."answers" validate constraint "answers_writer_id_fkey";

alter table "public"."attendances" add constraint "attendances_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."attendances" validate constraint "attendances_couple_id_fkey";

alter table "public"."attendances" add constraint "attendances_user_id_check_in_date_key" UNIQUE using index "attendances_user_id_check_in_date_key";

alter table "public"."attendances" add constraint "attendances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."attendances" validate constraint "attendances_user_id_fkey";

alter table "public"."couple_items" add constraint "couple_items_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."couple_items" validate constraint "couple_items_couple_id_fkey";

alter table "public"."couples" add constraint "couples_invite_code_key" UNIQUE using index "couples_invite_code_key";

alter table "public"."game_scores" add constraint "game_scores_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."game_scores" validate constraint "game_scores_couple_id_fkey";

alter table "public"."game_scores" add constraint "game_scores_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."game_scores" validate constraint "game_scores_user_id_fkey";

alter table "public"."game_sessions" add constraint "game_sessions_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."game_sessions" validate constraint "game_sessions_couple_id_fkey";

alter table "public"."game_sessions" add constraint "game_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."game_sessions" validate constraint "game_sessions_user_id_fkey";

alter table "public"."notification_settings" add constraint "notification_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notification_settings" validate constraint "notification_settings_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_couple_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."places" add constraint "places_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."places" validate constraint "places_couple_id_fkey";

alter table "public"."places" add constraint "places_couple_id_kakao_place_id_key" UNIQUE using index "places_couple_id_kakao_place_id_key";

alter table "public"."places" add constraint "places_status_check" CHECK ((status = ANY (ARRAY['wishlist'::text, 'visited'::text]))) not valid;

alter table "public"."places" validate constraint "places_status_check";

alter table "public"."point_history" add constraint "point_history_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."point_history" validate constraint "point_history_couple_id_fkey";

alter table "public"."point_history" add constraint "point_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."point_history" validate constraint "point_history_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_couple_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_user_id_fkey";

alter table "public"."questions" add constraint "questions_publish_date_key" UNIQUE using index "questions_publish_date_key";

alter table "public"."schedules" add constraint "schedules_category_check" CHECK ((category = ANY (ARRAY['me'::text, 'partner'::text, 'couple'::text]))) not valid;

alter table "public"."schedules" validate constraint "schedules_category_check";

alter table "public"."schedules" add constraint "schedules_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."schedules" validate constraint "schedules_couple_id_fkey";

alter table "public"."schedules" add constraint "schedules_writer_id_fkey" FOREIGN KEY (writer_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."schedules" validate constraint "schedules_writer_id_fkey";

alter table "public"."timetable_blocks" add constraint "timetable_blocks_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."timetable_blocks" validate constraint "timetable_blocks_couple_id_fkey";

alter table "public"."timetable_blocks" add constraint "timetable_blocks_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."timetable_blocks" validate constraint "timetable_blocks_day_of_week_check";

alter table "public"."timetable_blocks" add constraint "timetable_blocks_writer_id_fkey" FOREIGN KEY (writer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."timetable_blocks" validate constraint "timetable_blocks_writer_id_fkey";

alter table "public"."timetable_blocks" add constraint "timetable_end_time_format" CHECK ((end_time ~ '^\d{2}:\d{2}$'::text)) not valid;

alter table "public"."timetable_blocks" validate constraint "timetable_end_time_format";

alter table "public"."timetable_blocks" add constraint "timetable_start_before_end" CHECK ((start_time < end_time)) not valid;

alter table "public"."timetable_blocks" validate constraint "timetable_start_before_end";

alter table "public"."timetable_blocks" add constraint "timetable_start_time_format" CHECK ((start_time ~ '^\d{2}:\d{2}$'::text)) not valid;

alter table "public"."timetable_blocks" validate constraint "timetable_start_time_format";

alter table "public"."tools" add constraint "tools_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."tools" validate constraint "tools_couple_id_fkey";

alter table "public"."trip_plans" add constraint "trip_plans_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."trip_plans" validate constraint "trip_plans_trip_id_fkey";

alter table "public"."trips" add constraint "trips_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE not valid;

alter table "public"."trips" validate constraint "trips_couple_id_fkey";

alter table "public"."visit_comments" add constraint "visit_comments_visit_id_fkey" FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE not valid;

alter table "public"."visit_comments" validate constraint "visit_comments_visit_id_fkey";

alter table "public"."visit_comments" add constraint "visit_comments_writer_id_fkey" FOREIGN KEY (writer_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."visit_comments" validate constraint "visit_comments_writer_id_fkey";

alter table "public"."visit_likes" add constraint "visit_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."visit_likes" validate constraint "visit_likes_user_id_fkey";

alter table "public"."visit_likes" add constraint "visit_likes_visit_id_fkey" FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE not valid;

alter table "public"."visit_likes" validate constraint "visit_likes_visit_id_fkey";

alter table "public"."visit_likes" add constraint "visit_likes_visit_id_user_id_key" UNIQUE using index "visit_likes_visit_id_user_id_key";

alter table "public"."visits" add constraint "visits_place_id_fkey" FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE not valid;

alter table "public"."visits" validate constraint "visits_place_id_fkey";

alter table "public"."visits" add constraint "visits_writer_id_fkey" FOREIGN KEY (writer_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."visits" validate constraint "visits_writer_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_couple_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_couple_id UUID;
  point_type TEXT;
  point_val INT;
  desc_text TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME = 'answers' THEN
    target_couple_id := NEW.couple_id; point_type := 'answer'; point_val := 30; desc_text := '오늘의 질문 답변 완료';
  
  ELSIF TG_TABLE_NAME = 'places' THEN
    IF NEW.status = 'wishlist' THEN 
      target_couple_id := NEW.couple_id; point_type := 'wishlist'; point_val := 5; desc_text := '가고 싶은 곳 저장: ' || NEW.name; 
    ELSE 
      RETURN NEW; 
    END IF;
  
  ELSIF TG_TABLE_NAME = 'visits' THEN
    SELECT couple_id INTO target_couple_id FROM public.places WHERE id = NEW.place_id; 
    point_type := 'visit'; point_val := 30; desc_text := '장소 방문 인증 완료';
  
  ELSIF TG_TABLE_NAME = 'attendances' THEN
    target_couple_id := NEW.couple_id; point_type := 'attendance'; point_val := 50; desc_text := '일일 출석체크 완료';

  ELSIF TG_TABLE_NAME = 'visit_comments' THEN
    SELECT p.couple_id INTO target_couple_id 
    FROM public.visits v
    JOIN public.places p ON v.place_id = p.id
    WHERE v.id = NEW.visit_id;
    point_type := 'visit_comment'; point_val := 3; desc_text := '방문 인증 댓글 작성';
  END IF;

  IF target_couple_id IS NOT NULL THEN
    INSERT INTO public.point_history (couple_id, type, points, description) 
    VALUES (target_couple_id, point_type, point_val, desc_text);
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_debug_points(p_points integer, p_description text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_couple_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();

  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NO_COUPLE_FOUND');
  end if;

  insert into public.point_history (couple_id, user_id, type, points, description)
  values (v_couple_id, v_user_id, 'debug', p_points, p_description);

  return json_build_object('success', true);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_level_from_points(p_points bigint)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  v_level INT := 1;
  v_accumulated_exp BIGINT := 0;
  v_required_exp BIGINT;
BEGIN
  LOOP
    -- Formula: round(1.95 * pow(level, 1.5) + 50)
    v_required_exp := round(1.95 * pow(v_level, 1.5) + 50)::BIGINT;
    IF p_points < v_accumulated_exp + v_required_exp THEN
      RETURN v_level;
    END IF;
    v_accumulated_exp := v_accumulated_exp + v_required_exp;
    v_level := v_level + 1;
    IF v_level > 1000 THEN RETURN 1000; END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_blind_timer_reward(p_session_id uuid, p_diff_seconds double precision)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_game_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Delete sessions older than 1 day or completed sessions
  delete from public.game_sessions 
  where (expires_at < now()) 
     or (status = 'completed' and updated_at < (now() - interval '7 days'));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_couple_and_link_profile(invite_code_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_couple_record record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Ensure profile exists (Auto-repair if trigger was delayed or failed)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id) VALUES (v_user_id);
  END IF;

  -- 2. Check if already has couple
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND couple_id IS NOT NULL) THEN
    RAISE EXCEPTION 'ALREADY_HAS_COUPLE';
  END IF;

  -- 3. Create couple
  INSERT INTO public.couples (invite_code) VALUES (invite_code_input) RETURNING * INTO new_couple_record;

  -- 4. Link profile
  UPDATE public.profiles SET couple_id = new_couple_record.id WHERE id = v_user_id;

  RETURN row_to_json(new_couple_record);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_couple_and_all_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_app_init_data()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_couple_id uuid;
  v_profile record;
  v_couple record;
  v_settings record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Ensure Profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, nickname, avatar_url)
    SELECT 
      id, 
      COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '사용자'),
      COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Ensure Notification Settings exist
  IF NOT EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = v_user_id) THEN
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (v_user_id, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 3. Fetch data
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  v_couple_id := v_profile.couple_id;
  
  IF v_couple_id IS NOT NULL THEN
    SELECT * INTO v_couple FROM public.couples WHERE id = v_couple_id;
  END IF;
  
  SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_user_id;

  RETURN json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'notification_settings', row_to_json(v_settings),
    'is_couple_formed', v_couple_id IS NOT NULL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_auth_couple_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select couple_id from public.profiles where id = (select auth.uid());
$function$
;

CREATE OR REPLACE FUNCTION public.get_couple_id_by_code(code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare target_id uuid;
begin
  select id into target_id from public.couples where invite_code = code limit 1;
  return target_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_couple_points_summary(target_couple_id uuid)
 RETURNS TABLE(cumulative_points bigint, current_points bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND couple_id = target_couple_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0)::bigint,
    COALESCE(SUM(points), 0)::bigint
  FROM public.point_history
  WHERE couple_id = target_couple_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_couple_total_points(target_couple_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_nickname text;
    v_avatar text;
BEGIN
    -- Extract metadata with fallbacks
    v_nickname := COALESCE(
        new.raw_user_meta_data ->> 'full_name', 
        new.raw_user_meta_data ->> 'nickname', 
        new.raw_user_meta_data ->> 'name',
        '사용자'
    );
    v_avatar := COALESCE(
        new.raw_user_meta_data ->> 'avatar_url', 
        new.raw_user_meta_data ->> 'picture',
        new.raw_user_meta_data ->> 'avatar'
    );

    -- Insert Profile
    INSERT INTO public.profiles (id, nickname, avatar_url)
    VALUES (new.id, v_nickname, v_avatar)
    ON CONFLICT (id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- Insert Notification Settings
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (new.id, false)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Even if metadata extraction fails, create a bare-minimum profile
    INSERT INTO public.profiles (id, nickname)
    VALUES (new.id, '사용자')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_from_id(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'nickname', '새 사용자'),
    COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
  FROM auth.users WHERE id = p_user_id
  ON CONFLICT (id) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (new.id, FALSE);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_partner_id uuid;
    v_my_nickname text;
    v_couple_id uuid;
    v_title text;
    v_content text;
    v_type text;
    v_url text;
    v_settings record;
    v_should_notify boolean;
BEGIN
    -- 1. Sender Info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- 2. Partner (Recipient)
    SELECT id INTO v_partner_id FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid() LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- 3. Settings Check
    SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_partner_id;
    
    -- If no settings row, default to notify enabled (defensive)
    IF v_settings IS NULL THEN 
        v_should_notify := TRUE;
    ELSE 
        v_should_notify := v_settings.is_enabled; 
    END IF;

    IF v_should_notify = FALSE THEN RETURN COALESCE(NEW, OLD); END IF;
    
    -- Reset for specific event check
    v_should_notify := FALSE;
    v_url := '/home'; -- Default fallback URL

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        IF v_settings IS NULL OR v_settings.notify_question_answered THEN
            v_type := 'question_answered'; 
            v_title := '오늘의 질문 답변 완료';
            v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!'; 
            v_url := '/home';
            v_should_notify := TRUE;
        END IF;

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        IF v_settings IS NULL OR v_settings.notify_schedule_change THEN
            v_type := 'schedule_change'; 
            v_title := '일정 소식';
            IF (TG_OP = 'INSERT') THEN 
                v_content := v_my_nickname || '님이 ' || TO_CHAR(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
                v_url := '/calendar?date=' || TO_CHAR(NEW.start_date, 'YYYY-MM-DD');
            ELSIF (TG_OP = 'UPDATE') THEN 
                v_content := v_my_nickname || '님이 ' || TO_CHAR(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
                v_url := '/calendar?date=' || TO_CHAR(NEW.start_date, 'YYYY-MM-DD');
            ELSIF (TG_OP = 'DELETE') THEN 
                v_content := v_my_nickname || '님이 ' || TO_CHAR(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
                v_url := '/calendar?date=' || TO_CHAR(OLD.start_date, 'YYYY-MM-DD');
            END IF;
            v_should_notify := TRUE;
        END IF;

    -- CASE 3: Places
    ELSIF (TG_TABLE_NAME = 'places') THEN
        IF NEW.status = 'wishlist' AND (v_settings IS NULL OR v_settings.notify_place_added) THEN
            v_type := 'place_added'; 
            v_title := '새로운 장소';
            v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!'; 
            v_url := '/places?tab=wishlist';
            v_should_notify := TRUE;
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        IF v_settings IS NULL OR v_settings.notify_visit_verified THEN
            v_type := 'visit_verified'; 
            v_title := '방문 인증 완료';
            v_content := NEW.region || '의 방문 인증이 완료되었어요!'; 
            v_url := '/places?tab=dashboard';
            v_should_notify := TRUE;
        END IF;

    -- CASE 5: Point History (Level up, Items, Game Rewards)
    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        IF NEW.type = 'level_up' AND (v_settings IS NULL OR v_settings.notify_level_up) THEN
            v_type := 'level_up'; 
            v_title := '레벨 업! 🎉'; 
            v_content := '커플 레벨이 올랐어요! 축하합니다!'; 
            v_url := '/home';
            v_should_notify := TRUE;
        ELSIF NEW.type LIKE 'purchase_%' AND (v_settings IS NULL OR v_settings.notify_item_purchased) THEN
            v_type := 'item_purchased'; 
            v_title := '아이템 구매 소식';
            v_content := v_my_nickname || '님이 ' || REPLACE(NEW.description, ' 구매', '') || '을 구매하였습니다.'; 
            v_url := '/home';
            v_should_notify := TRUE;
        ELSIF NEW.type LIKE 'game_reward_%' AND (v_settings IS NULL OR (v_settings.notify_game_reward IS NOT FALSE)) THEN
            v_type := 'game_reward'; 
            v_title := '게임 미션 달성';
            v_content := v_my_nickname || '님이 ' || REPLACE(NEW.description, '게임 보상: ', '') || ' 포인트를 획득했어요!';
            v_url := '/games';
            v_should_notify := TRUE;
        END IF;

    -- CASE 6: Trips
    ELSIF (TG_TABLE_NAME = 'trips') THEN
        IF v_settings IS NULL OR v_settings.notify_trip_change THEN
            v_type := 'trip_change'; 
            v_title := '여행 계획 업데이트';
            v_content := '여행 계획이 업데이트 되었습니다.'; 
            v_url := '/places?tab=plans';
            v_should_notify := TRUE;
        END IF;
    END IF;

    -- Final: Insert notification if applicable
    IF v_should_notify THEN
        INSERT INTO public.notifications (user_id, couple_id, type, title, content, metadata)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content, jsonb_build_object('url', v_url));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_timetable_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.join_couple_by_code(invite_code_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_couple_id uuid;
  member_count int;
  updated_couple record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id) VALUES (v_user_id);
  END IF;

  -- 2. Find couple
  SELECT id INTO target_couple_id FROM public.couples WHERE invite_code = invite_code_input FOR UPDATE;
  IF target_couple_id IS NULL THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;

  -- 3. Check membership
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND couple_id IS NOT NULL) THEN RAISE EXCEPTION 'ALREADY_HAS_COUPLE'; END IF;
  
  SELECT count(*) INTO member_count FROM public.profiles WHERE couple_id = target_couple_id;
  IF member_count >= 2 THEN RAISE EXCEPTION 'COUPLE_FULL'; END IF;

  -- 4. Link and clear code
  UPDATE public.profiles SET couple_id = target_couple_id WHERE id = v_user_id;
  UPDATE public.couples SET invite_code = NULL WHERE id = target_couple_id RETURNING * INTO updated_couple;

  RETURN row_to_json(updated_couple);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_comment_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  partner_id uuid;
  v_couple_id uuid;
BEGIN
  -- 댓글 작성자의 프로필을 통해 couple_id 획득
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = NEW.writer_id;
  
  IF v_couple_id IS NOT NULL THEN
    -- 파트너 ID 찾기
    SELECT id INTO partner_id FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != NEW.writer_id LIMIT 1;
    
    IF partner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, message, metadata)
      VALUES (
        partner_id,
        v_couple_id,
        'comment_added',
        '새로운 댓글',
        '추억 피드에 새로운 댓글이 달렸어요!',
        jsonb_build_object('visit_id', NEW.visit_id, 'comment_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_profile_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  partner_id uuid;
BEGIN
  -- avatar_url이 변경된 경우에만 실행
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND NEW.avatar_url IS NOT NULL AND NEW.couple_id IS NOT NULL THEN
    -- 파트너 ID 찾기
    SELECT id INTO partner_id FROM public.profiles
    WHERE couple_id = NEW.couple_id AND id != NEW.id LIMIT 1;
    
    IF partner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, message, metadata)
      VALUES (
        partner_id,
        NEW.couple_id,
        'profile_updated',
        '프로필 변경',
        '상대방이 프로필 사진을 변경했어요!',
        jsonb_build_object('profile_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.purchase_item(p_item_type text, p_price integer, p_description text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_current_points bigint;
  v_new_quantity int;
  v_already_purchased boolean;
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  -- [NEW] Daily Limit Check for Blind Timer Ticket (1 per person per day)
  if p_item_type = 'blind_timer_ticket' then
    select exists (
      select 1 from public.point_history 
      where user_id = v_user_id 
        and type = 'purchase_blind_timer_ticket'
        and created_at::date = (current_timestamp at time zone 'Asia/Seoul')::date
    ) into v_already_purchased;

    if v_already_purchased then
      return json_build_object('success', false, 'error', 'DAILY_LIMIT_REACHED');
    end if;
  end if;

  -- Points Check
  select current_points into v_current_points
  from public.get_couple_points_summary(v_couple_id);

  if v_current_points < p_price then
    return json_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  end if;

  -- Record in Point History (with user_id)
  insert into public.point_history (couple_id, user_id, type, points, description)
  values (v_couple_id, v_user_id, 'purchase_' || p_item_type, -p_price, p_description);

  -- Update/Insert into Inventory
  insert into public.couple_items (couple_id, item_type, quantity)
  values (v_couple_id, p_item_type, 1)
  on conflict (couple_id, item_type)
  do update set 
    quantity = couple_items.quantity + 1,
    updated_at = now()
  returning quantity into v_new_quantity;

  return json_build_object(
    'success', true, 
    'new_quantity', v_new_quantity,
    'remaining_points', v_current_points - p_price
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.record_blind_timer_start(p_session_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_blind_timer_stop(p_session_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_game_result(p_game_type text, p_score integer, p_reached_target boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_reward_given boolean := false;
  v_today_start timestamptz := (current_timestamp at time zone 'Asia/Seoul')::date;
  v_current_high int;
  v_last_reward_date date;
  v_reward_desc text;
  v_reward_count int;
begin
  -- 1. Get user's couple_id
  select couple_id into v_couple_id from public.profiles where id = v_user_id;
  if v_couple_id is null then
    raise exception 'NOT_IN_COUPLE';
  end if;
  
  -- 2. Get current game stats
  select high_score, last_reward_date into v_current_high, v_last_reward_date
  from public.game_scores
  where user_id = v_user_id and game_type = p_game_type;

  -- 3. Update high score (Always update if higher)
  insert into public.game_scores (user_id, couple_id, game_type, high_score, updated_at)
  values (v_user_id, v_couple_id, p_game_type, p_score, now())
  on conflict (user_id, game_type)
  do update set 
    high_score = greatest(game_scores.high_score, p_score),
    updated_at = now();

  -- 4. Reward Logic
  -- Condition: reached target AND (never rewarded OR last reward was before today)
  if p_reached_target and (v_last_reward_date is null or v_last_reward_date < v_today_start::date) then
    
    -- Check global limit (max 2 games per day)
    -- count from game_scores where last_reward_date is today
    select count(*) into v_reward_count
    from public.game_scores
    where user_id = v_user_id and last_reward_date = v_today_start::date;

    if v_reward_count < 2 then
      -- Prepare description
      if p_game_type = '2048' then
        v_reward_desc := '게임 보상: 2048 달성!';
      elsif p_game_type = 'watermelon' then
        v_reward_desc := '게임 보상: 수박 완성!';
      elsif p_game_type = 'brick_breaker' then
        v_reward_desc := '게임 보상: 벽돌깨기 100단계 달성!';
      elsif p_game_type = 'stack' then
        v_reward_desc := '게임 보상: 스택 타워 미션 달성!';
      else
        v_reward_desc := '게임 보상: ' || p_game_type || ' 달성!';
      end if;

      -- A. Give points
      insert into public.point_history (couple_id, type, points, description)
      values (v_couple_id, 'game_reward_' || p_game_type, 150, v_reward_desc);
      
      -- B. Mark as rewarded today in game_scores
      update public.game_scores
      set last_reward_date = v_today_start::date
      where user_id = v_user_id and game_type = p_game_type;
      
      v_reward_given := true;
    end if;
  end if;

  return json_build_object(
    'high_score', greatest(coalesce(v_current_high, 0), p_score),
    'reward_given', v_reward_given
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.request_push_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Perform an asynchronous HTTP POST request to the Vercel API
  -- TODO: Replace 'https://daliary.vercel.app' with your actual Vercel deployment URL
  PERFORM
    net.http_post(
      url := 'https://daliary.vercel.app/api/push', 
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.start_blind_timer_game()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_session_id uuid;
  v_target_time int;
  v_ticket_count int;
  v_item_type text := 'blind_timer_ticket';
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NO_COUPLE');
  end if;

  -- 1. Check for Ticket
  select quantity into v_ticket_count
  from public.couple_items
  where couple_id = v_couple_id and item_type = v_item_type;

  if v_ticket_count is null or v_ticket_count <= 0 then
    return json_build_object('success', false, 'error', 'NO_TICKET');
  end if;

  -- 2. Consume Ticket
  update public.couple_items
  set quantity = quantity - 1, updated_at = now()
  where couple_id = v_couple_id and item_type = v_item_type
  returning quantity into v_ticket_count;

  -- 3. Generate New Range (15.00 - 20.00 integer seconds)
  -- floor(random() * 6) gives 0-5. Adding 15 gives 15-20.
  v_target_time := floor(random() * 6) + 15;

  -- 4. Create Session
  insert into public.game_sessions (couple_id, user_id, game_type, target_time)
  values (v_couple_id, v_user_id, 'blind_timer', v_target_time)
  returning id into v_session_id;

  return json_build_object(
    'success', true, 
    'session_id', v_session_id, 
    'target_time', v_target_time,
    'remaining_tickets', v_ticket_count
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_visit_like(p_visit_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.visit_likes 
        WHERE visit_id = p_visit_id AND user_id = v_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.visit_likes 
        WHERE visit_id = p_visit_id AND user_id = v_user_id;
        RETURN json_build_object('liked', false);
    ELSE
        INSERT INTO public.visit_likes (visit_id, user_id)
        VALUES (p_visit_id, v_user_id);
        RETURN json_build_object('liked', true);
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_level_up_notification(p_level integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_couple_id UUID;
  v_last_level INT;
  v_user_record RECORD;
  v_settings RECORD;
BEGIN
  v_couple_id := get_auth_couple_id();
  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  -- Lock the couple row for update to prevent concurrent notification calls
  SELECT last_notified_level INTO v_last_level
  FROM public.couples
  WHERE id = v_couple_id
  FOR UPDATE;

  -- Only proceed if the provided level is higher than what was already notified
  IF p_level <= v_last_level THEN
    RETURN;
  END IF;

  -- Update the last notified level immediately
  UPDATE public.couples
  SET last_notified_level = p_level
  WHERE id = v_couple_id;

  -- Notify all members of the couple
  FOR v_user_record IN (
    SELECT id FROM public.profiles WHERE couple_id = v_couple_id
  ) LOOP
    -- Fetch each user's settings
    SELECT is_enabled, notify_level_up INTO v_settings 
    FROM public.notification_settings 
    WHERE user_id = v_user_record.id;

    -- Send notification if enabled (default to true if settings row missing)
    IF v_settings IS NULL OR (v_settings.is_enabled AND v_settings.notify_level_up) THEN
      INSERT INTO public.notifications (user_id, couple_id, type, title, content)
      VALUES (
        v_user_record.id, 
        v_couple_id, 
        'level_up', 
        '레벨 업! 🎉', 
        '커플 레벨 ' || p_level || ' 달성! 축하합니다!'
      );
    END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.use_item(p_item_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_couple_id uuid;
  v_current_quantity int;
begin
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  select quantity into v_current_quantity
  from public.couple_items
  where couple_id = v_couple_id and item_type = p_item_type;

  if v_current_quantity is null or v_current_quantity <= 0 then
    return json_build_object('success', false, 'error', 'NO_ITEMS_LEFT');
  end if;

  update public.couple_items
  set quantity = quantity - 1, updated_at = now()
  where couple_id = v_couple_id and item_type = p_item_type
  returning quantity into v_current_quantity;

  return json_build_object('success', true, 'new_quantity', v_current_quantity);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_visit(p_place_id uuid, p_visited_at date, p_image_url text, p_comment text, p_region text, p_sub_region text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_couple_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  -- Check permission
  SELECT couple_id INTO v_couple_id FROM public.places WHERE id = p_place_id;
  
  IF v_couple_id IS NULL OR v_couple_id != (SELECT couple_id FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to verify this visit.';
  END IF;

  -- Insert visit with writer_id
  INSERT INTO public.visits (place_id, visited_at, image_url, comment, region, sub_region, writer_id) 
  VALUES (p_place_id, p_visited_at, p_image_url, p_comment, p_region, p_sub_region, v_user_id);
  
  -- Update place status
  UPDATE public.places SET status = 'visited', updated_at = NOW() WHERE id = p_place_id;
END;
$function$
;

grant delete on table "public"."answers" to "anon";

grant insert on table "public"."answers" to "anon";

grant references on table "public"."answers" to "anon";

grant select on table "public"."answers" to "anon";

grant trigger on table "public"."answers" to "anon";

grant truncate on table "public"."answers" to "anon";

grant update on table "public"."answers" to "anon";

grant delete on table "public"."answers" to "authenticated";

grant insert on table "public"."answers" to "authenticated";

grant references on table "public"."answers" to "authenticated";

grant select on table "public"."answers" to "authenticated";

grant trigger on table "public"."answers" to "authenticated";

grant truncate on table "public"."answers" to "authenticated";

grant update on table "public"."answers" to "authenticated";

grant delete on table "public"."answers" to "service_role";

grant insert on table "public"."answers" to "service_role";

grant references on table "public"."answers" to "service_role";

grant select on table "public"."answers" to "service_role";

grant trigger on table "public"."answers" to "service_role";

grant truncate on table "public"."answers" to "service_role";

grant update on table "public"."answers" to "service_role";

grant delete on table "public"."attendances" to "anon";

grant insert on table "public"."attendances" to "anon";

grant references on table "public"."attendances" to "anon";

grant select on table "public"."attendances" to "anon";

grant trigger on table "public"."attendances" to "anon";

grant truncate on table "public"."attendances" to "anon";

grant update on table "public"."attendances" to "anon";

grant delete on table "public"."attendances" to "authenticated";

grant insert on table "public"."attendances" to "authenticated";

grant references on table "public"."attendances" to "authenticated";

grant select on table "public"."attendances" to "authenticated";

grant trigger on table "public"."attendances" to "authenticated";

grant truncate on table "public"."attendances" to "authenticated";

grant update on table "public"."attendances" to "authenticated";

grant delete on table "public"."attendances" to "service_role";

grant insert on table "public"."attendances" to "service_role";

grant references on table "public"."attendances" to "service_role";

grant select on table "public"."attendances" to "service_role";

grant trigger on table "public"."attendances" to "service_role";

grant truncate on table "public"."attendances" to "service_role";

grant update on table "public"."attendances" to "service_role";

grant delete on table "public"."couple_items" to "anon";

grant insert on table "public"."couple_items" to "anon";

grant references on table "public"."couple_items" to "anon";

grant select on table "public"."couple_items" to "anon";

grant trigger on table "public"."couple_items" to "anon";

grant truncate on table "public"."couple_items" to "anon";

grant update on table "public"."couple_items" to "anon";

grant delete on table "public"."couple_items" to "authenticated";

grant insert on table "public"."couple_items" to "authenticated";

grant references on table "public"."couple_items" to "authenticated";

grant select on table "public"."couple_items" to "authenticated";

grant trigger on table "public"."couple_items" to "authenticated";

grant truncate on table "public"."couple_items" to "authenticated";

grant update on table "public"."couple_items" to "authenticated";

grant delete on table "public"."couple_items" to "service_role";

grant insert on table "public"."couple_items" to "service_role";

grant references on table "public"."couple_items" to "service_role";

grant select on table "public"."couple_items" to "service_role";

grant trigger on table "public"."couple_items" to "service_role";

grant truncate on table "public"."couple_items" to "service_role";

grant update on table "public"."couple_items" to "service_role";

grant delete on table "public"."couples" to "anon";

grant insert on table "public"."couples" to "anon";

grant references on table "public"."couples" to "anon";

grant select on table "public"."couples" to "anon";

grant trigger on table "public"."couples" to "anon";

grant truncate on table "public"."couples" to "anon";

grant update on table "public"."couples" to "anon";

grant delete on table "public"."couples" to "authenticated";

grant insert on table "public"."couples" to "authenticated";

grant references on table "public"."couples" to "authenticated";

grant select on table "public"."couples" to "authenticated";

grant trigger on table "public"."couples" to "authenticated";

grant truncate on table "public"."couples" to "authenticated";

grant update on table "public"."couples" to "authenticated";

grant delete on table "public"."couples" to "service_role";

grant insert on table "public"."couples" to "service_role";

grant references on table "public"."couples" to "service_role";

grant select on table "public"."couples" to "service_role";

grant trigger on table "public"."couples" to "service_role";

grant truncate on table "public"."couples" to "service_role";

grant update on table "public"."couples" to "service_role";

grant delete on table "public"."game_scores" to "anon";

grant insert on table "public"."game_scores" to "anon";

grant references on table "public"."game_scores" to "anon";

grant select on table "public"."game_scores" to "anon";

grant trigger on table "public"."game_scores" to "anon";

grant truncate on table "public"."game_scores" to "anon";

grant update on table "public"."game_scores" to "anon";

grant delete on table "public"."game_scores" to "authenticated";

grant insert on table "public"."game_scores" to "authenticated";

grant references on table "public"."game_scores" to "authenticated";

grant select on table "public"."game_scores" to "authenticated";

grant trigger on table "public"."game_scores" to "authenticated";

grant truncate on table "public"."game_scores" to "authenticated";

grant update on table "public"."game_scores" to "authenticated";

grant delete on table "public"."game_scores" to "service_role";

grant insert on table "public"."game_scores" to "service_role";

grant references on table "public"."game_scores" to "service_role";

grant select on table "public"."game_scores" to "service_role";

grant trigger on table "public"."game_scores" to "service_role";

grant truncate on table "public"."game_scores" to "service_role";

grant update on table "public"."game_scores" to "service_role";

grant delete on table "public"."game_sessions" to "anon";

grant insert on table "public"."game_sessions" to "anon";

grant references on table "public"."game_sessions" to "anon";

grant select on table "public"."game_sessions" to "anon";

grant trigger on table "public"."game_sessions" to "anon";

grant truncate on table "public"."game_sessions" to "anon";

grant update on table "public"."game_sessions" to "anon";

grant delete on table "public"."game_sessions" to "authenticated";

grant insert on table "public"."game_sessions" to "authenticated";

grant references on table "public"."game_sessions" to "authenticated";

grant select on table "public"."game_sessions" to "authenticated";

grant trigger on table "public"."game_sessions" to "authenticated";

grant truncate on table "public"."game_sessions" to "authenticated";

grant update on table "public"."game_sessions" to "authenticated";

grant delete on table "public"."game_sessions" to "service_role";

grant insert on table "public"."game_sessions" to "service_role";

grant references on table "public"."game_sessions" to "service_role";

grant select on table "public"."game_sessions" to "service_role";

grant trigger on table "public"."game_sessions" to "service_role";

grant truncate on table "public"."game_sessions" to "service_role";

grant update on table "public"."game_sessions" to "service_role";

grant delete on table "public"."notification_settings" to "anon";

grant insert on table "public"."notification_settings" to "anon";

grant references on table "public"."notification_settings" to "anon";

grant select on table "public"."notification_settings" to "anon";

grant trigger on table "public"."notification_settings" to "anon";

grant truncate on table "public"."notification_settings" to "anon";

grant update on table "public"."notification_settings" to "anon";

grant delete on table "public"."notification_settings" to "authenticated";

grant insert on table "public"."notification_settings" to "authenticated";

grant references on table "public"."notification_settings" to "authenticated";

grant select on table "public"."notification_settings" to "authenticated";

grant trigger on table "public"."notification_settings" to "authenticated";

grant truncate on table "public"."notification_settings" to "authenticated";

grant update on table "public"."notification_settings" to "authenticated";

grant delete on table "public"."notification_settings" to "service_role";

grant insert on table "public"."notification_settings" to "service_role";

grant references on table "public"."notification_settings" to "service_role";

grant select on table "public"."notification_settings" to "service_role";

grant trigger on table "public"."notification_settings" to "service_role";

grant truncate on table "public"."notification_settings" to "service_role";

grant update on table "public"."notification_settings" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."places" to "anon";

grant insert on table "public"."places" to "anon";

grant references on table "public"."places" to "anon";

grant select on table "public"."places" to "anon";

grant trigger on table "public"."places" to "anon";

grant truncate on table "public"."places" to "anon";

grant update on table "public"."places" to "anon";

grant delete on table "public"."places" to "authenticated";

grant insert on table "public"."places" to "authenticated";

grant references on table "public"."places" to "authenticated";

grant select on table "public"."places" to "authenticated";

grant trigger on table "public"."places" to "authenticated";

grant truncate on table "public"."places" to "authenticated";

grant update on table "public"."places" to "authenticated";

grant delete on table "public"."places" to "service_role";

grant insert on table "public"."places" to "service_role";

grant references on table "public"."places" to "service_role";

grant select on table "public"."places" to "service_role";

grant trigger on table "public"."places" to "service_role";

grant truncate on table "public"."places" to "service_role";

grant update on table "public"."places" to "service_role";

grant delete on table "public"."point_history" to "anon";

grant insert on table "public"."point_history" to "anon";

grant references on table "public"."point_history" to "anon";

grant select on table "public"."point_history" to "anon";

grant trigger on table "public"."point_history" to "anon";

grant truncate on table "public"."point_history" to "anon";

grant update on table "public"."point_history" to "anon";

grant delete on table "public"."point_history" to "authenticated";

grant insert on table "public"."point_history" to "authenticated";

grant references on table "public"."point_history" to "authenticated";

grant select on table "public"."point_history" to "authenticated";

grant trigger on table "public"."point_history" to "authenticated";

grant truncate on table "public"."point_history" to "authenticated";

grant update on table "public"."point_history" to "authenticated";

grant delete on table "public"."point_history" to "service_role";

grant insert on table "public"."point_history" to "service_role";

grant references on table "public"."point_history" to "service_role";

grant select on table "public"."point_history" to "service_role";

grant trigger on table "public"."point_history" to "service_role";

grant truncate on table "public"."point_history" to "service_role";

grant update on table "public"."point_history" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."push_subscriptions" to "anon";

grant insert on table "public"."push_subscriptions" to "anon";

grant references on table "public"."push_subscriptions" to "anon";

grant select on table "public"."push_subscriptions" to "anon";

grant trigger on table "public"."push_subscriptions" to "anon";

grant truncate on table "public"."push_subscriptions" to "anon";

grant update on table "public"."push_subscriptions" to "anon";

grant delete on table "public"."push_subscriptions" to "authenticated";

grant insert on table "public"."push_subscriptions" to "authenticated";

grant references on table "public"."push_subscriptions" to "authenticated";

grant select on table "public"."push_subscriptions" to "authenticated";

grant trigger on table "public"."push_subscriptions" to "authenticated";

grant truncate on table "public"."push_subscriptions" to "authenticated";

grant update on table "public"."push_subscriptions" to "authenticated";

grant delete on table "public"."push_subscriptions" to "service_role";

grant insert on table "public"."push_subscriptions" to "service_role";

grant references on table "public"."push_subscriptions" to "service_role";

grant select on table "public"."push_subscriptions" to "service_role";

grant trigger on table "public"."push_subscriptions" to "service_role";

grant truncate on table "public"."push_subscriptions" to "service_role";

grant update on table "public"."push_subscriptions" to "service_role";

grant delete on table "public"."questions" to "anon";

grant insert on table "public"."questions" to "anon";

grant references on table "public"."questions" to "anon";

grant select on table "public"."questions" to "anon";

grant trigger on table "public"."questions" to "anon";

grant truncate on table "public"."questions" to "anon";

grant update on table "public"."questions" to "anon";

grant delete on table "public"."questions" to "authenticated";

grant insert on table "public"."questions" to "authenticated";

grant references on table "public"."questions" to "authenticated";

grant select on table "public"."questions" to "authenticated";

grant trigger on table "public"."questions" to "authenticated";

grant truncate on table "public"."questions" to "authenticated";

grant update on table "public"."questions" to "authenticated";

grant delete on table "public"."questions" to "service_role";

grant insert on table "public"."questions" to "service_role";

grant references on table "public"."questions" to "service_role";

grant select on table "public"."questions" to "service_role";

grant trigger on table "public"."questions" to "service_role";

grant truncate on table "public"."questions" to "service_role";

grant update on table "public"."questions" to "service_role";

grant delete on table "public"."schedules" to "anon";

grant insert on table "public"."schedules" to "anon";

grant references on table "public"."schedules" to "anon";

grant select on table "public"."schedules" to "anon";

grant trigger on table "public"."schedules" to "anon";

grant truncate on table "public"."schedules" to "anon";

grant update on table "public"."schedules" to "anon";

grant delete on table "public"."schedules" to "authenticated";

grant insert on table "public"."schedules" to "authenticated";

grant references on table "public"."schedules" to "authenticated";

grant select on table "public"."schedules" to "authenticated";

grant trigger on table "public"."schedules" to "authenticated";

grant truncate on table "public"."schedules" to "authenticated";

grant update on table "public"."schedules" to "authenticated";

grant delete on table "public"."schedules" to "service_role";

grant insert on table "public"."schedules" to "service_role";

grant references on table "public"."schedules" to "service_role";

grant select on table "public"."schedules" to "service_role";

grant trigger on table "public"."schedules" to "service_role";

grant truncate on table "public"."schedules" to "service_role";

grant update on table "public"."schedules" to "service_role";

grant delete on table "public"."timetable_blocks" to "anon";

grant insert on table "public"."timetable_blocks" to "anon";

grant references on table "public"."timetable_blocks" to "anon";

grant select on table "public"."timetable_blocks" to "anon";

grant trigger on table "public"."timetable_blocks" to "anon";

grant truncate on table "public"."timetable_blocks" to "anon";

grant update on table "public"."timetable_blocks" to "anon";

grant delete on table "public"."timetable_blocks" to "authenticated";

grant insert on table "public"."timetable_blocks" to "authenticated";

grant references on table "public"."timetable_blocks" to "authenticated";

grant select on table "public"."timetable_blocks" to "authenticated";

grant trigger on table "public"."timetable_blocks" to "authenticated";

grant truncate on table "public"."timetable_blocks" to "authenticated";

grant update on table "public"."timetable_blocks" to "authenticated";

grant delete on table "public"."timetable_blocks" to "service_role";

grant insert on table "public"."timetable_blocks" to "service_role";

grant references on table "public"."timetable_blocks" to "service_role";

grant select on table "public"."timetable_blocks" to "service_role";

grant trigger on table "public"."timetable_blocks" to "service_role";

grant truncate on table "public"."timetable_blocks" to "service_role";

grant update on table "public"."timetable_blocks" to "service_role";

grant delete on table "public"."tools" to "anon";

grant insert on table "public"."tools" to "anon";

grant references on table "public"."tools" to "anon";

grant select on table "public"."tools" to "anon";

grant trigger on table "public"."tools" to "anon";

grant truncate on table "public"."tools" to "anon";

grant update on table "public"."tools" to "anon";

grant delete on table "public"."tools" to "authenticated";

grant insert on table "public"."tools" to "authenticated";

grant references on table "public"."tools" to "authenticated";

grant select on table "public"."tools" to "authenticated";

grant trigger on table "public"."tools" to "authenticated";

grant truncate on table "public"."tools" to "authenticated";

grant update on table "public"."tools" to "authenticated";

grant delete on table "public"."tools" to "service_role";

grant insert on table "public"."tools" to "service_role";

grant references on table "public"."tools" to "service_role";

grant select on table "public"."tools" to "service_role";

grant trigger on table "public"."tools" to "service_role";

grant truncate on table "public"."tools" to "service_role";

grant update on table "public"."tools" to "service_role";

grant delete on table "public"."trip_plans" to "anon";

grant insert on table "public"."trip_plans" to "anon";

grant references on table "public"."trip_plans" to "anon";

grant select on table "public"."trip_plans" to "anon";

grant trigger on table "public"."trip_plans" to "anon";

grant truncate on table "public"."trip_plans" to "anon";

grant update on table "public"."trip_plans" to "anon";

grant delete on table "public"."trip_plans" to "authenticated";

grant insert on table "public"."trip_plans" to "authenticated";

grant references on table "public"."trip_plans" to "authenticated";

grant select on table "public"."trip_plans" to "authenticated";

grant trigger on table "public"."trip_plans" to "authenticated";

grant truncate on table "public"."trip_plans" to "authenticated";

grant update on table "public"."trip_plans" to "authenticated";

grant delete on table "public"."trip_plans" to "service_role";

grant insert on table "public"."trip_plans" to "service_role";

grant references on table "public"."trip_plans" to "service_role";

grant select on table "public"."trip_plans" to "service_role";

grant trigger on table "public"."trip_plans" to "service_role";

grant truncate on table "public"."trip_plans" to "service_role";

grant update on table "public"."trip_plans" to "service_role";

grant delete on table "public"."trips" to "anon";

grant insert on table "public"."trips" to "anon";

grant references on table "public"."trips" to "anon";

grant select on table "public"."trips" to "anon";

grant trigger on table "public"."trips" to "anon";

grant truncate on table "public"."trips" to "anon";

grant update on table "public"."trips" to "anon";

grant delete on table "public"."trips" to "authenticated";

grant insert on table "public"."trips" to "authenticated";

grant references on table "public"."trips" to "authenticated";

grant select on table "public"."trips" to "authenticated";

grant trigger on table "public"."trips" to "authenticated";

grant truncate on table "public"."trips" to "authenticated";

grant update on table "public"."trips" to "authenticated";

grant delete on table "public"."trips" to "service_role";

grant insert on table "public"."trips" to "service_role";

grant references on table "public"."trips" to "service_role";

grant select on table "public"."trips" to "service_role";

grant trigger on table "public"."trips" to "service_role";

grant truncate on table "public"."trips" to "service_role";

grant update on table "public"."trips" to "service_role";

grant delete on table "public"."visit_comments" to "anon";

grant insert on table "public"."visit_comments" to "anon";

grant references on table "public"."visit_comments" to "anon";

grant select on table "public"."visit_comments" to "anon";

grant trigger on table "public"."visit_comments" to "anon";

grant truncate on table "public"."visit_comments" to "anon";

grant update on table "public"."visit_comments" to "anon";

grant delete on table "public"."visit_comments" to "authenticated";

grant insert on table "public"."visit_comments" to "authenticated";

grant references on table "public"."visit_comments" to "authenticated";

grant select on table "public"."visit_comments" to "authenticated";

grant trigger on table "public"."visit_comments" to "authenticated";

grant truncate on table "public"."visit_comments" to "authenticated";

grant update on table "public"."visit_comments" to "authenticated";

grant delete on table "public"."visit_comments" to "service_role";

grant insert on table "public"."visit_comments" to "service_role";

grant references on table "public"."visit_comments" to "service_role";

grant select on table "public"."visit_comments" to "service_role";

grant trigger on table "public"."visit_comments" to "service_role";

grant truncate on table "public"."visit_comments" to "service_role";

grant update on table "public"."visit_comments" to "service_role";

grant delete on table "public"."visit_likes" to "anon";

grant insert on table "public"."visit_likes" to "anon";

grant references on table "public"."visit_likes" to "anon";

grant select on table "public"."visit_likes" to "anon";

grant trigger on table "public"."visit_likes" to "anon";

grant truncate on table "public"."visit_likes" to "anon";

grant update on table "public"."visit_likes" to "anon";

grant delete on table "public"."visit_likes" to "authenticated";

grant insert on table "public"."visit_likes" to "authenticated";

grant references on table "public"."visit_likes" to "authenticated";

grant select on table "public"."visit_likes" to "authenticated";

grant trigger on table "public"."visit_likes" to "authenticated";

grant truncate on table "public"."visit_likes" to "authenticated";

grant update on table "public"."visit_likes" to "authenticated";

grant delete on table "public"."visit_likes" to "service_role";

grant insert on table "public"."visit_likes" to "service_role";

grant references on table "public"."visit_likes" to "service_role";

grant select on table "public"."visit_likes" to "service_role";

grant trigger on table "public"."visit_likes" to "service_role";

grant truncate on table "public"."visit_likes" to "service_role";

grant update on table "public"."visit_likes" to "service_role";

grant delete on table "public"."visits" to "anon";

grant insert on table "public"."visits" to "anon";

grant references on table "public"."visits" to "anon";

grant select on table "public"."visits" to "anon";

grant trigger on table "public"."visits" to "anon";

grant truncate on table "public"."visits" to "anon";

grant update on table "public"."visits" to "anon";

grant delete on table "public"."visits" to "authenticated";

grant insert on table "public"."visits" to "authenticated";

grant references on table "public"."visits" to "authenticated";

grant select on table "public"."visits" to "authenticated";

grant trigger on table "public"."visits" to "authenticated";

grant truncate on table "public"."visits" to "authenticated";

grant update on table "public"."visits" to "authenticated";

grant delete on table "public"."visits" to "service_role";

grant insert on table "public"."visits" to "service_role";

grant references on table "public"."visits" to "service_role";

grant select on table "public"."visits" to "service_role";

grant trigger on table "public"."visits" to "service_role";

grant truncate on table "public"."visits" to "service_role";

grant update on table "public"."visits" to "service_role";


  create policy "Couples can view their answers"
  on "public"."answers"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Users can answer for their couple"
  on "public"."answers"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) = writer_id) AND (couple_id = public.get_auth_couple_id())));



  create policy "Users can update their own answers"
  on "public"."answers"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = writer_id));



  create policy "Users can insert their own attendance"
  on "public"."attendances"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own couple's attendances"
  on "public"."attendances"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can view their own items"
  on "public"."couple_items"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Users can update their own couple"
  on "public"."couples"
  as permissive
  for update
  to public
using ((id = public.get_auth_couple_id()));



  create policy "Users can view their own couple"
  on "public"."couples"
  as permissive
  for select
  to public
using ((id = public.get_auth_couple_id()));



  create policy "Users can insert own game scores"
  on "public"."game_scores"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update own game scores"
  on "public"."game_scores"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view relevant game scores"
  on "public"."game_scores"
  as permissive
  for select
  to public
using (((( SELECT auth.uid() AS uid) = user_id) OR (couple_id = ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))))));



  create policy "Users can view own sessions"
  on "public"."game_sessions"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can manage own notification settings"
  on "public"."notification_settings"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can delete own notifications"
  on "public"."notifications"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.profiles recipient
  WHERE ((recipient.id = notifications.user_id) AND (recipient.couple_id = ( SELECT profiles.couple_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))))));



  create policy "Users can update own notifications (mark as read)"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Couples can delete their own places"
  on "public"."places"
  as permissive
  for delete
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can insert their own places"
  on "public"."places"
  as permissive
  for insert
  to public
with check ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can update their own places"
  on "public"."places"
  as permissive
  for update
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can view their own places"
  on "public"."places"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can view their own point history"
  on "public"."point_history"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Profiles are viewable by authenticated users"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Users can insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can manage their own push subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Questions are viewable by everyone"
  on "public"."questions"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Couples can delete their schedules"
  on "public"."schedules"
  as permissive
  for delete
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can update their schedules"
  on "public"."schedules"
  as permissive
  for update
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can view their own schedules"
  on "public"."schedules"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Users can insert schedules for their couple"
  on "public"."schedules"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) = writer_id) AND (couple_id = public.get_auth_couple_id())));



  create policy "couple members can select timetable_blocks"
  on "public"."timetable_blocks"
  as permissive
  for select
  to public
using ((couple_id IN ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));



  create policy "writer can delete timetable_blocks"
  on "public"."timetable_blocks"
  as permissive
  for delete
  to public
using ((writer_id = auth.uid()));



  create policy "writer can insert timetable_blocks"
  on "public"."timetable_blocks"
  as permissive
  for insert
  to public
with check (((writer_id = auth.uid()) AND (couple_id IN ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "writer can update timetable_blocks"
  on "public"."timetable_blocks"
  as permissive
  for update
  to public
using ((writer_id = auth.uid()));



  create policy "Couples can delete their own tools"
  on "public"."tools"
  as permissive
  for delete
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can insert their own tools"
  on "public"."tools"
  as permissive
  for insert
  to public
with check ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can update their own tools"
  on "public"."tools"
  as permissive
  for update
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Couples can view their own tools"
  on "public"."tools"
  as permissive
  for select
  to public
using ((couple_id = public.get_auth_couple_id()));



  create policy "Users can delete their couple's trip plans"
  on "public"."trip_plans"
  as permissive
  for delete
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE (trips.couple_id IN ( SELECT profiles.couple_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));



  create policy "Users can insert their couple's trip plans"
  on "public"."trip_plans"
  as permissive
  for insert
  to public
with check ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE (trips.couple_id IN ( SELECT profiles.couple_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));



  create policy "Users can update their couple's trip plans"
  on "public"."trip_plans"
  as permissive
  for update
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE (trips.couple_id IN ( SELECT profiles.couple_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));



  create policy "Users can view their couple's trip plans"
  on "public"."trip_plans"
  as permissive
  for select
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE (trips.couple_id IN ( SELECT profiles.couple_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));



  create policy "Users can delete their couple's trips"
  on "public"."trips"
  as permissive
  for delete
  to public
using ((couple_id IN ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can insert their couple's trips"
  on "public"."trips"
  as permissive
  for insert
  to public
with check ((couple_id IN ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can update their couple's trips"
  on "public"."trips"
  as permissive
  for update
  to public
using ((couple_id IN ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can view their couple's trips"
  on "public"."trips"
  as permissive
  for select
  to public
using ((couple_id IN ( SELECT profiles.couple_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "Couples can view comments for their visits"
  on "public"."visit_comments"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.visits v
     JOIN public.places p ON ((v.place_id = p.id)))
  WHERE ((v.id = visit_comments.visit_id) AND (p.couple_id = public.get_auth_couple_id())))));



  create policy "Users can insert comments for their couple's visits"
  on "public"."visit_comments"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) = writer_id) AND (EXISTS ( SELECT 1
   FROM (public.visits v
     JOIN public.places p ON ((v.place_id = p.id)))
  WHERE ((v.id = visit_comments.visit_id) AND (p.couple_id = public.get_auth_couple_id()))))));



  create policy "Writers can delete their own comments"
  on "public"."visit_comments"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = writer_id));



  create policy "Couples can view likes for their visits"
  on "public"."visit_likes"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.visits v
     JOIN public.places p ON ((v.place_id = p.id)))
  WHERE ((v.id = visit_likes.visit_id) AND (p.couple_id = public.get_auth_couple_id())))));



  create policy "Users can manage their own likes"
  on "public"."visit_likes"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Couples can insert visits for their places"
  on "public"."visits"
  as permissive
  for insert
  to public
with check ((place_id IN ( SELECT places.id
   FROM public.places
  WHERE (places.couple_id = public.get_auth_couple_id()))));



  create policy "Couples can update visits for their places"
  on "public"."visits"
  as permissive
  for update
  to public
using ((place_id IN ( SELECT places.id
   FROM public.places
  WHERE (places.couple_id = public.get_auth_couple_id()))));



  create policy "Couples can view visits for their places"
  on "public"."visits"
  as permissive
  for select
  to public
using ((place_id IN ( SELECT places.id
   FROM public.places
  WHERE (places.couple_id = public.get_auth_couple_id()))));



  create policy "Writers can delete their own visits"
  on "public"."visits"
  as permissive
  for delete
  to public
using (((writer_id = auth.uid()) OR ((writer_id IS NULL) AND (place_id IN ( SELECT places.id
   FROM public.places
  WHERE (places.couple_id = public.get_auth_couple_id()))))));


CREATE TRIGGER tr_add_points_on_answer AFTER INSERT ON public.answers FOR EACH ROW EXECUTE FUNCTION public.add_couple_points();

CREATE TRIGGER tr_notify_answer AFTER INSERT ON public.answers FOR EACH ROW EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER tr_add_points_on_attendance AFTER INSERT ON public.attendances FOR EACH ROW EXECUTE FUNCTION public.add_couple_points();

CREATE TRIGGER "send-push-notification" AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://daliary.vercel.app/api/push', 'POST', '{"Content-type":"application/json","Authorization":"Bearer 5ae35e1a96e76f5bfd22424ba85ecedb75fc700970a4bf69d186aca63a71ab65"}', '{}', '5000');

CREATE TRIGGER tr_request_push_notification AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.request_push_notification();

CREATE TRIGGER tr_add_points_on_wishlist AFTER INSERT ON public.places FOR EACH ROW EXECUTE FUNCTION public.add_couple_points();

CREATE TRIGGER tr_notify_place AFTER INSERT ON public.places FOR EACH ROW EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER tr_notify_point_history AFTER INSERT ON public.point_history FOR EACH ROW EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER on_auth_user_created_notification AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_settings();

CREATE TRIGGER on_profile_avatar_updated AFTER UPDATE OF avatar_url ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_profile_updated();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_notify_schedule AFTER INSERT OR DELETE OR UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER timetable_blocks_updated_at BEFORE UPDATE ON public.timetable_blocks FOR EACH ROW EXECUTE FUNCTION public.handle_timetable_updated_at();

CREATE TRIGGER tr_trip_plans_updated_at BEFORE UPDATE ON public.trip_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_notify_trip AFTER INSERT OR DELETE OR UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER tr_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_visit_comment_added AFTER INSERT ON public.visit_comments FOR EACH ROW EXECUTE FUNCTION public.notify_comment_added();

CREATE TRIGGER tr_add_points_on_visit_comment AFTER INSERT ON public.visit_comments FOR EACH ROW EXECUTE FUNCTION public.add_couple_points();

CREATE TRIGGER tr_add_points_on_visit AFTER INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION public.add_couple_points();

CREATE TRIGGER tr_notify_visit AFTER INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Anyone can view images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'diary-images'::text));



  create policy "Anyone can view visit photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'visit-photos'::text));



  create policy "Authenticated users can upload images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'diary-images'::text));



  create policy "Authenticated users can upload visit photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'visit-photos'::text));



  create policy "Users can delete their own images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = owner));



  create policy "Users can delete their own visit photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = owner));



  create policy "Users can update their own images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((auth.uid() = owner))
with check ((bucket_id = 'diary-images'::text));



