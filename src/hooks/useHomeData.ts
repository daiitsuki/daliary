import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';

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

interface ProfileData {
  id: string;
  nickname: string;
  avatar_url: string | null;
}

export const useHomeData = () => {
  const { couple, loading: coupleLoading } = useCouple();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [dDay, setDDay] = useState(0);
  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<ProfileData | null>(null);
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [myAnswer, setMyAnswer] = useState<Answer | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (couple?.anniversary_date) {
      const start = new Date(couple.anniversary_date).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
      setDDay(diff);
    }
  }, [couple]);

  const fetchProfiles = useCallback(async () => {
    if (!couple?.id || !currentUserId) return;
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('couple_id', couple.id);

      if (profiles) {
        let me = profiles.find(p => p.id === currentUserId) || null;
        const partner = profiles.find(p => p.id !== currentUserId) || null;

        // Sync Google avatar if missing in DB
        if (me && !me.avatar_url) {
          const { data: { user } } = await supabase.auth.getUser();
          const googleAvatar = user?.user_metadata?.avatar_url;
          if (googleAvatar) {
            me = { ...me, avatar_url: googleAvatar };
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
    }
  }, [couple?.id, currentUserId]);

  useEffect(() => {
    if (couple?.id && currentUserId) {
      fetchProfiles();
      fetchDailyData();
    }
  }, [fetchProfiles, fetchDailyData, couple?.id, currentUserId]);

  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase
      .channel('home-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `couple_id=eq.${couple.id}` }, fetchDailyData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `couple_id=eq.${couple.id}` }, fetchProfiles)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [couple?.id, fetchDailyData, fetchProfiles]);

  return {
    couple,
    currentUserId,
    loading: coupleLoading || dataLoading,
    dDay,
    todayQuestion,
    partnerProfile,
    myProfile,
    myAnswer,
    partnerAnswer,
    refresh: fetchDailyData
  };
};
