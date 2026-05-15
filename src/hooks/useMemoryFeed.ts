import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
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

const formatVisitItem = (v: any, likesData: any[], commentsData: any[], myProfileId: string): MemoryFeedItem => {
  const visitLikes = likesData?.filter(l => l.visit_id === v.id) || [];
  const visitComments = commentsData?.filter(c => c.visit_id === v.id) || [];
  
  return {
    ...v,
    like_count: visitLikes.length,
    is_liked: visitLikes.some(l => l.user_id === myProfileId),
    comment_count: visitComments.length,
    preview_comments: visitComments.slice(-2).map((c: any) => ({
      id: c.id,
      content: c.content,
      writer: { nickname: c.writer.nickname }
    }))
  };
};

export const useMemoryFeed = (region?: string | null, subRegion?: string | null) => {
  const { couple, myProfile } = useHomeData();
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: ['memory_feed', couple?.id, region, subRegion],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const currentOffset = pageParam as number;
      if (!couple?.id || !myProfile?.id) return { data: [], nextCursor: null };

      // 1. Fetch visits with optional region/subRegion filters
      let query = supabase
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
        .not('image_url', 'is', null);

      if (region) {
        query = query.eq('region', region);
      }
      if (subRegion) {
        query = query.eq('sub_region', subRegion);
      }

      const { data, error } = await query
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
          queryClient.setQueryData(['visit_comments', vId], visitSpecificComments);
        });
      }

      const formattedData: MemoryFeedItem[] = data.map((v: any) => 
        formatVisitItem(v, likesData || [], commentsData || [], myProfile.id)
      );

      return {
        data: formattedData,
        nextCursor: data.length === PAGE_SIZE ? currentOffset + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    enabled: !!couple?.id && !!myProfile?.id,
  });
};

export const useVisitById = (visitId: string | null) => {
  const { couple, myProfile } = useHomeData();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['visit_detail', visitId],
    queryFn: async () => {
      if (!visitId || !couple?.id || !myProfile?.id) return null;

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
        .eq('id', visitId)
        .single();

      if (error) throw error;

      // Likes
      const { data: likesData } = await supabase
        .from('visit_likes')
        .select('visit_id, user_id')
        .eq('visit_id', visitId);

      // Comments
      const { data: commentsData } = await supabase
        .from('visit_comments')
        .select(`
          *,
          writer:profiles(id, nickname, avatar_url)
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: true });

      if (commentsData) {
        queryClient.setQueryData(['visit_comments', visitId], commentsData);
      }

      return formatVisitItem(data, likesData || [], commentsData || [], myProfile.id);
    },
    enabled: !!visitId && !!couple?.id && !!myProfile?.id,
  });
};
