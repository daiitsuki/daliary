-- Keep only the latest game per couple per game_type
WITH RankedGames AS (
    SELECT id, ROW_NUMBER() OVER(PARTITION BY couple_id, game_type ORDER BY created_at DESC) as rn
    FROM public.multiplayer_games
)
DELETE FROM public.multiplayer_games
WHERE id IN (SELECT id FROM RankedGames WHERE rn > 1);

-- Drop the old partial index
DROP INDEX IF EXISTS unique_active_game_per_couple;

-- Create a new absolute unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_game_per_couple_type 
ON public.multiplayer_games (couple_id, game_type);
