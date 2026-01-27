import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../hooks/useCouple';
import { motion } from 'framer-motion';
import { Heart, Copy, ArrowRight, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { generateInviteCode, joinCouple, loading } = useCouple();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [inputCode, setInputCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      const couple = await generateInviteCode();
      setCreatedCode(couple.invite_code);
      setMode('create');
    } catch (err) {
      setError('코드 생성에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // 혹시 모를 form 제출 방지
    if (!inputCode.trim()) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to join with code:', inputCode);
      await joinCouple(inputCode);
      // 성공 시에만 페이지 이동
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Join error in component:', err);
      // 에러가 발생해도 mode('join')는 유지되므로 이 상태값이 보존되어야 함
      setError(err.message || '유효하지 않은 코드입니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      alert('초대 코드가 복사되었습니다!');
    }
  };

  // 초기 로딩 (처음 마운트될 때만)
  if (loading && mode === 'select' && !actionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-rose-50 text-center"
      >
        <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="text-rose-500 fill-rose-500" size={32} />
        </div>

        {mode === 'select' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">커플 연결하기</h1>
            <p className="text-gray-500 mb-8">연인과 함께 다이어리를 시작해보세요.</p>
            
            <div className="space-y-4">
              <button 
                onClick={handleCreate}
                disabled={actionLoading}
                className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center"
              >
                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                새로운 초대 코드 만들기
              </button>
              <button 
                onClick={() => setMode('join')}
                className="w-full bg-white border-2 border-rose-100 text-rose-400 hover:bg-rose-50 font-bold py-4 rounded-xl transition-all"
              >
                초대 코드 입력하기
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">초대 코드 생성 완료!</h1>
            <p className="text-gray-500 mb-8">이 코드를 연인에게 공유해주세요.</p>

            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 mb-6 relative">
              <p className="text-3xl font-mono font-bold text-gray-700 tracking-wider">
                {createdCode}
              </p>
              <button 
                onClick={handleCopy}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>

            <button 
              onClick={() => navigate('/home')}
              className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center"
            >
              다이어리 시작하기 <ArrowRight className="ml-2" size={20} />
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">초대 코드 입력</h1>
            <p className="text-gray-500 mb-8">공유받은 코드를 입력해주세요.</p>

            <input
              type="text"
              placeholder="코드 6자리 입력"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-center text-xl tracking-widest text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200 mb-4 font-mono uppercase"
            />

            {error && (
              <motion.div 
                key="error-msg"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-500 text-sm py-3 px-4 rounded-xl mb-4 font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="flex space-x-3">
              <button 
                onClick={() => setMode('select')}
                className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-xl transition-all"
              >
                이전
              </button>
              <button 
                onClick={handleJoin}
                disabled={actionLoading}
                className="flex-[2] bg-rose-400 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center"
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : '연결하기'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
