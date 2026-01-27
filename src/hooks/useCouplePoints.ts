import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';

export interface PointLog {
  id: string;
  created_at: string;
  type: string;
  points: number;
  description: string;
}

export const useCouplePoints = () => {
  const { couple } = useCouple();
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    if (!couple?.id) return;

    try {
      const { data, error } = await supabase
        .from('point_history')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setHistory(data);
        const total = data.reduce((sum, log) => sum + log.points, 0);
        setTotalPoints(total);
      }
    } catch (err) {
      console.error('Error fetching points:', err);
    } finally {
      setLoading(false);
    }
  }, [couple?.id]);

  useEffect(() => {
    fetchPoints();
    
    if (!couple?.id) return;

    // 실시간 업데이트 구독
    const channel = supabase
      .channel('points-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'point_history',
        filter: `couple_id=eq.${couple.id}` 
      }, fetchPoints)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [couple?.id, fetchPoints]);

  // 레벨 계산 로직: 5 * n * (n + 1) / 2
  // n = (-5 + sqrt(25 + 40 * total)) / 10
  const calculateLevel = (points: number) => {
    if (points < 5) return { level: 0, nextLevelExp: 5, currentExp: points, progress: (points / 5) * 100 };
    
    const n = Math.floor((-5 + Math.sqrt(25 + 40 * points)) / 10);
    const currentLevelTotal = (5 * n * (n + 1)) / 2;
    const nextLevelTotal = (5 * (n + 1) * (n + 2)) / 2;
    
    const expInLevel = points - currentLevelTotal;
    const expNeeded = nextLevelTotal - currentLevelTotal;
    const progress = Math.min((expInLevel / expNeeded) * 100, 100);

    return {
      level: n,
      nextLevelExp: expNeeded,
      currentExp: expInLevel,
      progress
    };
  };

  return { totalPoints, history, levelInfo: calculateLevel(totalPoints), loading, refresh: fetchPoints };
};
