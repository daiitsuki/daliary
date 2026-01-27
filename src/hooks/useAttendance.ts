import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';

export const useAttendance = () => {
  const { couple } = useCouple();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkTodayAttendance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !couple) return;

    try {
      // 한국 시간 기준으로 오늘 날짜 구하기 (YYYY-MM-DD)
      const now = new Date();
      const kstDate = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now).replace(/\. /g, '-').replace(/\./g, '');

      const { data, error } = await supabase
        .from('attendances')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_in_date', kstDate)
        .maybeSingle();

      if (error) throw error;
      setHasCheckedIn(!!data);
    } catch (err) {
      console.error('Error checking attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  const checkIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !couple || hasCheckedIn) return false;

    try {
      const { error } = await supabase
        .from('attendances')
        .insert({
          couple_id: couple.id,
          user_id: user.id
        });

      if (error) throw error;
      setHasCheckedIn(true);
      return true;
    } catch (err) {
      console.error('Error checking in:', err);
      return false;
    }
  };

  useEffect(() => {
    checkTodayAttendance();
  }, [checkTodayAttendance]);

  return { hasCheckedIn, loading, checkIn, refresh: checkTodayAttendance };
};
