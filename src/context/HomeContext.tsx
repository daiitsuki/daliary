import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCouple } from "../hooks";
import { Profile, DrawingAnswer } from '../types';
import { getTodayDrawingQuestion } from '../data/drawingQuestions';

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
  drawingQuestion: string;
  myDrawing: DrawingAnswer | null;
  partnerDrawing: DrawingAnswer | null;
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
    staleTime: 1000 * 60 * 5,
  });

  // React Query for Daily Data (Question + Answers)
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily_data', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return null;
      
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + kstOffset);
      const year = kstNow.getFullYear();
      const month = String(kstNow.getMonth() + 1).padStart(2, '0');
      const day = String(kstNow.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const { data: question } = await supabase
        .from('questions')
        .select('id, content')
        .eq('publish_date', today)
        .maybeSingle();

      if (!question) {
        return { question: null, answers: [] };
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
    staleTime: 1000 * 60 * 5,
  });

  const myProfile = (profiles as Profile[] | undefined)?.find(p => p.id === currentUserId) || null;
  const partnerProfile = (profiles as Profile[] | undefined)?.find(p => p.id !== currentUserId) || null;
  const todayQuestion = dailyData?.question || null;
  const myAnswer = (dailyData?.answers as Answer[] | undefined)?.find(a => a.writer_id === currentUserId) || null;
  const partnerAnswer = (dailyData?.answers as Answer[] | undefined)?.find(a => a.writer_id !== currentUserId) || null;

  // React Query for Drawing Data
  const { data: drawingData, isLoading: drawingLoading } = useQuery({
    queryKey: ['drawing_data', couple?.id],
    queryFn: async () => {
      if (!couple?.id || !currentUserId) return null;
      
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + kstOffset);
      const year = kstNow.getFullYear();
      const month = String(kstNow.getMonth() + 1).padStart(2, '0');
      const day = String(kstNow.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      // 1. 먼저 내 그림이 있는지 확인
      const { data: myData, error: myError } = await supabase
        .from('drawing_answers')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('writer_id', currentUserId)
        .eq('question_date', today);

      if (myError) throw myError;

      const hasMyDrawing = myData && myData.length > 0;

      if (!hasMyDrawing) {
        // 2. 내 그림이 없으면 상대방의 데이터는 image_url을 제외하고 가져옴 (네트워크 노출 방지)
        const { data: partnerData, error: partnerError } = await supabase
          .from('drawing_answers')
          .select('id, couple_id, writer_id, question_date, question_text, created_at')
          .eq('couple_id', couple.id)
          .neq('writer_id', currentUserId)
          .eq('question_date', today);

        if (partnerError) throw partnerError;

        const dummyPartnerData = (partnerData || []).map(d => ({
          ...d,
          image_url: 'hidden'
        }));
        
        return [...(myData || []), ...dummyPartnerData] as DrawingAnswer[];
      }

      // 3. 내 그림이 있을 때만 전체(상대방 포함) 그림 데이터를 가져옴
      const { data, error } = await supabase
        .from('drawing_answers')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('question_date', today);

      if (error) throw error;
      return data as DrawingAnswer[];
    },
    enabled: !!couple?.id && !coupleLoading,
    staleTime: 1000 * 60 * 5,
  });

  const drawingQuestion = getTodayDrawingQuestion();
  const myDrawing = drawingData?.find(d => d.writer_id === currentUserId) || null;
  const partnerDrawing = drawingData?.find(d => d.writer_id !== currentUserId) || null;

  const calculateDDay = useCallback(() => {
    if (couple?.anniversary_date) {
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + kstOffset);
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
      queryClient.refetchQueries({ queryKey: ['home_profiles', couple?.id] }),
      queryClient.refetchQueries({ queryKey: ['daily_data', couple?.id] }),
      queryClient.refetchQueries({ queryKey: ['drawing_data', couple?.id] })
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
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'drawing_answers', filter: `couple_id=eq.${couple.id}` }, 
        () => queryClient.invalidateQueries({ queryKey: ['drawing_data', couple.id] })
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
      drawingQuestion,
      myDrawing,
      partnerDrawing,
      loading: profilesLoading || dailyLoading || drawingLoading,
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
