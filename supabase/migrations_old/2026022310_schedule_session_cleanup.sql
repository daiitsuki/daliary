-- Migration: 2026022310_schedule_session_cleanup.sql

-- ==========================================
-- 1. Enable pg_cron Extension
-- ==========================================
create extension if not exists pg_cron;

-- ==========================================
-- 2. Schedule Game Sessions Cleanup
-- ==========================================
-- Unschedule if already exists to avoid duplicates
select cron.unschedule('cleanup-game-sessions-task')
where exists (select 1 from cron.job where jobname = 'cleanup-game-sessions-task');

-- Schedule to run every day at 3:00 AM (KST)
-- KST (UTC+9) 03:00 is 18:00 (UTC) of the previous day
select cron.schedule(
  'cleanup-game-sessions-task',
  '0 18 * * *',
  'SELECT public.cleanup_game_sessions()'
);
