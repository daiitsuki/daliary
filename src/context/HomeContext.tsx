import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';
import { Profile } from '../types';

interface Answer {
  id: string;
  content: string;
  writer_id: string;
  created_at: string;
}

interface Question {
  id: string;
  content: string;
}

interface HomeContextType {
  dDay: number;
  todayQuestion: Question | null;
  partnerProfile: Profile | null;
  myProfile: Profile | null;
  myAnswer: Answer | null;
  partnerAnswer: Answer | null;
  loading: boolean;
  refresh: () => Promise<void>;
  currentUserId: string | null;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const HomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { couple, profile, loading: coupleLoading } = useCouple();
  const queryClient = useQueryClient();
  const [dDay, setDDay] = useState(0);

  const currentUserId = profile?.id || null;

  // React Query for Profiles (Members)
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['home_profiles', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, last_active_at')
        .eq('couple_id', couple.id);
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!couple?.id && !coupleLoading,
  });

  // React Query for Daily Data (Question + Answers)
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily_data', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return null;
      
      const today = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replace(/\. /g, '-').replace(/\./g, '');

      const { data: question } = await supabase
        .from('questions')
        .select('id, content')
        .eq('publish_date', today)
        .maybeSingle();

      if (!question) {
        return { 
          question: { id: 'dummy-q', content: '아직 오늘의 질문이 준비되지 않았어요. 새로운 질문을 기다려주세요!' },
          answers: []
        };
      }

      const { data: answers, error } = await supabase
        .from('answers')
        .select('id, content, writer_id, created_at')
        .eq('couple_id', couple.id)
        .eq('question_id', question.id);

      if (error) throw error;

      return { question, answers };
    },
    enabled: !!couple?.id && !coupleLoading,
  });

  const myProfile = (profiles as Profile[] | undefined)?.find(p => p.id === currentUserId) || null;
  const partnerProfile = (profiles as Profile[] | undefined)?.find(p => p.id !== currentUserId) || null;
  const todayQuestion = dailyData?.question || null;
  const myAnswer = (dailyData?.answers as Answer[] | undefined)?.find(a => a.writer_id === currentUserId) || null;
  const partnerAnswer = (dailyData?.answers as Answer[] | undefined)?.find(a => a.writer_id !== currentUserId) || null;

  const calculateDDay = useCallback(() => {
    if (couple?.anniversary_date) {
      const kstNow = new Date(new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul'
      }).format(new Date()));
      kstNow.setHours(0, 0, 0, 0);

      const start = new Date(couple.anniversary_date);
      start.setHours(0, 0, 0, 0);

      const diff = Math.floor((kstNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setDDay(diff);
    }
  }, [couple?.anniversary_date]);

  useEffect(() => {
    calculateDDay();
  }, [calculateDDay]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['home_profiles', couple?.id] }),
      queryClient.invalidateQueries({ queryKey: ['daily_data', couple?.id] })
    ]);
  }, [queryClient, couple?.id]);

  // Realtime Sync
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase
      .channel(`home_sync_${couple.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'answers', filter: `couple_id=eq.${couple.id}` }, 
        () => queryClient.invalidateQueries({ queryKey: ['daily_data', couple.id] })
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `couple_id=eq.${couple.id}` }, 
        () => queryClient.invalidateQueries({ queryKey: ['home_profiles', couple.id] })
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [couple?.id, queryClient]);

  return (
    <HomeContext.Provider value={{
      dDay,
      todayQuestion,
      partnerProfile,
      myProfile,
      myAnswer,
      partnerAnswer,
      loading: profilesLoading || dailyLoading,
      refresh,
      currentUserId
    }}>
      {children}
    </HomeContext.Provider>
  );
};

export const useHomeContext = () => {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error('useHomeContext must be used within a HomeProvider');
  }
  return context;
};
