-- Create the function to automatically update the updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the multiplayer_games table for all future real-time turn-based games
CREATE TABLE IF NOT EXISTS public.multiplayer_games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    game_type text NOT NULL, -- e.g., 'connect_four'
    host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    host_ready boolean DEFAULT true,
    guest_ready boolean DEFAULT false,
    status text NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
    game_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_turn_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    winner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Partial Unique Index: A couple can only have ONE game that is NOT 'finished'
-- This prevents the race condition of both users creating a game simultaneously.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_game_per_couple 
ON public.multiplayer_games (couple_id) 
WHERE status != 'finished';

-- Create an index for faster lookups by couple_id
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_couple_id ON public.multiplayer_games(couple_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.multiplayer_games ENABLE ROW LEVEL SECURITY;

-- Allow users to read/write/delete games if they belong to the same couple
CREATE POLICY "Users can manage their couple's multiplayer games" 
ON public.multiplayer_games 
FOR ALL 
USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

-- Trigger for updating the `updated_at` column automatically
CREATE TRIGGER update_multiplayer_games_updated_at
    BEFORE UPDATE ON public.multiplayer_games
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable Supabase Realtime for this table
-- We use a DO block to safely add the table to the publication if it's not already there
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'multiplayer_games'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_games;
    END IF;
END $$;
