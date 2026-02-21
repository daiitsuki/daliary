-- 1. Create couple_items table
create table if not exists public.couple_items (
  couple_id uuid not null references public.couples(id) on delete cascade,
  item_type text not null,
  quantity int not null default 0,
  updated_at timestamptz default now(),
  primary key (couple_id, item_type)
);

-- 2. Enable RLS
alter table public.couple_items enable row level security;

-- 3. RLS Policies
create policy "Couples can view their own items" on public.couple_items
  for select using ( couple_id = get_auth_couple_id() );

-- 4. RPC: purchase_item
-- Atomically deducts points and adds item to couple_items
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
  v_current_points int;
  v_new_quantity int;
begin
  -- Get auth couple id
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  -- Check current points
  select current_points into v_current_points
  from get_couple_points_summary(v_couple_id);

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
end;
$$;

-- 5. RPC: use_item
-- Decrements item quantity
create or replace function public.use_item(
  p_item_type text
)
returns json language plpgsql security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_current_quantity int;
begin
  v_couple_id := get_auth_couple_id();
  if v_couple_id is null then
    return json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  select quantity into v_current_quantity
  from public.couple_items
  where couple_id = v_couple_id and item_type = p_item_type;

  if v_current_quantity is null or v_current_quantity <= 0 then
    return json_build_object('success', false, 'error', 'NO_ITEMS_LEFT');
  end if;

  update public.couple_items
  set quantity = quantity - 1, updated_at = now()
  where couple_id = v_couple_id and item_type = p_item_type
  returning quantity into v_current_quantity;

  return json_build_object('success', true, 'new_quantity', v_current_quantity);
end;
$$;
