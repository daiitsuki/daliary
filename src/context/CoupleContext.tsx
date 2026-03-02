import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Couple, Profile } from '../types';

interface CoupleContextType {
  couple: Couple | null;
  profile: Profile | null;
  notificationSettings: any | null;
  isCoupleFormed: boolean;
  loading: boolean;
  error: string | null;
  fetchCoupleInfo: () => Promise<void>;
  generateInviteCode: () => Promise<Couple>;
  joinCouple: (code: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signOut: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastUserIdRef = useRef<string | null>(null);

  // React Query for common initial data
  const { data: initData, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['couple_info'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        lastUserIdRef.current = null;
        return null;
      }

      // 세션 정보를 바탕으로 현재 사용자 ID 기록
      lastUserIdRef.current = session.user.id;

      const { data, error } = await supabase.rpc('get_app_init_data');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // 창 포커스 시 자동 재요청 방지
    refetchOnReconnect: false, // 네트워크 재연결 시 자동 재요청 방지
  });

  const couple = initData?.couple || null;
  const profile = initData?.profile || null;
  const notificationSettings = initData?.notification_settings || null;
  const isCoupleFormed = initData?.is_couple_formed || false;

  const fetchCoupleInfo = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Heartbeat Effect: Update last_active_at periodically
  useEffect(() => {
    if (!profile?.id) return;

    const updateActivity = async () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 30000) return;

      try {
        await supabase
          .from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', profile.id);
        
        lastUpdateRef.current = now;
      } catch (err) {
        console.error('Error updating activity:', err);
      }
    };

    updateActivity();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    }, 180000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile?.id]);

  useEffect(() => {
    // Auth 상태 변경 감지 최적화
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUserId = session?.user?.id || null;
      
      // 1. 로그아웃 시 즉시 쿼리 무효화 및 데이터 클리어
      if (event === 'SIGNED_OUT') {
        lastUserIdRef.current = null;
        queryClient.setQueryData(['couple_info'], null);
        queryClient.invalidateQueries({ queryKey: ['couple_info'] });
        return;
      }

      // 2. 로그인 또는 유저 정보 변경 시
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // 실제 사용자 ID가 변경된 경우에만 무효화 수행 (창 포커스 시 동일 유저 세션 체크 무시)
        if (currentUserId !== lastUserIdRef.current) {
          lastUserIdRef.current = currentUserId;
          queryClient.invalidateQueries({ queryKey: ['couple_info'] });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const generateInviteCode = async () => {
    try {
      if (couple) {
        throw new Error('이미 연결된 커플(초대 코드)이 있습니다. 설정에서 연결 해제 후 다시 시도해주세요.');
      }
      
      // More robust random code generation (always 6 characters)
      const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Readable chars (no I, O, 0, 1)
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      const { data: newCouple, error } = await supabase
        .rpc('create_couple_and_link_profile', { invite_code_input: code });

      if (error) {
        if (error.message.includes('ALREADY_HAS_COUPLE')) throw new Error('이미 연결된 커플이 있습니다.');
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['couple_info'] });
      return newCouple;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinCouple = async (code: string) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error: rpcError } = await supabase
        .rpc('join_couple_by_code', { invite_code_input: code });

      if (rpcError) {
        let message = '유효하지 않은 코드입니다.';
        if (rpcError.message.includes('INVALID_CODE')) message = '유효하지 않은 초대 코드입니다.';
        else if (rpcError.message.includes('ALREADY_HAS_COUPLE')) message = '이미 연결된 커플이 있습니다.';
        else if (rpcError.message.includes('COUPLE_FULL')) message = '해당 코드는 이미 사용되었거나 정원이 찼습니다.';
        else message = rpcError.message;
        throw new Error(message);
      }

      await queryClient.invalidateQueries({ queryKey: ['couple_info'] });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const disconnect = async () => {
    try {
      const { error } = await supabase.rpc('delete_couple_and_all_data');
      if (error) throw error;
      
      // 1. Clear game states and couple-related data from localStorage
      const coupleRelatedKeys = [
        'daliary_watermelon_state_v1',
        'daliary_brick_breaker_state_v1',
        'daliary_blind_timer_state_v1',
        'showHolidays',
        'cachedHolidays',
        'holidaysLastUpdated',
        'showAnniversaries',
        'last_settings_save_time'
      ];
      
      coupleRelatedKeys.forEach(key => localStorage.removeItem(key));
      
      // Clear dynamic keys (like level cache)
      if (profile?.id) {
        localStorage.removeItem(`couple_points_level_cache_${profile.id}`);
      }

      // 2. Reset query state immediately to reflect disconnected state in UI
      queryClient.setQueryData(['couple_info'], null);
      await queryClient.invalidateQueries({ queryKey: ['couple_info'] });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Realtime Subscription for Profile changes (to detect linkage/unlinkage)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`profile_changes_${profile.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${profile.id}` 
        },
        (payload) => {
          const oldCoupleId = profile.couple_id;
          const newCoupleId = payload.new.couple_id;

          // If couple_id changed, refetch everything
          if (oldCoupleId !== newCoupleId) {
            console.log('[CoupleContext] Profile change detected (couple_id change), refetching...');
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.couple_id, refetch]);

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <CoupleContext.Provider value={{ 
      couple, 
      profile, 
      notificationSettings,
      isCoupleFormed, 
      loading: queryLoading, 
      error, 
      fetchCoupleInfo, 
      generateInviteCode, 
      joinCouple, 
      disconnect, 
      signOut 
    }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCoupleContext() {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error('useCoupleContext must be used within a CoupleProvider');
  }
  return context;
}