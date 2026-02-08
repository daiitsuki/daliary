import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [history, setHistory] = useState<QuestionWithAnswers[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 7;

  const fetchHistory = useCallback(async (isLoadMore = false) => {
    if (!coupleId || !currentUserId || !createdAt || loading) return;

    try {
      if (isLoadMore) setLoading(true);
      else {
        setInitialLoading(true);
        setPage(0);
      }

      // 커플 생성일 (YYYY-MM-DD 형식으로 변환)
      const createdDate = createdAt.split('T')[0];

      const today = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replace(/\. /g, '-').replace(/\./g, '');

      const currentPage = isLoadMore ? page + 1 : 0;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // 1. Fetch questions with range and date filter
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .lte('publish_date', today)
        .gte('publish_date', createdDate) // 커플 생성일 이후 질문만
        .order('publish_date', { ascending: false })
        .range(from, to);

      if (qError) throw qError;

      if (!questions || questions.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.id);

        // 2. Fetch answers only for these questions
        const { data: answers, error: aError } = await supabase
          .from('answers')
          .select('*')
          .eq('couple_id', coupleId)
          .in('question_id', questionIds);

        if (aError) throw aError;

        // 3. Map answers to questions
        const newHistory = questions.map(q => {
          const qAnswers = (answers || []).filter(a => a.question_id === q.id);
          return {
            ...q,
            myAnswer: qAnswers.find(a => a.writer_id === currentUserId),
            partnerAnswer: qAnswers.find(a => a.writer_id !== currentUserId),
          };
        });

        if (isLoadMore) {
          setHistory(prev => [...prev, ...newHistory]);
          setPage(currentPage);
        } else {
          setHistory(newHistory);
        }
      } else if (!isLoadMore) {
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching question history:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [coupleId, currentUserId, createdAt, loading, page]);

  useEffect(() => {
    if (coupleId && currentUserId && createdAt) {
      fetchHistory();
    }
  }, [coupleId, currentUserId, createdAt]); // eslint-disable-line react-hooks/exhaustive-deps

  return { 
    history, 
    loading, 
    initialLoading, 
    hasMore, 
    loadMore: () => fetchHistory(true),
    refresh: () => fetchHistory(false) 
  };
};