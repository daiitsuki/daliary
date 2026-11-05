# Games Architecture (`src/components/games/`)

## 1. Single-Player Mission Games (`2048`, `watermelon`, `brick_breaker`, `stack`)
- Managed via `useGameScore(gameType)` and `useAllGameScores()` in `src/hooks/games/useGameScore.ts`.
- Score submission and daily reward checks are processed atomically via the `record_game_result` RPC (`game_scores` table).
- **Daily Limit**: Up to **2 mission games per day** (KST) grant point rewards (150 PT each).
- **Bonus Game (`BlindTimerGame`)**: Uses a separate ticket-based flow (`blind_timer_ticket` item + `start_blind_timer_game` RPC).

## 2. Real-Time Multiplayer Games (`connect-four`, `othello`, `yacht-dice`, `abalone`)
- Managed via `useMultiplayerGame(gameType)` in `src/hooks/games/useMultiplayerGame.ts` + game-specific hooks (`useConnectFour`, `useOthello`, `useYachtDice`, `useAbalone`).
- **Permanent Room Pattern**: Each couple reuses a single persistent row per `game_type` in the `multiplayer_games` table (`waiting` → `playing` → `finished`), synchronized via Supabase Realtime (`postgres_changes`).
