-- 1. Drop problematic triggers that interfere with ON DELETE CASCADE
DROP TRIGGER IF EXISTS relay_novel_turn_before_delete ON public.relay_novel_turns;
DROP FUNCTION IF EXISTS public.check_last_turn_delete();

DROP TRIGGER IF EXISTS relay_novel_turn_delete_trigger ON public.relay_novel_turns;
DROP FUNCTION IF EXISTS public.update_relay_novel_stats_on_delete();

-- 2. Update RLS Policy to allow CASCADE delete
-- If a user deletes a novel, ON DELETE CASCADE will try to delete all turns.
-- It needs permission to delete the partner's turns in that novel as well.
DROP POLICY IF EXISTS "Users can delete their own novel turns" ON public.relay_novel_turns;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novel_turns' AND policyname = 'Users can delete their couple''s novel turns') THEN
        CREATE POLICY "Users can delete their couple's novel turns"
            ON public.relay_novel_turns FOR DELETE
            USING (novel_id IN (
                SELECT id FROM public.relay_novels WHERE couple_id = (
                    SELECT couple_id FROM public.profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

-- 3. Create a safe RPC to delete a turn and update stats explicitly
CREATE OR REPLACE FUNCTION public.delete_relay_novel_turn(turn_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
    target_turn record;
    prev_turn record;
    novel_status TEXT;
BEGIN
    -- Get the target turn and check if it belongs to the caller
    SELECT * INTO target_turn 
    FROM public.relay_novel_turns 
    WHERE id = turn_id_input AND author_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turn not found or you do not have permission to delete it.';
    END IF;

    -- Check if the novel is completed
    SELECT status INTO novel_status FROM public.relay_novels WHERE id = target_turn.novel_id;
    IF novel_status = 'completed' THEN
        RAISE EXCEPTION 'Cannot modify a completed novel.';
    END IF;

    -- Delete the turn
    DELETE FROM public.relay_novel_turns WHERE id = turn_id_input;

    -- Fetch the new last turn
    SELECT content, author_id INTO prev_turn 
    FROM public.relay_novel_turns 
    WHERE novel_id = target_turn.novel_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Update the novel stats safely
    UPDATE public.relay_novels
    SET 
        turn_count = GREATEST(turn_count - 1, 0),
        last_turn_content = prev_turn.content,
        last_turn_author_id = prev_turn.author_id,
        updated_at = now(),
        status = 'ongoing'
    WHERE id = target_turn.novel_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
