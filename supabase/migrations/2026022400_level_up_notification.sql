-- Action: Trigger Level Up Notification
create or replace function public.trigger_level_up_notification(p_level int)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Insert a 0-point entry to trigger handle_notification_trigger
  insert into public.point_history (couple_id, type, points, description)
  values (v_couple_id, 'level_up', 0, '커플 레벨 ' || p_level || ' 달성!');
end;
$$;
