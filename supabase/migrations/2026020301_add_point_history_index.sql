-- Add index to point_history.couple_id for faster SUM aggregation
create index if not exists idx_point_history_couple_id on public.point_history(couple_id);
