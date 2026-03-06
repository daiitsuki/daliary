-- Fix Multi-device Notification Support
-- 1. Ensure 'endpoint' column exists
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS endpoint TEXT;

-- 2. Drop existing primary key constraint (which was user_id)
-- Using IF EXISTS with constraint name check
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'push_subscriptions_pkey' 
        AND conrelid = 'public.push_subscriptions'::regclass
    ) THEN
        ALTER TABLE public.push_subscriptions DROP CONSTRAINT push_subscriptions_pkey;
    END IF;
END $$;

-- 3. Set endpoint to NOT NULL (after ensuring it's populated if necessary)
-- If this column was just created, it will be null for old rows. 
-- However, our app logic now ensures every registration has an endpoint.
ALTER TABLE public.push_subscriptions ALTER COLUMN endpoint SET NOT NULL;

-- 4. Set composite primary key (user_id, endpoint)
ALTER TABLE public.push_subscriptions ADD PRIMARY KEY (user_id, endpoint);

-- 5. Ensure index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
