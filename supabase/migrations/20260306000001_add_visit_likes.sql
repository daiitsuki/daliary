-- Create visit_likes table
CREATE TABLE IF NOT EXISTS public.visit_likes (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now(),
    "visit_id" uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE("visit_id", "user_id")
);

-- Enable RLS
ALTER TABLE public.visit_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Couples can view likes for their visits" ON public.visit_likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.visits v
            JOIN public.places p ON v.place_id = p.id
            WHERE v.id = public.visit_likes.visit_id 
            AND p.couple_id = get_auth_couple_id()
        )
    );

CREATE POLICY "Users can manage their own likes" ON public.visit_likes
    FOR ALL USING (auth.uid() = user_id);

-- RPC to toggle like
CREATE OR REPLACE FUNCTION public.toggle_visit_like(p_visit_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
