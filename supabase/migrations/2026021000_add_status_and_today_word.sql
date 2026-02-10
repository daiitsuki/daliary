-- Add status and today's word columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status_emoji text,
ADD COLUMN IF NOT EXISTS status_message text,
ADD COLUMN IF NOT EXISTS today_word text,
ADD COLUMN IF NOT EXISTS today_word_updated_at timestamptz;

-- Update RLS policies (though existing profiles policy should cover it)
-- "Users can update own profile" already exists:
-- create policy "Users can update own profile" on public.profiles for update using ( (select auth.uid()) = id );
