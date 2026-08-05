import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { sendNotification } from '../../../utils/notificationUtils';
import { RelayNovel } from '../../../types';

export const useRelayNovelMutations = (novelId?: string, coupleId?: string, currentUserId?: string, novel?: RelayNovel | null) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ title, starterContent }: { title: string; starterContent: string }) => {
      if (!coupleId || !currentUserId) throw new Error('No user');
      const { data: newNovel, error: novelError } = await supabase
        .from('relay_novels')
        .insert({
          couple_id: coupleId,
          title,
          status: 'ongoing',
          turn_count: 0
        })
        .select()
        .single();
      if (novelError) throw novelError;

      const { error: turnError } = await supabase
        .from('relay_novel_turns')
        .insert({
          novel_id: newNovel.id,
          author_id: currentUserId,
          content: starterContent
        });
      if (turnError) throw turnError;

      return newNovel.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
    },
    onError: (err) => {
      console.error(err);
      showToast('소설을 시작하는 중 오류가 발생했습니다.', 'error');
    }
  });

  const addTurnMutation = useMutation({
    mutationFn: async ({ content, partnerId, myNickname }: { content: string; partnerId?: string; myNickname?: string }) => {
      if (!novelId || !currentUserId || !novel) throw new Error('No novel info');
      if (novel.status === 'completed' || novel.turn_count >= 100) {
        throw new Error('Already completed');
      }

      const { error } = await supabase
        .from('relay_novel_turns')
        .insert({
          novel_id: novelId,
          author_id: currentUserId,
          content
        });
      if (error) throw error;

      if (partnerId && coupleId) {
        await sendNotification({
          userId: partnerId,
          coupleId: coupleId,
          title: '릴레이 소설',
          content: `${myNickname || '상대방'}님이 릴레이 소설의 뒷 내용을 작성했어요.`,
          type: 'relay_novel',
          metadata: { url: '/home' }
        });
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
      }
    },
    onError: (err: any) => {
      if (err.message === 'Already completed') {
        showToast('이미 완결된 소설입니다.', 'error');
      } else {
        console.error(err);
        showToast('글을 저장하는 중 오류가 발생했습니다.', 'error');
      }
    }
  });

  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      if (!novelId || !coupleId) throw new Error('No novel info');
      const { error } = await supabase
        .from('relay_novels')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', novelId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
    },
    onError: (err) => {
      console.error(err);
      showToast('제목 변경 중 오류가 발생했습니다.', 'error');
    }
  });

  const updateSettingNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!novelId || !coupleId) throw new Error('No novel info');
      const { error } = await supabase
        .from('relay_novels')
        .update({ setting_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', novelId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      showToast('설정집이 저장되었습니다.', 'success');
    },
    onError: (err) => {
      console.error(err);
      showToast('설정집을 저장하는 중 오류가 발생했습니다.', 'error');
    }
  });

  const completeNovelMutation = useMutation({
    mutationFn: async () => {
      if (!novelId || !coupleId) throw new Error('No novel info');
      const { error } = await supabase
        .from('relay_novels')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', novelId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['completed_relay_novels', coupleId] });
      showToast('소설이 완결되었습니다!', 'success');
    },
    onError: (err) => {
      console.error(err);
      showToast('완결 처리 중 오류가 발생했습니다.', 'error');
    }
  });

  const deleteTurnMutation = useMutation({
    mutationFn: async (turnId: string) => {
      if (!novelId || !currentUserId || !novel) throw new Error('No novel info');
      if (novel.status === 'completed') throw new Error('Already completed');

      const { error } = await supabase.rpc('delete_relay_novel_turn', {
        turn_id_input: turnId
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
      }
    },
    onError: (err: any) => {
      if (err.message === 'Already completed') {
        showToast('이미 완결된 소설은 수정할 수 없습니다.', 'error');
      } else {
        console.error(err);
        showToast('문장을 삭제하는 중 오류가 발생했습니다.', 'error');
      }
    }
  });

  const updateTurnMutation = useMutation({
    mutationFn: async ({ turnId, newContent }: { turnId: string; newContent: string }) => {
      if (!novelId || !currentUserId || !novel) throw new Error('No novel info');
      if (novel.status === 'completed') throw new Error('Already completed');

      const { error } = await supabase.rpc('update_relay_novel_turn', {
        turn_id_input: turnId,
        new_content: newContent
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay_novel_turns', novelId] });
      queryClient.invalidateQueries({ queryKey: ['relay_novel', novelId] });
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: ['ongoing_relay_novel', coupleId] });
      }
      showToast('문장이 수정되었습니다.', 'success');
    },
    onError: (err: any) => {
      if (err.message === 'Already completed') {
        showToast('이미 완결된 소설은 수정할 수 없습니다.', 'error');
      } else {
        console.error(err);
        showToast('문장을 수정하는 중 오류가 발생했습니다.', 'error');
      }
    }
  });

  const createNovel = async (title: string, starterContent: string) => {
    try {
      return await createMutation.mutateAsync({ title, starterContent });
    } catch {
      return null;
    }
  };

  const addTurn = async (content: string, partnerId?: string, myNickname?: string) => {
    try {
      return await addTurnMutation.mutateAsync({ content, partnerId, myNickname });
    } catch {
      return false;
    }
  };

  const updateTitle = async (newTitle: string) => {
    try {
      return await updateTitleMutation.mutateAsync(newTitle);
    } catch {
      return false;
    }
  };

  const updateSettingNotes = async (notes: string) => {
    try {
      return await updateSettingNotesMutation.mutateAsync(notes);
    } catch {
      return false;
    }
  };

  const completeNovel = async () => {
    try {
      return await completeNovelMutation.mutateAsync();
    } catch {
      return false;
    }
  };

  const deleteTurn = async (turnId: string) => {
    try {
      return await deleteTurnMutation.mutateAsync(turnId);
    } catch {
      return false;
    }
  };

  const updateTurn = async (turnId: string, newContent: string) => {
    try {
      return await updateTurnMutation.mutateAsync({ turnId, newContent });
    } catch {
      return false;
    }
  };

  return {
    createNovel,
    addTurn,
    updateTitle,
    updateSettingNotes,
    completeNovel,
    deleteTurn,
    updateTurn
  };
};
