-- Add INSERT policy for notifications table
-- This allows a user to send a notification to their partner (same couple)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        -- Can insert if the recipient (user_id) belongs to the same couple as the sender (auth.uid())
        EXISTS (
            SELECT 1 FROM public.profiles p1
            JOIN public.profiles p2 ON p1.couple_id = p2.couple_id
            WHERE p1.id = auth.uid() 
            AND p2.id = notifications.user_id
        )
        OR 
        -- Also allow system-level triggers (though triggers usually bypass RLS if SECURITY DEFINER)
        (auth.uid() IS NULL)
    );

-- Ensure RLS is active
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
