-- 1. Create a safe RPC to update a turn and check constraints explicitly
CREATE OR REPLACE FUNCTION public.update_relay_novel_turn(turn_id_input UUID, new_content TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    target_turn record;
    novel_status TEXT;
    last_turn_id UUID;
BEGIN
    -- Get the target turn and check if it belongs to the caller
    SELECT * INTO target_turn 
    FROM public.relay_novel_turns 
    WHERE id = turn_id_input AND author_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turn not found or you do not have permission to edit it.';
    END IF;

    -- Check if the novel is completed
    SELECT status INTO novel_status FROM public.relay_novels WHERE id = target_turn.novel_id;
    IF novel_status = 'completed' THEN
        RAISE EXCEPTION 'Cannot modify a completed novel.';
    END IF;

    -- Update the turn
    UPDATE public.relay_novel_turns 
    SET content = new_content 
    WHERE id = turn_id_input;

    -- Check if it is the last turn
    SELECT id INTO last_turn_id 
    FROM public.relay_novel_turns 
    WHERE novel_id = target_turn.novel_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Update the novel stats if it was the last turn
    IF turn_id_input = last_turn_id THEN
        UPDATE public.relay_novels
        SET 
            last_turn_content = new_content,
            updated_at = now()
        WHERE id = target_turn.novel_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
