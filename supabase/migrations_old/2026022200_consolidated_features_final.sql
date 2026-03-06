-- ==========================================
-- Migration: Consolidated Features & Fixes (Final Version)
-- Date: 2026-02-22
-- Includes: Migrations 2026021900 to 2026022104
-- ==========================================

-- 1. Table & Column Updates
-- Add missing notification settings columns
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS notify_trip_change BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_item_purchased BOOLEAN DEFAULT TRUE;

-- Ensure old/removed columns are gone
ALTER TABLE public.notification_settings 
DROP COLUMN IF EXISTS notify_visit_comment;

-- Create couple_items table
CREATE TABLE IF NOT EXISTS public.couple_items (
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  quantity int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (couple_id, item_type)
);

-- Enable RLS for couple_items
ALTER TABLE public.couple_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for couple_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'couple_items' AND policyname = 'Couples can view their own items') THEN
        CREATE POLICY "Couples can view their own items" ON public.couple_items
        FOR SELECT USING ( couple_id = get_auth_couple_id() );
    END IF;
END $$;


-- 2. Point & Shop RPC Functions
-- Redefine get_couple_points_summary to return TABLE (for better SQL compatibility)
DROP FUNCTION IF EXISTS public.get_couple_points_summary(uuid);
CREATE OR REPLACE FUNCTION public.get_couple_points_summary(target_couple_id uuid)
RETURNS TABLE (
  cumulative_points bigint,
  current_points bigint
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- purchase_item: Atomic point deduction and item provision
CREATE OR REPLACE FUNCTION public.purchase_item(
  p_item_type text,
  p_price int,
  p_description text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_current_points bigint;
  v_new_quantity int;
BEGIN
  v_couple_id := get_auth_couple_id();
  IF v_couple_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Check current points
  SELECT current_points INTO v_current_points
  FROM public.get_couple_points_summary(v_couple_id);

  IF v_current_points < p_price THEN
    RETURN json_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  END IF;

  -- 1. Deduct points
  INSERT INTO public.point_history (couple_id, type, points, description)
  VALUES (v_couple_id, 'purchase_' || p_item_type, -p_price, p_description);

  -- 2. Add item
  INSERT INTO public.couple_items (couple_id, item_type, quantity)
  VALUES (v_couple_id, p_item_type, 1)
  ON CONFLICT (couple_id, item_type)
  DO UPDATE SET 
    quantity = couple_items.quantity + 1,
    updated_at = now()
  RETURNING quantity INTO v_new_quantity;

  RETURN json_build_object(
    'success', true, 
    'new_quantity', v_new_quantity,
    'remaining_points', v_current_points - p_price
  );
END;
$$;

-- use_item: Atomic item consumption
CREATE OR REPLACE FUNCTION public.use_item(
  p_item_type text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_current_quantity int;
BEGIN
  v_couple_id := get_auth_couple_id();
  IF v_couple_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT quantity INTO v_current_quantity
  FROM public.couple_items
  WHERE couple_id = v_couple_id AND item_type = p_item_type;

  IF v_current_quantity IS NULL OR v_current_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'NO_ITEMS_LEFT');
  END IF;

  UPDATE public.couple_items
  SET quantity = quantity - 1, updated_at = now()
  WHERE couple_id = v_couple_id AND item_type = p_item_type
  RETURNING quantity INTO v_current_quantity;

  RETURN json_build_object('success', true, 'new_quantity', v_current_quantity);
END;
$$;


-- 3. Core Logic Functions (Foundation)
-- get_app_init_data: Unified data fetching for app boot
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_couple record;
  v_member_count int;
  v_notif_settings record;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  -- 1. Profile
  SELECT id, nickname, avatar_url, couple_id, last_active_at INTO v_profile 
  FROM public.profiles WHERE id = v_user_id;
  
  IF v_profile.id IS NULL THEN RETURN NULL; END IF;

  -- 2. Couple
  IF v_profile.couple_id IS NOT NULL THEN
    SELECT id, created_at, anniversary_date, invite_code INTO v_couple 
    FROM public.couples WHERE id = v_profile.couple_id;

    SELECT count(*) INTO v_member_count FROM public.profiles WHERE couple_id = v_profile.couple_id;
  ELSE
    v_couple := NULL;
    v_member_count := 0;
  END IF;

  -- 3. Notification Settings (Latest version with all required columns)
  SELECT 
    is_enabled, 
    notify_question_answered, 
    notify_question_request, 
    notify_schedule_change, 
    notify_place_added, 
    notify_visit_verified, 
    notify_level_up,
    notify_trip_change,
    notify_item_purchased
  INTO v_notif_settings 
  FROM public.notification_settings WHERE user_id = v_user_id;
  
  IF v_notif_settings IS NULL THEN
    INSERT INTO public.notification_settings (user_id) VALUES (v_user_id)
    RETURNING 
        is_enabled, 
        notify_question_answered, 
        notify_question_request, 
        notify_schedule_change, 
        notify_place_added, 
        notify_visit_verified, 
        notify_level_up,
        notify_trip_change,
        notify_item_purchased
    INTO v_notif_settings;
  END IF;

  v_result := json_build_object(
    'profile', row_to_json(v_profile),
    'couple', row_to_json(v_couple),
    'is_couple_formed', (v_member_count >= 2),
    'notification_settings', row_to_json(v_notif_settings)
  );

  RETURN v_result;
END;
$$;


-- 4. Trigger Functions (Safety & Points)
-- add_couple_points: Updated with 30pts for answers and defensive column access
CREATE OR REPLACE FUNCTION public.add_couple_points()
RETURNS TRIGGER AS $$
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
    -- Defensive check for status column
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- handle_notification_trigger: Updated with purchase notification and defensive field access
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
    v_my_nickname TEXT;
    v_couple_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_type TEXT;
    v_settings RECORD;
    v_should_notify BOOLEAN;
BEGIN
    -- Get sender info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- Find partner
    SELECT id INTO v_partner_id 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- Fetch recipient's settings
    SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = v_partner_id;
    
    IF v_settings IS NULL THEN
        v_should_notify := TRUE;
    ELSE
        v_should_notify := v_settings.is_enabled;
    END IF;

    IF v_should_notify = FALSE THEN RETURN COALESCE(NEW, OLD); END IF;

    v_should_notify := FALSE;

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        IF v_settings.notify_question_answered THEN
            v_type := 'question_answered';
            v_title := '오늘의 질문 답변 완료';
            v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        IF v_settings.notify_schedule_change THEN
            v_type := 'schedule_change';
            v_title := '일정 소식';
            IF (TG_OP = 'INSERT') THEN
                v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
            ELSIF (TG_OP = 'UPDATE') THEN
                v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
            ELSIF (TG_OP = 'DELETE') THEN
                v_content := v_my_nickname || '님이 ' || to_char(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
            END IF;
            v_should_notify := TRUE;
        END IF;

    -- CASE 3: Places (Defensive check for status)
    ELSIF (TG_TABLE_NAME = 'places') THEN
        IF NEW.status = 'wishlist' THEN
            IF v_settings.notify_place_added THEN
                v_type := 'place_added';
                v_title := '새로운 장소';
                v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';
                v_should_notify := TRUE;
            END IF;
        END IF;

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        IF v_settings.notify_visit_verified THEN
            v_type := 'visit_verified';
            v_title := '방문 인증 완료';
            v_content := NEW.region || '의 방문 인증이 완료되었어요!';
            v_should_notify := TRUE;
        END IF;

    -- CASE 5: Point History (Level Up or Item Purchase)
    ELSIF (TG_TABLE_NAME = 'point_history') THEN
        IF NEW.type = 'level_up' THEN
            IF v_settings.notify_level_up THEN
                v_type := 'level_up';
                v_title := '레벨 업! 🎉';
                v_content := '커플 레벨이 올랐어요! 축하합니다!';
                v_should_notify := TRUE;
            END IF;
        ELSIF NEW.type LIKE 'purchase_%' THEN
            IF v_settings.notify_item_purchased THEN
                v_type := 'item_purchased';
                v_title := '아이템 구매 소식';
                v_content := v_my_nickname || '님이 ' || REPLACE(NEW.description, ' 구매', '') || '을 구매하였습니다. 보관함을 확인해보세요.';
                v_should_notify := TRUE;
            END IF;
        END IF;

    -- CASE 6: Trips
    ELSIF (TG_TABLE_NAME = 'trips') THEN
        IF v_settings.notify_trip_change THEN
            v_type := 'trip_change';
            v_title := '여행 계획 소식';
            DECLARE
                v_date_range TEXT;
                v_target_row RECORD;
            BEGIN
                v_target_row := COALESCE(NEW, OLD);
                v_date_range := to_char(v_target_row.start_date, 'MM.DD') || '~' || to_char(v_target_row.end_date, 'MM.DD');
                
                IF (TG_OP = 'INSERT') THEN
                    v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 추가했어요!';
                ELSIF (TG_OP = 'UPDATE') THEN
                    v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 수정했어요!';
                ELSIF (TG_OP = 'DELETE') THEN
                    v_content := v_my_nickname || '님이 ' || v_date_range || '의 여행 계획을 삭제했어요!';
                END IF;
                v_should_notify := TRUE;
            END;
        END IF;
    END IF;

    -- Final Notification Insert
    IF v_should_notify THEN
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        
        IF v_type = 'level_up' THEN
            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (auth.uid(), v_couple_id, v_type, v_title, v_content);
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Final Trigger & Sync
-- Point History Notification Trigger
DROP TRIGGER IF EXISTS tr_notify_point_history ON public.point_history;
CREATE TRIGGER tr_notify_point_history
AFTER INSERT ON public.point_history
FOR EACH ROW EXECUTE PROCEDURE handle_notification_trigger();

-- Ensure old Visit Comment trigger is cleaned up
DROP TRIGGER IF EXISTS tr_notify_visit_comment ON public.visit_comments;
