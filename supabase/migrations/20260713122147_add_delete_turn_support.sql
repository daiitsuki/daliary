-- 1. Add DELETE RLS Policy for relay_novel_turns
-- We use DO block to be safe against re-runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novel_turns' AND policyname = 'Users can delete their own novel turns') THEN
        CREATE POLICY "Users can delete their own novel turns"
            ON public.relay_novel_turns FOR DELETE
            USING (author_id = auth.uid());
    END IF;
END $$;

-- 2. BEFORE DELETE Trigger to ensure ONLY the last turn can be deleted
CREATE OR REPLACE FUNCTION public.check_last_turn_delete()
RETURNS TRIGGER AS $$
DECLARE
    last_turn_id UUID;
BEGIN
    SELECT id INTO last_turn_id 
    FROM public.relay_novel_turns 
    WHERE novel_id = OLD.novel_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF OLD.id != last_turn_id THEN
        RAISE EXCEPTION 'Only the last turn can be deleted.';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS relay_novel_turn_before_delete ON public.relay_novel_turns;
CREATE TRIGGER relay_novel_turn_before_delete
BEFORE DELETE ON public.relay_novel_turns
FOR EACH ROW
EXECUTE FUNCTION public.check_last_turn_delete();

-- 3. AFTER DELETE Trigger Function to update stats
CREATE OR REPLACE FUNCTION public.update_relay_novel_stats_on_delete()
RETURNS TRIGGER AS $$
DECLARE
    prev_turn record;
BEGIN
    -- Get the newly last remaining turn for this novel
    SELECT content, author_id INTO prev_turn 
    FROM public.relay_novel_turns 
    WHERE novel_id = OLD.novel_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    UPDATE public.relay_novels
    SET 
        turn_count = GREATEST(turn_count - 1, 0),
        last_turn_content = prev_turn.content,
        last_turn_author_id = prev_turn.author_id,
        updated_at = now(),
        status = 'ongoing'
    WHERE id = OLD.novel_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create AFTER DELETE Trigger
DROP TRIGGER IF EXISTS relay_novel_turn_delete_trigger ON public.relay_novel_turns;
CREATE TRIGGER relay_novel_turn_delete_trigger
AFTER DELETE ON public.relay_novel_turns
FOR EACH ROW
EXECUTE FUNCTION public.update_relay_novel_stats_on_delete();
