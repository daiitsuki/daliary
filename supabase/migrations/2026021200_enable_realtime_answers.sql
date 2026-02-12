-- Enable Realtime for answers, point_history, and attendances tables
ALTER TABLE public.answers REPLICA IDENTITY FULL;
ALTER TABLE public.point_history REPLICA IDENTITY FULL;
ALTER TABLE public.attendances REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- Add answers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
  END IF;

  -- Add point_history
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'point_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.point_history;
  END IF;

  -- Add attendances
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendances'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendances;
  END IF;
END $$;
