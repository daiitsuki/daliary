create or replace function get_couple_total_points(target_couple_id uuid)
returns bigint language plpgsql as $$
declare
  total bigint;
begin
  -- Ensure the user belongs to the couple (RLS check equivalent)
  if not exists (select 1 from public.profiles where id = auth.uid() and couple_id = target_couple_id) then
    raise exception 'Access denied';
  end if;

  select coalesce(sum(points), 0) into total
  from public.point_history
  where couple_id = target_couple_id;
  
  return total;
end;
$$;
