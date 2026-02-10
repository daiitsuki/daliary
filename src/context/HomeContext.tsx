import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const { couple, loading: coupleLoading } = useCouple();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const [dDay, setDDay] = useState(0);
  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [myAnswer, setMyAnswer] = useState<Answer | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

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

  const fetchProfiles = useCallback(async () => {
    if (!couple?.id || !currentUserId) return;
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', couple.id);

      if (profiles) {
        let me = profiles.find(p => p.id === currentUserId) || null;
        const partner = profiles.find(p => p.id !== currentUserId) || null;

        // DB에 사진이 없는 경우 Google 프로필 사진과 자동 동기화
        if (me && !me.avatar_url) {
          const { data: { user } } = await supabase.auth.getUser();
          const googleAvatar = user?.user_metadata?.avatar_url;
          if (googleAvatar) {
            me = { ...me, avatar_url: googleAvatar };
            // 비동기로 DB 업데이트 (기다리지 않음)
            supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', currentUserId).then();
          }
        }

        setMyProfile(me);
        setPartnerProfile(partner);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  }, [couple?.id, currentUserId]);

  const fetchDailyData = useCallback(async () => {
    if (!couple?.id || !currentUserId) return;

    try {
      const today = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replace(/\. /g, '-').replace(/\./g, '');

      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('publish_date', today)
        .maybeSingle();

      if (question) {
        setTodayQuestion(question as Question);
        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('couple_id', couple.id)
          .eq('question_id', question.id);

        if (answers) {
          setMyAnswer(answers.find(a => a.writer_id === currentUserId) || null);
          setPartnerAnswer(answers.find(a => a.writer_id !== currentUserId) || null);
        }
      } else {
        setTodayQuestion({ id: 'dummy-q', content: '아직 오늘의 질문이 준비되지 않았어요. 새로운 질문을 기다려주세요!' });
      }
    } catch (err) {
      console.error('Error fetching daily data:', err);
    } finally {
      setDataLoading(false);
      setHasLoaded(true);
    }
  }, [couple?.id, currentUserId]);

  const refresh = useCallback(async () => {
    // 로딩 상태를 최소화하기 위해 병렬로 실행하되, 데이터가 있을 때만 처리
    await Promise.all([fetchProfiles(), fetchDailyData()]);
  }, [fetchProfiles, fetchDailyData]);

  useEffect(() => {
    if (couple?.id && currentUserId && !hasLoaded) {
      calculateDDay();
      refresh().then(() => setHasLoaded(true));
    }
  }, [couple?.id, currentUserId, hasLoaded, calculateDDay, refresh]);

  // Realtime Sync
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase
      .channel(`home_sync_${couple.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'answers', filter: `couple_id=eq.${couple.id}` }, 
        fetchDailyData
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `couple_id=eq.${couple.id}` }, 
        fetchProfiles
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [couple?.id, fetchDailyData, fetchProfiles]);

  return (
    <HomeContext.Provider value={{
      dDay,
      todayQuestion,
      partnerProfile,
      myProfile,
      myAnswer,
      partnerAnswer,
      loading: coupleLoading || dataLoading,
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
