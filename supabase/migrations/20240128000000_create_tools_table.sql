-- Create TOOLS table
create table public.tools (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  url text not null,
  icon_key text not null,
  sort_order int not null default 0
);

-- Enable RLS
alter table public.tools enable row level security;

-- Policies
create policy "Couples can view their own tools" on public.tools
  for select using ( couple_id = get_auth_couple_id() );

create policy "Couples can insert their own tools" on public.tools
  for insert with check ( couple_id = get_auth_couple_id() );

create policy "Couples can update their own tools" on public.tools
  for update using ( couple_id = get_auth_couple_id() );

create policy "Couples can delete their own tools" on public.tools
  for delete using ( couple_id = get_auth_couple_id() );
