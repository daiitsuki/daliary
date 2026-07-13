import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { RelayNovel } from '../../types';
import { useCouple } from '../core/useCouple';
import { useToast } from '../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export const useCompletedRelayNovels = () => {
  const { couple } = useCouple();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: novels = [], isLoading, refetch } = useQuery({
    queryKey: ['completed_relay_novels', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from('relay_novels')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as RelayNovel[];
    },
    enabled: !!couple?.id,
  });

  const deleteNovel = async (novelId: string) => {
    try {
      const { error } = await supabase
        .from('relay_novels')
        .delete()
        .eq('id', novelId);

      if (error) throw error;
      showToast('완결된 소설이 삭제되었습니다.', 'success');
      queryClient.invalidateQueries({ queryKey: ['completed_relay_novels', couple?.id] });
      return true;
    } catch (error) {
      console.error(error);
      showToast('삭제 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  return { novels, isLoading, deleteNovel, refetch };
};
