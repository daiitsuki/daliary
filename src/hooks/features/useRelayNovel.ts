import { useCouple } from '../core/useCouple';
import { useRelayNovelQueries } from './relayNovel/useRelayNovelQueries';
import { useRelayNovelMutations } from './relayNovel/useRelayNovelMutations';

export const useRelayNovel = (novelId?: string) => {
  const { couple, profile } = useCouple();
  const currentUserId = profile?.id;

  const { novel, turns, loading } = useRelayNovelQueries(novelId, couple?.id, currentUserId);
  const mutations = useRelayNovelMutations(novelId, couple?.id, currentUserId, novel);

  return {
    novel,
    turns,
    loading,
    ...mutations
  };
};
