import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleContext } from './CoupleContext';

export interface PointLog {
  id: string;
  created_at: string;
  type: string;
  points: number;
  description: string;
}

interface LevelInfo {
  level: number;
  nextLevelExp: number;
  currentExp: number;
  progress: number;
}

interface CouplePointsContextType {
  totalPoints: number;
  history: PointLog[];
  levelInfo: LevelInfo | null;
  hasCheckedIn: boolean;
  loading: boolean;
  refreshPoints: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  checkIn: () => Promise<boolean>;
}

const CouplePointsContext = createContext<CouplePointsContextType | undefined>(undefined);

export function CouplePointsProvider({ children }: { children: ReactNode }) {
  const { couple } = useCoupleContext();
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<PointLog[]>([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const calculateLevel = (points: number): LevelInfo => {
    let level = 1;
    let accumulatedExp = 0;

    while (true) {
      const requiredExp = Math.round(1.95 * Math.pow(level, 1.5) + 50);
      if (points < accumulatedExp + requiredExp) {
        const currentExp = points - accumulatedExp;
        const progress = (currentExp / requiredExp) * 100;
        return { level, nextLevelExp: requiredExp, currentExp, progress };
      }
      accumulatedExp += requiredExp;
      level++;
      if (level > 1000) {
        return { level, nextLevelExp: requiredExp, currentExp: points - accumulatedExp, progress: 100 };
      }
    }
  };

  const fetchPoints = useCallback(async () => {
    if (!couple?.id) return;
    try {
      const [totalRes, historyRes] = await Promise.all([
        supabase.rpc('get_couple_total_points', { target_couple_id: couple.id }),
        supabase
          .from('point_history')
          .select('*')
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (totalRes.error) throw totalRes.error;
      if (historyRes.error) throw historyRes.error;

      setTotalPoints(totalRes.data || 0);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error('Error fetching points:', err);
    }
  }, [couple?.id]);

  const fetchAttendance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !couple) return;

    try {
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
    }
  }, [couple?.id]);

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
      
      // 즉시 상태 업데이트를 위한 동기화
      await Promise.all([fetchAttendance(), fetchPoints()]);
      return true;
    } catch (err) {
      console.error('Error checking in:', err);
      return false;
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPoints(), fetchAttendance()]);
    setLoading(false);
  }, [fetchPoints, fetchAttendance]);

  useEffect(() => {
    if (couple?.id) {
      loadAll();

      // Real-time subscriptions
      const pointsChannel = supabase
        .channel('points-realtime-global')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'point_history',
          filter: `couple_id=eq.${couple.id}` 
        }, fetchPoints)
        .subscribe();

      const attendanceChannel = supabase
        .channel('attendance-realtime-global')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'attendances',
          filter: `couple_id=eq.${couple.id}`
        }, fetchAttendance)
        .subscribe();

      return () => {
        supabase.removeChannel(pointsChannel);
        supabase.removeChannel(attendanceChannel);
      };
    } else {
      setTotalPoints(0);
      setHistory([]);
      setHasCheckedIn(false);
      setLoading(false);
    }
  }, [couple?.id, fetchPoints, fetchAttendance, loadAll]);

  const levelInfo = calculateLevel(totalPoints);

  return (
    <CouplePointsContext.Provider value={{ 
      totalPoints, 
      history, 
      levelInfo, 
      hasCheckedIn, 
      loading, 
      refreshPoints: fetchPoints, 
      refreshAttendance: fetchAttendance,
      checkIn 
    }}>
      {children}
    </CouplePointsContext.Provider>
  );
}

export function useCouplePointsContext() {
  const context = useContext(CouplePointsContext);
  if (context === undefined) {
    throw new Error('useCouplePointsContext must be used within a CouplePointsProvider');
  }
  return context;
}
