import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useHomeData } from './useHomeData';

export interface MemoryFeedItem {
  id: string;
  visited_at: string;
  image_url: string;
  comment: string;
  region: string;
  sub_region: string | null;
  place: {
    id: string;
    name: string;
    address: string | null;
  };
  writer: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  } | null;
  like_count: number;
  is_liked: boolean;
  comment_count: number;
  preview_comments: Array<{
    id: string;
    content: string;
    writer: {
      nickname: string;
    };
  }>;
}

const PAGE_SIZE = 5;

export const useMemoryFeed = () => {
  const { couple, myProfile } = useHomeData();
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: ['memory_feed', couple?.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const currentOffset = pageParam as number;
      if (!couple?.id || !myProfile?.id) return { data: [], nextCursor: null };

      // 1. Fetch visits
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visited_at,
          image_url,
          comment,
          region,
          sub_region,
          place:places!inner(id, name, address, couple_id),
          writer:profiles(id, nickname, avatar_url)
        `)
        .eq('places.couple_id', couple.id)
        .not('image_url', 'is', null)
        .order('visited_at', { ascending: false })
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (error) throw error;

      const visitIds = data.map(v => v.id);
      if (visitIds.length === 0) return { data: [], nextCursor: null };

      // 2. Fetch likes
      const { data: likesData } = await supabase
        .from('visit_likes')
        .select('visit_id, user_id')
        .in('visit_id', visitIds);

      // 3. Fetch ALL comments for these visits to seed cache
      const { data: commentsData } = await supabase
        .from('visit_comments')
        .select(`
          *,
          writer:profiles(id, nickname, avatar_url)
        `)
        .in('visit_id', visitIds)
        .order('created_at', { ascending: true });

      // --- Cache Seeding Logic ---
      if (commentsData) {
        visitIds.forEach(vId => {
          const visitSpecificComments = commentsData.filter(c => c.visit_id === vId);
          // Seed the individual comment queries so the modal opens INSTANTLY
          queryClient.setQueryData(['visit_comments', vId], visitSpecificComments);
        });
      }

      const formattedData: MemoryFeedItem[] = data.map((v: any) => {
        const visitLikes = likesData?.filter(l => l.visit_id === v.id) || [];
        const visitComments = commentsData?.filter(c => c.visit_id === v.id) || [];
        
        return {
          ...v,
          like_count: visitLikes.length,
          is_liked: visitLikes.some(l => l.user_id === myProfile.id),
          comment_count: visitComments.length,
          preview_comments: visitComments.slice(-2).map((c: any) => ({
            id: c.id,
            content: c.content,
            writer: { nickname: c.writer.nickname }
          }))
        };
      });

      return {
        data: formattedData,
        nextCursor: data.length === PAGE_SIZE ? currentOffset + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    enabled: !!couple?.id && !!myProfile?.id,
  });
};
