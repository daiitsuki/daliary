-- Update game_scores RLS to allow viewing partner's scores
drop policy if exists "Users can view their own game scores" on public.game_scores;

create policy "Users can view own and partner's game scores" on public.game_scores
  for select using (
    auth.uid() = user_id or 
    couple_id = (select couple_id from public.profiles where id = auth.uid())
  );
