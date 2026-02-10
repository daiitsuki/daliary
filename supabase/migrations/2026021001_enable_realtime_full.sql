-- Enable Realtime for profiles and set replica identity to FULL
-- This ensures that all column changes (including status_emoji, etc.) are broadcasted.
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Ensure profiles is in the supabase_realtime publication
-- (If not already enabled via dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
