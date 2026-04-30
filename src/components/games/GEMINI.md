# Games Implementation Standard

## 1. Game Score Management
- **Table**: `game_scores`
- **Fields**: `user_id`, `couple_id`, `game_type`, `high_score`, `last_reward_date`
- **Logic**: Maximum **2 games** per day for point rewards.

## 2. Game Specifics
- **2048**: Rose/Amber gradient, 2048 tile = 150 PT reward.
- **Blind Timer**: Target time 15-20s, requires `blind_timer_ticket` (100 PT).
- **Watermelon**: `matter-js` physics, merge fruits to create Watermelon (150 PT).
- **Brick Breaker**: Reach Stage 100 for 150 PT reward.
- **Stack Tower**: 30+ floors or 5x perfect combo for 150 PT reward.

## 3. Implementation Pattern
- Use `useGameScore(gameType)` hook.
- Use `record_game_result` RPC for atomic score/reward processing.
