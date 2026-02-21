-- Migration: Fix get_couple_points_summary to return a table and fix purchase_item RPC
-- Date: 2026-02-21
-- Description: 
-- 1. Redefines get_couple_points_summary to return TABLE instead of JSON for better SQL compatibility.
-- 2. Redefines purchase_item to ensure compatibility with the updated function.

-- 1. Redefine get_couple_points_summary
-- First drop the old function to change return type
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

-- 2. Redefine purchase_item to ensure it works with the table return
-- This overrides the version in 2026022101
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
  -- Get auth couple id
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  -- Check current points using the table-returning function
  SELECT current_points INTO v_current_points
  FROM public.get_couple_points_summary(v_couple_id);

  if v_current_points < p_price then
    return json_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  end if;

  -- 1. Deduct points (insert into point_history)
  insert into public.point_history (couple_id, type, points, description)
  values (v_couple_id, 'purchase_' || p_item_type, -p_price, p_description);

  -- 2. Add item (upsert into couple_items)
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
END;
$$;
