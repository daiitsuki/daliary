import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Couple, Profile } from '../types';

interface CoupleContextType {
  couple: Couple | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchCoupleInfo: () => Promise<void>;
  generateInviteCode: () => Promise<Couple>;
  joinCouple: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const fetchCoupleInfo = useCallback(async () => {
    try {
      // setLoading(true); // Don't trigger loading on refresh to avoid flickering
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCouple(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // 프로필이 없는 경우 (회원가입 직후 등) 무시
        setCouple(null);
        setProfile(null);
      } else {
        setProfile(profileData);
        
        if (profileData?.couple_id) {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('*')
            .eq('id', profileData.couple_id)
            .single();

          if (coupleError) throw coupleError;
          setCouple(coupleData);
        } else {
          setCouple(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching couple info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Heartbeat Effect: Update last_active_at periodically
  useEffect(() => {
    if (!profile?.id) return;

    const updateActivity = async () => {
      const now = Date.now();
      // Throttle: Only update if at least 30 seconds have passed since last update
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

    // Initial update
    updateActivity();

    // Periodic update (every 3 minutes)
    // "Online" threshold is 5 minutes, so 3 minute interval is efficient.
    const intervalId = setInterval(() => {
      // Only update if the page is visible to save DB writes
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    }, 180000);

    // Update on visibility change (returning to app)
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
    fetchCoupleInfo();

    // Auth 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCoupleInfo();
    });

    return () => subscription.unsubscribe();
  }, [fetchCoupleInfo]);

  const generateInviteCode = async () => {
    try {
      setLoading(true);

      // 클라이언트 측 중복 생성 방지
      if (couple) {
        throw new Error('이미 연결된 커플(초대 코드)이 있습니다. 설정에서 연결 해제 후 다시 시도해주세요.');
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: newCouple, error } = await supabase
        .rpc('create_couple_and_link_profile', { invite_code_input: code });

      if (error) {
        if (error.message.includes('ALREADY_HAS_COUPLE')) {
          throw new Error('이미 연결된 커플이 있습니다.');
        }
        throw error;
      }

      setCouple(newCouple); // 상태 즉시 업데이트
      return newCouple;
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinCouple = async (code: string) => {
    try {
      setLoading(true);
      // 컨텍스트의 error 상태는 초기화하지만 loading은 유지
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data: updatedCouple, error: rpcError } = await supabase
        .rpc('join_couple_by_code', { invite_code_input: code });

      if (rpcError) {
        console.error('RPC Error details:', rpcError);
        let message = '유효하지 않은 코드입니다.';
        
        // 데이터베이스에서 정의한 에러 메시지 매칭
        if (rpcError.message.includes('INVALID_CODE')) message = '유효하지 않은 초대 코드입니다.';
        else if (rpcError.message.includes('ALREADY_HAS_COUPLE')) message = '이미 연결된 커플이 있습니다.';
        else if (rpcError.message.includes('COUPLE_FULL')) message = '해당 코드는 이미 사용되었거나 정원이 찼습니다.';
        else message = rpcError.message; // 예상치 못한 에러 메시지도 전달
        
        throw new Error(message);
      }

      setCouple(updatedCouple);
      // 성공 시에만 fetchCoupleInfo 호출하여 상태를 완전히 동기화
      await fetchCoupleInfo();
    } catch (err: any) {
      console.error('Final Context error:', err.message);
      setError(err.message);
      throw err; // 상위 컴포넌트(Onboarding)에서 catch 하도록 재전송
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCouple(null);
    setProfile(null);
  };

  return (
    <CoupleContext.Provider value={{ couple, profile, loading, error, fetchCoupleInfo, generateInviteCode, joinCouple, signOut }}>
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