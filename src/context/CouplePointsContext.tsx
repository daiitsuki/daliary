import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
  const { couple, profile, loading: coupleLoading } = useCoupleContext();
  const queryClient = useQueryClient();

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

  // React Query for Points Data
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['couple_points', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return { total: 0, history: [] };
      const [totalRes, historyRes] = await Promise.all([
        supabase.rpc('get_couple_total_points', { target_couple_id: couple.id }),
        supabase
          .from('point_history')
          .select('id, created_at, type, points, description')
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);
      if (totalRes.error) throw totalRes.error;
      if (historyRes.error) throw historyRes.error;
      return { total: Number(totalRes.data) || 0, history: historyRes.data as PointLog[] };
    },
    enabled: !!couple?.id && !coupleLoading,
  });

  // React Query for Attendance Data
  const { data: hasCheckedIn = false, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !couple) return false;
      const today = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replace(/\. /g, '-').replace(/\./g, '');

      const { data, error } = await supabase
        .from('attendances')
        .select('id')
        .eq('user_id', profile.id)
        .eq('check_in_date', today)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!profile?.id && !!couple?.id && !coupleLoading,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !couple || hasCheckedIn) return false;
      const { error } = await supabase
        .from('attendances')
        .insert({
          couple_id: couple.id,
          user_id: profile.id
        });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['couple_points', couple?.id] });
    },
  });

  const totalPoints = pointsData?.total || 0;
  const history = pointsData?.history || [];
  const levelInfo = calculateLevel(totalPoints);

  // Real-time subscriptions
  useEffect(() => {
    if (!couple?.id) return;

    const pointsChannel = supabase
      .channel(`points-realtime-${couple.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'point_history',
        filter: `couple_id=eq.${couple.id}` 
      }, () => queryClient.invalidateQueries({ queryKey: ['couple_points', couple.id] }))
      .subscribe();

    return () => {
      supabase.removeChannel(pointsChannel);
    };
  }, [couple?.id, queryClient]);

  return (
    <CouplePointsContext.Provider value={{ 
      totalPoints, 
      history, 
      levelInfo, 
      hasCheckedIn, 
      loading: pointsLoading || attendanceLoading, 
      refreshPoints: async () => { await queryClient.invalidateQueries({ queryKey: ['couple_points'] }) }, 
      refreshAttendance: async () => { await queryClient.invalidateQueries({ queryKey: ['attendance'] }) },
      checkIn: () => checkInMutation.mutateAsync()
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
