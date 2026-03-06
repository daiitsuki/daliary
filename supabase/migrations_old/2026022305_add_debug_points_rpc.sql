-- Migration: 2026022305_add_debug_points_rpc.sql

-- ==========================================
-- Secure function to add points via Developer Mode
-- Uses security definer to bypass direct table RLS for this specific logic
-- ==========================================
create or replace function public.add_debug_points(p_points int, p_description text)
returns json language plpgsql security definer
set search_path = public
as $$
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
$$;
