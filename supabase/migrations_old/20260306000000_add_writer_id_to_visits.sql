-- Add writer_id to visits table
ALTER TABLE public.visits ADD COLUMN writer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_visits_writer_id ON public.visits(writer_id);

-- Update verify_visit function to store the writer's ID
CREATE OR REPLACE FUNCTION "public"."verify_visit"("p_place_id" "uuid", "p_visited_at" "date", "p_image_url" "text", "p_comment" "text", "p_region" "text", "p_sub_region" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;
