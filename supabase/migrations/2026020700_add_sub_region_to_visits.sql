-- Add sub_region column to visits table
ALTER TABLE public.visits ADD COLUMN sub_region text;

-- Update verify_visit RPC to include sub_region
CREATE OR REPLACE FUNCTION public.verify_visit(
  p_place_id uuid,
  p_visited_at date,
  p_image_url text,
  p_comment text,
  p_region text,
  p_sub_region text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.places WHERE id = p_place_id;
  
  IF v_couple_id IS NULL OR v_couple_id != (SELECT couple_id FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to verify this visit.';
  END IF;

  INSERT INTO public.visits (place_id, visited_at, image_url, comment, region, sub_region) 
  VALUES (p_place_id, p_visited_at, p_image_url, p_comment, p_region, p_sub_region);
  
  UPDATE public.places SET status = 'visited', updated_at = NOW() WHERE id = p_place_id;
END;
$$;
