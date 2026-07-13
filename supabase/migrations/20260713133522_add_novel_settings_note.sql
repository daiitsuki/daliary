-- Add setting_notes column to relay_novels table
ALTER TABLE public.relay_novels ADD COLUMN IF NOT EXISTS setting_notes TEXT DEFAULT '';
