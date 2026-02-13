import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCouple } from '../hooks/useCouple';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { couple, loading, profile } = useCouple();
  const location = useLocation();

  // 1. Loading State
  // 초기 로딩 중이거나 아직 프로필 확인이 안 된 경우 (온보딩 제외)
  if (loading && location.pathname !== '/onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    );
  }

  // 2. Not Logged In -> Redirect to Login
  // loading이 끝났는데 profile이 없으면 로그인되지 않은 상태
  if (!loading && !profile) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logged In, But No Couple -> Redirect to Onboarding (if not already there)
  if (!couple && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 4. Logged In, Has Couple -> Redirect to Home (if trying to access Onboarding)
  if (couple && location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
