-- Migration: 2026022304_purchase_limit_system.sql

-- ==========================================
-- 1. Table Evolution: Track user in point history
-- ==========================================
alter table public.point_history 
add column if not exists user_id uuid references public.profiles(id) on delete set null;

-- ==========================================
-- 2. Updated Purchase Item RPC with Daily Limit
-- ==========================================
create or replace function public.purchase_item(
  p_item_type text,
  p_price int,
  p_description text
)
returns json language plpgsql security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_user_id uuid;
  v_current_points bigint;
  v_new_quantity int;
  v_already_purchased boolean;
begin
  v_user_id := auth.uid();
  v_couple_id := get_auth_couple_id();
  
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  -- [NEW] Daily Limit Check for Blind Timer Ticket (1 per person per day)
  if p_item_type = 'blind_timer_ticket' then
    select exists (
      select 1 from public.point_history 
      where user_id = v_user_id 
        and type = 'purchase_blind_timer_ticket'
        and created_at::date = (current_timestamp at time zone 'Asia/Seoul')::date
    ) into v_already_purchased;

    if v_already_purchased then
      return json_build_object('success', false, 'error', 'DAILY_LIMIT_REACHED');
    end if;
  end if;

  -- Points Check
  select current_points into v_current_points
  from public.get_couple_points_summary(v_couple_id);

  if v_current_points < p_price then
    return json_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  end if;

  -- Record in Point History (with user_id)
  insert into public.point_history (couple_id, user_id, type, points, description)
  values (v_couple_id, v_user_id, 'purchase_' || p_item_type, -p_price, p_description);

  -- Update/Insert into Inventory
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
end;
$$;
