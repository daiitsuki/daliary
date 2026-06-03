-- timetable_blocks table
-- 커플 각자의 요일별 고정 시간표 블록을 저장합니다.

create table if not exists public.timetable_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  writer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  start_time text not null, -- HH:mm
  end_time text not null,   -- HH:mm
  place_name text,
  place_address text,
  color text not null default '#FDA4AF',
  memo text
);

-- RLS 활성화
alter table public.timetable_blocks enable row level security;

-- 같은 커플 구성원만 조회 가능
create policy "couple members can select timetable_blocks"
  on public.timetable_blocks for select
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- 본인이 작성한 블록만 삽입/수정/삭제 가능
create policy "writer can insert timetable_blocks"
  on public.timetable_blocks for insert
  with check (writer_id = auth.uid());

create policy "writer can update timetable_blocks"
  on public.timetable_blocks for update
  using (writer_id = auth.uid());

create policy "writer can delete timetable_blocks"
  on public.timetable_blocks for delete
  using (writer_id = auth.uid());

-- updated_at 자동 갱신 트리거
create or replace function public.handle_timetable_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger timetable_blocks_updated_at
  before update on public.timetable_blocks
  for each row execute procedure public.handle_timetable_updated_at();
