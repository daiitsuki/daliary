-- Migration: Add Relay Novels
-- Create tables, indexes, triggers, and update get_home_data RPC

-- 1. Create relay_novels table
CREATE TABLE IF NOT EXISTS public.relay_novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
    turn_count INTEGER NOT NULL DEFAULT 0,
    last_turn_content TEXT,
    last_turn_author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create relay_novel_turns table
CREATE TABLE IF NOT EXISTS public.relay_novel_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID NOT NULL REFERENCES public.relay_novels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_relay_novels_couple_id_status ON public.relay_novels(couple_id, status);
CREATE INDEX IF NOT EXISTS idx_relay_novel_turns_novel_id_created_at ON public.relay_novel_turns(novel_id, created_at);

-- 4. Enable RLS
ALTER TABLE public.relay_novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_novel_turns ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for relay_novels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novels' AND policyname = 'Users can view their couple''s novels') THEN
        CREATE POLICY "Users can view their couple's novels" 
            ON public.relay_novels FOR SELECT 
            USING (couple_id = (
                SELECT couple_id FROM public.profiles 
                WHERE id = auth.uid()
            ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novels' AND policyname = 'Users can insert their couple''s novels') THEN
        CREATE POLICY "Users can insert their couple's novels" 
            ON public.relay_novels FOR INSERT 
            WITH CHECK (couple_id = (
                SELECT couple_id FROM public.profiles 
                WHERE id = auth.uid()
            ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novels' AND policyname = 'Users can update their couple''s novels') THEN
        CREATE POLICY "Users can update their couple's novels" 
            ON public.relay_novels FOR UPDATE 
            USING (couple_id = (
                SELECT couple_id FROM public.profiles 
                WHERE id = auth.uid()
            ));
    END IF;
END $$;

-- 6. RLS Policies for relay_novel_turns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novel_turns' AND policyname = 'Users can view their couple''s novel turns') THEN
        CREATE POLICY "Users can view their couple's novel turns" 
            ON public.relay_novel_turns FOR SELECT 
            USING (novel_id IN (
                SELECT id FROM public.relay_novels WHERE couple_id = (
                    SELECT couple_id FROM public.profiles 
                    WHERE id = auth.uid()
                )
            ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novel_turns' AND policyname = 'Users can insert their couple''s novel turns') THEN
        CREATE POLICY "Users can insert their couple's novel turns" 
            ON public.relay_novel_turns FOR INSERT 
            WITH CHECK (novel_id IN (
                SELECT id FROM public.relay_novels WHERE couple_id = (
                    SELECT couple_id FROM public.profiles 
                    WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

-- 7. Trigger Function
CREATE OR REPLACE FUNCTION public.update_relay_novel_stats()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT turn_count INTO current_count FROM public.relay_novels WHERE id = NEW.novel_id;
    
    IF current_count >= 100 THEN
        RAISE EXCEPTION 'This novel has already reached the maximum of 100 turns.';
    END IF;

    UPDATE public.relay_novels
    SET 
        turn_count = turn_count + 1,
        last_turn_content = NEW.content,
        last_turn_author_id = NEW.author_id,
        updated_at = now(),
        status = CASE WHEN (turn_count + 1) >= 100 THEN 'completed' ELSE status END
    WHERE id = NEW.novel_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create Trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'relay_novel_turn_insert_trigger') THEN
        CREATE TRIGGER relay_novel_turn_insert_trigger
        AFTER INSERT ON public.relay_novel_turns
        FOR EACH ROW
        EXECUTE FUNCTION public.update_relay_novel_stats();
    END IF;
END $$;

-- 9. Update get_home_data RPC to include ongoing_relay_novel
CREATE OR REPLACE FUNCTION public.get_home_data(timezone_offset_hours integer DEFAULT 9)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_couple_id uuid;
  v_profiles json := '[]'::json;
  v_question record;
  v_answers json := '[]'::json;
  v_drawing_answers json := '[]'::json;
  v_ongoing_relay_novel record;
  v_today date;
  v_has_my_drawing boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get couple_id for the user
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = v_user_id;
  
  IF v_couple_id IS NULL THEN
    RETURN json_build_object(
       'profiles', '[]'::json,
       'question', null,
       'answers', '[]'::json,
       'drawing_answers', '[]'::json,
       'ongoing_relay_novel', null
    );
  END IF;

  -- 1. Profiles
  SELECT json_agg(row_to_json(p)) INTO v_profiles 
  FROM (
    SELECT id, nickname, avatar_url, last_active_at 
    FROM public.profiles 
    WHERE couple_id = v_couple_id
  ) p;
  
  -- 2. Today's date (KST default)
  v_today := (now() AT TIME ZONE 'UTC' + (timezone_offset_hours || ' hours')::interval)::date;
  
  -- 3. Today's Question
  SELECT id, content INTO v_question 
  FROM public.questions 
  WHERE publish_date = v_today 
  LIMIT 1;
  
  IF v_question.id IS NOT NULL THEN
    -- 4. Answers
    SELECT json_agg(row_to_json(a)) INTO v_answers
    FROM (
      SELECT id, content, writer_id, created_at 
      FROM public.answers 
      WHERE couple_id = v_couple_id AND question_id = v_question.id
    ) a;
  END IF;
  
  -- 5. Drawing Answers
  SELECT EXISTS (
    SELECT 1 FROM public.drawing_answers 
    WHERE couple_id = v_couple_id AND question_date = v_today AND writer_id = v_user_id
  ) INTO v_has_my_drawing;

  SELECT json_agg(row_to_json(d)) INTO v_drawing_answers
  FROM (
    SELECT 
      id, couple_id, writer_id, question_date, question_text, 
      CASE 
        WHEN writer_id = v_user_id THEN image_url 
        WHEN v_has_my_drawing THEN image_url 
        ELSE 'hidden' 
      END as image_url,
      created_at
    FROM public.drawing_answers 
    WHERE couple_id = v_couple_id AND question_date = v_today
  ) d;

  -- 6. Ongoing Relay Novel
  SELECT id, title, turn_count, last_turn_content, last_turn_author_id, updated_at INTO v_ongoing_relay_novel
  FROM public.relay_novels
  WHERE couple_id = v_couple_id AND status = 'ongoing'
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN json_build_object(
     'profiles', COALESCE(v_profiles, '[]'::json),
     'question', CASE WHEN v_question.id IS NOT NULL THEN row_to_json(v_question) ELSE null END,
     'answers', COALESCE(v_answers, '[]'::json),
     'drawing_answers', COALESCE(v_drawing_answers, '[]'::json),
     'ongoing_relay_novel', CASE WHEN v_ongoing_relay_novel.id IS NOT NULL THEN row_to_json(v_ongoing_relay_novel) ELSE null END
  );
END;
$function$;
