-- Add DELETE policy for relay_novels to allow users to delete completed novels

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relay_novels' AND policyname = 'Users can delete their couple''s novels') THEN
        CREATE POLICY "Users can delete their couple's novels" 
            ON public.relay_novels FOR DELETE 
            USING (couple_id = (
                SELECT couple_id FROM public.profiles 
                WHERE id = auth.uid()
            ));
    END IF;
END $$;
