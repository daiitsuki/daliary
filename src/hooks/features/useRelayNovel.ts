import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { RelayNovel, RelayNovelTurn } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useCouple } from '../core/useCouple';

export const useRelayNovel = (novelId?: string) => {
  const { couple, profile } = useCouple();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = profile?.id;

  // 1. Fetch Novel Meta (if novelId is provided)
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

  // 2. Fetch Novel Turns (Max 100, so we can fetch all efficiently)
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
    // If completed, cache indefinitely (Infinity). Otherwise 0 so window focus refetches immediately.
    staleTime: novel?.status === 'completed' ? Infinity : 0,
  });

  // 3. Create a new novel
  const createNovel = async (title: string, starterContent: string) => {
    if (!couple?.id || !currentUserId) return null;
    try {
      const { data: newNovel, error: novelError } = await supabase
        .from('relay_novels')
        .insert({
          couple_id: couple.id,
          title,
          status: 'ongoing',
          turn_count: 0
        })
        .select()
        .single();

      if (novelError) throw novelError;

      // Add the first turn
      const { error: turnError } = await supabase
        .from('relay_novel_turns')
        .insert({
          novel_id: newNovel.id,
          author_id: currentUserId,
          content: starterContent
        });

      if (turnError) throw turnError;

      queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', couple.id] });
      return newNovel.id;
    } catch (err: any) {
      console.error(err);
      showToast('소설을 시작하는 중 오류가 발생했습니다.', 'error');
      return null;
    }
  };

  // 4. Add a turn
  const addTurn = async (content: string, partnerId?: string, myNickname?: string) => {
    if (!novelId || !currentUserId || !novel) return false;
    if (novel.status === 'completed' || novel.turn_count >= 100) {
      showToast('이미 완결된 소설입니다.', 'error');
      return false;
    }

    try {
      const { error } = await supabase
        .from('relay_novel_turns')
        .insert({
          novel_id: novelId,
          author_id: currentUserId,
          content
        });

      if (error) throw error;

      // Send notification if partner exists
      if (partnerId && couple?.id) {
        await supabase.from('notifications').insert({
          user_id: partnerId,
          couple_id: couple.id,
          title: '릴레이 소설',
          content: `${myNickname || '상대방'}님이 릴레이 소설의 뒷 내용을 작성했어요.`,
          type: 'relay_novel',
          metadata: { url: '/home' }
        });
      }

      // Invalidate to fetch new turn
      queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      if (couple?.id) {
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', couple.id] });
      }
      return true;
    } catch (err: any) {
      console.error(err);
      showToast('글을 저장하는 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  // 4.5. Update title
  const updateTitle = async (newTitle: string) => {
    if (!novelId || !couple?.id) return false;
    try {
      const { error } = await supabase
        .from('relay_novels')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', novelId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', couple.id] });
      return true;
    } catch (err: any) {
      console.error(err);
      showToast('제목 변경 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  // 4.6 Update setting notes
  const updateSettingNotes = async (notes: string) => {
    if (!novelId || !couple?.id) return false;
    try {
      const { error } = await supabase
        .from('relay_novels')
        .update({ setting_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', novelId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      showToast('설정집이 저장되었습니다.', 'success');
      return true;
    } catch (err: any) {
      console.error(err);
      showToast('설정집을 저장하는 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  // 5. Complete Novel
  const completeNovel = async () => {
    if (!novelId || !couple?.id) return false;
    try {
      const { error } = await supabase
        .from('relay_novels')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', novelId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', couple.id] });
      queryClient.invalidateQueries({ queryKey: ['completed_relay_novels', couple.id] });
      showToast('소설이 완결되었습니다!', 'success');
      return true;
    } catch (err: any) {
      console.error(err);
      showToast('완결 처리 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  // 5.5 Delete Turn
  const deleteTurn = async (turnId: string) => {
    if (!novelId || !currentUserId || !novel) return false;
    if (novel.status === 'completed') {
      showToast('이미 완결된 소설은 수정할 수 없습니다.', 'error');
      return false;
    }

    try {
      const { error } = await supabase.rpc('delete_relay_novel_turn', {
        turn_id_input: turnId
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      if (couple?.id) {
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', couple.id] });
      }
      return true;
    } catch (err: any) {
      console.error(err);
      showToast('문장을 삭제하는 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  // 6. Realtime Sync
  useEffect(() => {
    if (!novelId || !couple?.id || !currentUserId || novel?.status === 'completed') return;

    // Subscribe to DB changes for turns
    const dbChannel = supabase
      .channel(`novel_db_${novelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relay_novel_turns', filter: `novel_id=eq.${novelId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
        queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'relay_novels', filter: `id=eq.${novelId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', couple.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [novelId, couple?.id, currentUserId, queryClient, novel?.status]);

  return {
    novel,
    turns,
    loading: novelLoading || turnsLoading,
    createNovel,
    addTurn,
    updateTitle,
    updateSettingNotes,
    completeNovel,
    deleteTurn
  };
};
