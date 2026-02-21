-- Multi-device notification support
-- 1. Add endpoint column to push_subscriptions
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS endpoint TEXT;

-- 2. Populate endpoint from existing subscription JSONB
UPDATE public.push_subscriptions 
SET endpoint = subscription->>'endpoint'
WHERE endpoint IS NULL;

-- 3. Drop existing primary key (which was user_id)
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_pkey;

-- 4. Set endpoint to NOT NULL after population
ALTER TABLE public.push_subscriptions ALTER COLUMN endpoint SET NOT NULL;

-- 5. Set composite primary key (user_id, endpoint)
ALTER TABLE public.push_subscriptions ADD PRIMARY KEY (user_id, endpoint);

-- 6. Add index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
