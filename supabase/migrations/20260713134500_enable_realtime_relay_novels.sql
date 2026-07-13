-- Enable Realtime for relay novels and turns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'relay_novels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.relay_novels;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'relay_novel_turns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.relay_novel_turns;
    END IF;
END $$;
