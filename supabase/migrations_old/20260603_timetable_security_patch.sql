-- ============================================================
-- RLS 보안 패치: INSERT 정책에 couple_id 소속 검증 추가
-- DB 레벨에서 본인의 couple_id 외 다른 커플 id로의 삽입 차단
-- ============================================================

-- 기존 취약한 정책 제거
drop policy if exists "writer can insert timetable_blocks" on public.timetable_blocks;

-- 강화된 정책: writer_id + couple_id 동시 검증
create policy "writer can insert timetable_blocks"
  on public.timetable_blocks for insert
  with check (
    writer_id = auth.uid()
    and couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- ============================================================
-- 데이터 무결성 패치: 시간 형식 및 시작<종료 제약 추가
-- ============================================================

-- start_time / end_time 형식 검증 (HH:mm 패턴)
alter table public.timetable_blocks
  add constraint timetable_start_time_format
    check (start_time ~ '^\d{2}:\d{2}$'),
  add constraint timetable_end_time_format
    check (end_time ~ '^\d{2}:\d{2}$');

-- 시작 시간은 반드시 종료 시간보다 이전
alter table public.timetable_blocks
  add constraint timetable_start_before_end
    check (start_time < end_time);

-- ============================================================
-- 성능 패치: 조회 인덱스 추가
-- ============================================================

create index if not exists idx_timetable_blocks_couple_id
  on public.timetable_blocks(couple_id);

create index if not exists idx_timetable_blocks_writer_id
  on public.timetable_blocks(writer_id);
