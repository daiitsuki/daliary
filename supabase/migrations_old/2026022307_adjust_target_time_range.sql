-- Migration: 2026022307_adjust_target_time_range.sql

-- ==========================================
-- Update Target Time Range to 15 - 20 seconds
-- ==========================================
create or replace function public.start_blind_timer_game()
returns json language plpgsql security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_session_id uuid;
  v_target_time int;
  v_ticket_count int;
  v_item_type text := 'blind_timer_ticket';
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NO_COUPLE');
  end if;

  -- 1. Check for Ticket
  select quantity into v_ticket_count
  from public.couple_items
  where couple_id = v_couple_id and item_type = v_item_type;

  if v_ticket_count is null or v_ticket_count <= 0 then
    return json_build_object('success', false, 'error', 'NO_TICKET');
  end if;

  -- 2. Consume Ticket
  update public.couple_items
  set quantity = quantity - 1, updated_at = now()
  where couple_id = v_couple_id and item_type = v_item_type
  returning quantity into v_ticket_count;

  -- 3. Generate New Range (15.00 - 20.00 integer seconds)
  -- floor(random() * 6) gives 0-5. Adding 15 gives 15-20.
  v_target_time := floor(random() * 6) + 15;

  -- 4. Create Session
  insert into public.game_sessions (couple_id, user_id, game_type, target_time)
  values (v_couple_id, v_user_id, 'blind_timer', v_target_time)
  returning id into v_session_id;

  return json_build_object(
    'success', true, 
    'session_id', v_session_id, 
    'target_time', v_target_time,
    'remaining_tickets', v_ticket_count
  );
end;
$$;
