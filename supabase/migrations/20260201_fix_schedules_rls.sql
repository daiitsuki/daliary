-- Drop restrictive policies
drop policy if exists "Writers can update their schedules" on public.schedules;
drop policy if exists "Writers can delete their schedules" on public.schedules;

-- Create permissive policies for couples
create policy "Couples can update their schedules" on public.schedules
  for update using ( couple_id = get_auth_couple_id() );

create policy "Couples can delete their schedules" on public.schedules
  for delete using ( couple_id = get_auth_couple_id() );
