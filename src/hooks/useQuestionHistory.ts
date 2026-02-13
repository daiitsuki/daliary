import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCallback } from 'react';

interface Answer {
  id: string;
  content: string;
  writer_id: string;
  created_at: string;
}

interface QuestionWithAnswers {
  id: string;
  content: string;
  publish_date: string;
  myAnswer?: Answer;
  partnerAnswer?: Answer;
}

export const useQuestionHistory = (coupleId: string | undefined, currentUserId: string | null, createdAt: string | undefined) => {
  const PAGE_SIZE = 7;
  const queryClient = useQueryClient();

  const fetchHistoryPage = async ({ pageParam = 0 }) => {
    if (!coupleId || !currentUserId || !createdAt) return { questions: [], hasMore: false };

    // 커플 생성일 (YYYY-MM-DD 형식으로 변환)
    const createdDate = createdAt.split('T')[0];

    const today = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()).replace(/\. /g, '-').replace(/\./g, '');

    const from = pageParam * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 1. Fetch questions with range and date filter
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, content, publish_date')
      .lte('publish_date', today)
      .gte('publish_date', createdDate) // 커플 생성일 이후 질문만
      .order('publish_date', { ascending: false })
      .range(from, to);

    if (qError) throw qError;

    if (!questions || questions.length === 0) {
      return { questions: [], hasMore: false };
    }

    const questionIds = questions.map(q => q.id);

    // 2. Fetch answers only for these questions
    const { data: answers, error: aError } = await supabase
      .from('answers')
      .select('id, content, writer_id, created_at, question_id')
      .eq('couple_id', coupleId)
      .in('question_id', questionIds);

    if (aError) throw aError;

    // 3. Map answers to questions
    const mappedQuestions = questions.map(q => {
      const qAnswers = (answers || []).filter(a => a.question_id === q.id);
      return {
        ...q,
        myAnswer: qAnswers.find(a => a.writer_id === currentUserId),
        partnerAnswer: qAnswers.find(a => a.writer_id !== currentUserId),
      } as QuestionWithAnswers;
    });

    return {
      questions: mappedQuestions,
      hasMore: questions.length === PAGE_SIZE
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: initialLoading,
  } = useInfiniteQuery({
    queryKey: ['question_history', coupleId],
    queryFn: fetchHistoryPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!coupleId && !!currentUserId && !!createdAt,
  });

  const history = data?.pages.flatMap(page => page.questions) || [];

  return { 
    history, 
    loading: isFetchingNextPage, 
    initialLoading, 
    hasMore: hasNextPage, 
    loadMore: fetchNextPage,
    refresh: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['question_history', coupleId] });
    }, [queryClient, coupleId])
  };
};
