-- Migration: Add function to get both cumulative and current points
create or replace function public.get_couple_points_summary(target_couple_id uuid)
returns json language plpgsql security definer
set search_path = public
as $$
declare
  cumulative_pts bigint;
  current_pts bigint;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and couple_id = target_couple_id) then
    raise exception 'Access denied';
  end if;

  select 
    coalesce(sum(case when points > 0 then points else 0 end), 0),
    coalesce(sum(points), 0)
  into cumulative_pts, current_pts
  from public.point_history
  where couple_id = target_couple_id;
  
  return json_build_object(
    'cumulative_points', cumulative_pts,
    'current_points', current_pts
  );
end;
$$;
