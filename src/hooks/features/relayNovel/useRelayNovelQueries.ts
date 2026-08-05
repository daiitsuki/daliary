import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { RelayNovel, RelayNovelTurn } from '../../../types';

export const useRelayNovelQueries = (novelId?: string, coupleId?: string, currentUserId?: string) => {
  const queryClient = useQueryClient();

  const { data: novel, isLoading: novelLoading } = useQuery({
    queryKey: ['relay_novel', novelId],
    queryFn: async () => {
      if (!novelId) return null;
      const { data, error } = await supabase
        .from('relay_novels')
        .select('*')
        .eq('id', novelId)
        .single();
      if (error) throw error;
      return data as RelayNovel;
    },
    enabled: !!novelId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: turns = [], isLoading: turnsLoading } = useQuery({
    queryKey: ['relay_novel_turns', novelId],
    queryFn: async () => {
      if (!novelId) return [];
      const { data, error } = await supabase
        .from('relay_novel_turns')
        .select('*')
        .eq('novel_id', novelId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as RelayNovelTurn[];
    },
    enabled: !!novelId,
    staleTime: novel?.status === 'completed' ? Infinity : 0,
  });

  useEffect(() => {
    if (!novelId || !coupleId || !currentUserId || novel?.status === 'completed') return;

    const dbChannel = supabase
      .channel(`novel_db_${novelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relay_novel_turns', filter: `novel_id=eq.${novelId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
        queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'relay_novels', filter: `id=eq.${novelId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [novelId, coupleId, currentUserId, queryClient, novel?.status]);

  return {
    novel,
    turns,
    loading: novelLoading || turnsLoading,
  };
};
