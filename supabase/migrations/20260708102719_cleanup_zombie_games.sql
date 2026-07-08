-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a nightly job (runs every day at 19:00 UTC, which is 04:00 AM KST) to delete zombie games
-- Zombie games are defined as games that are NOT 'finished' and were created more than 24 hours ago.
-- This cleans up games where a user force-closed the app or lost internet connection.
SELECT cron.schedule(
  'cleanup_zombie_multiplayer_games',
  '0 19 * * *',
  $$
    DELETE FROM public.multiplayer_games
    WHERE status != 'finished' 
      AND created_at < NOW() - INTERVAL '1 day';
  $$
);
