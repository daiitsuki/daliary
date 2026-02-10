-- Revert: Remove status and today's word columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS status_emoji,
DROP COLUMN IF EXISTS status_message,
DROP COLUMN IF EXISTS today_word,
DROP COLUMN IF EXISTS today_word_updated_at;
