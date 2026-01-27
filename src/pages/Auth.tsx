import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          // 카카오의 경우 닉네임 동의 항목 설정이 필요할 수 있습니다.
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-rose-50 text-center"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-rose-100 p-4 rounded-full mb-6">
            <Heart className="text-rose-500 fill-rose-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Daliary 시작하기
          </h1>
          <p className="text-gray-500 text-sm">
            우리만의 소중한 추억을 기록해보세요.
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Login Button */}
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center relative"
          >
             {/* Simple Google Icon SVG */}
            <svg className="w-5 h-5 absolute left-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm">Google 계정으로 계속하기</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-sm bg-red-50 py-2 rounded-lg px-4">
            로그인 오류: {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="animate-spin text-rose-400" />
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </motion.div>
    </div>
  );
}