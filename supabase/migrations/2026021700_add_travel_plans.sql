
-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trip_plans table
CREATE TABLE IF NOT EXISTS public.trip_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'restaurant', 'transport', 'cafe', 'accommodation', 'etc'
    start_time TIME,
    end_time TIME,
    memo TEXT,
    place_name TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trips
CREATE POLICY "Users can view their couple's trips"
    ON public.trips FOR SELECT
    USING (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their couple's trips"
    ON public.trips FOR INSERT
    WITH CHECK (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their couple's trips"
    ON public.trips FOR UPDATE
    USING (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their couple's trips"
    ON public.trips FOR DELETE
    USING (couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for trip_plans
CREATE POLICY "Users can view their couple's trip plans"
    ON public.trip_plans FOR SELECT
    USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert their couple's trip plans"
    ON public.trip_plans FOR INSERT
    WITH CHECK (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can update their couple's trip plans"
    ON public.trip_plans FOR UPDATE
    USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can delete their couple's trip plans"
    ON public.trip_plans FOR DELETE
    USING (trip_id IN (SELECT id FROM public.trips WHERE couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())));

-- Update notification trigger to handle trips
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
    v_my_nickname TEXT;
    v_couple_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_type TEXT;
BEGIN
    -- Get current user info
    SELECT nickname, couple_id INTO v_my_nickname, v_couple_id 
    FROM public.profiles WHERE id = auth.uid();

    -- Find partner ID
    SELECT id INTO v_partner_id 
    FROM public.profiles 
    WHERE couple_id = v_couple_id AND id != auth.uid()
    LIMIT 1;

    IF v_partner_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    -- CASE 1: Answers
    IF (TG_TABLE_NAME = 'answers') THEN
        v_type := 'question_answered';
        v_title := '오늘의 질문 답변 완료';
        v_content := v_my_nickname || '님이 오늘의 질문에 답변했어요!';
        
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 2: Schedules
    ELSIF (TG_TABLE_NAME = 'schedules') THEN
        v_type := 'schedule_change';
        v_title := '일정 소식';
        IF (TG_OP = 'INSERT') THEN
            v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 추가했어요!';
        ELSIF (TG_OP = 'UPDATE') THEN
            v_content := v_my_nickname || '님이 ' || to_char(NEW.start_date, 'MM') || '월 일정을 수정했어요!';
        ELSIF (TG_OP = 'DELETE') THEN
            v_content := v_my_nickname || '님이 ' || to_char(OLD.start_date, 'MM') || '월 일정을 삭제했어요!';
        END IF;

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 3: Places
    ELSIF (TG_TABLE_NAME = 'places' AND NEW.status = 'wishlist') THEN
        v_type := 'place_added';
        v_title := '새로운 장소';
        v_content := v_my_nickname || '님이 새로운 가고 싶은 곳을 추가했어요!';

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 4: Visits
    ELSIF (TG_TABLE_NAME = 'visits') THEN
        v_type := 'visit_verified';
        v_title := '방문 인증 완료';
        v_content := NEW.region || '의 방문 인증이 완료되었어요!';

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);

    -- CASE 5: Level Up
    ELSIF (TG_TABLE_NAME = 'point_history' AND NEW.type = 'level_up') THEN
        v_type := 'level_up';
        v_title := '레벨 업! 🎉';
        v_content := '커플 레벨이 올랐어요! 축하합니다!';

        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        INSERT INTO public.notifications (user_id, couple_id, type, title, content)
        VALUES (auth.uid(), v_couple_id, v_type, v_title, v_content);

    -- CASE 6: Trips (NEW)
    ELSIF (TG_TABLE_NAME = 'trips') THEN
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

            INSERT INTO public.notifications (user_id, couple_id, type, title, content)
            VALUES (v_partner_id, v_couple_id, v_type, v_title, v_content);
        END;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for trips
DROP TRIGGER IF EXISTS tr_notify_trip ON public.trips;
CREATE TRIGGER tr_notify_trip AFTER INSERT OR UPDATE OR DELETE ON public.trips FOR EACH ROW EXECUTE PROCEDURE handle_notification_trigger();

-- Add updated_at trigger for trips
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER tr_trip_plans_updated_at BEFORE UPDATE ON public.trip_plans FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
