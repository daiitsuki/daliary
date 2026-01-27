import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { couple, loading: coupleLoading } = useCouple();
  const location = useLocation();

  // 1. Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Loading State
  // 온보딩 페이지에서는 컨텍스트의 로딩 상태 때문에 페이지가 언마운트되지 않도록 함
  if (authLoading || (session && coupleLoading && location.pathname !== '/onboarding')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    );
  }

  // 3. Not Logged In -> Redirect to Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 4. Logged In, But No Couple -> Redirect to Onboarding (if not already there)
  if (!couple && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 5. Logged In, Has Couple -> Redirect to Home (if trying to access Onboarding)
  if (couple && location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
