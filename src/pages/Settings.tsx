import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';
import imageCompression from 'browser-image-compression';
import { ArrowLeft, Camera, LogOut, Loader2, Calendar } from 'lucide-react';
import { Profile } from '../types';

export default function Settings() {
  const navigate = useNavigate();
  const { couple, fetchCoupleInfo, signOut } = useCouple();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setNickname(data.nickname || '');
      }

      if (couple?.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
    };
    loadData();
  }, [couple]);

  // 프로필 사진 변경
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setLoading(true);
      
      // 압축
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      // 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${profile.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('diary-images') // 기존 버킷 재사용
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('diary-images')
        .getPublicUrl(fileName);

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // 상태 업데이트
      setProfile({ ...profile, avatar_url: publicUrl });
      alert('프로필 사진이 변경되었습니다.');
    } catch (error) {
      console.error(error);
      alert('사진 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  // 정보 저장 (닉네임, 기념일)
  const handleSave = async () => {
    if (!profile || !couple) return;
    setLoading(true);

    try {
      // 1. 닉네임 업데이트
      if (nickname !== profile.nickname) {
        const { error } = await supabase
          .from('profiles')
          .update({ nickname })
          .eq('id', profile.id);
        if (error) throw error;
      }

      // 2. 기념일 업데이트
      if (anniversary !== couple.anniversary_date) {
        const { error } = await supabase
          .from('couples')
          .update({ anniversary_date: anniversary })
          .eq('id', couple.id);
        if (error) throw error;
      }

      await fetchCoupleInfo(); // 전역 상태 갱신
      alert('저장되었습니다.');
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 커플 연결 해제 및 데이터 전체 삭제
  const handleDisconnect = async () => {
    if (!confirm('정말 연결을 끊으시겠습니까? 우리만의 모든 일기, 사진, 포인트 기록이 영구적으로 삭제되며 복구할 수 없습니다.')) return;
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('delete_couple_and_all_data');

      if (error) throw error;

      alert('모든 데이터가 삭제되고 연결이 해제되었습니다.');
      // 전역 상태 초기화 및 이동
      await fetchCoupleInfo();
      navigate('/onboarding');
    } catch (error: any) {
      console.error(error);
      alert('해제 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">설정</h1>
        <button onClick={handleSave} disabled={loading} className="text-rose-500 font-medium">
          저장
        </button>
      </header>

      <main className="p-6 space-y-8">
        
        {/* Profile Section */}
        <section className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${profile?.id || 'default'}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full shadow-md hover:bg-gray-700 transition-colors"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange}
            />
          </div>
          
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-white p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-300 text-gray-800"
              placeholder="닉네임을 입력하세요"
            />
          </div>
        </section>

        {/* Couple Settings */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">커플 설정</h2>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-gray-700">
              <Calendar size={20} className="text-rose-400" />
              <span className="font-medium">처음 만난 날</span>
            </div>
            <input
              type="date"
              value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)}
              className="bg-transparent text-right font-medium text-gray-600 focus:outline-none"
            />
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">초대 코드</p>
            <p className="font-mono text-lg font-bold text-gray-700 tracking-widest">
              {couple?.invite_code || '------'}
            </p>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6 pt-10 flex flex-col items-center">
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-50 text-gray-600 p-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>

          <button 
            onClick={handleDisconnect}
            className="text-[10px] text-gray-300 hover:text-red-300 transition-colors underline underline-offset-2"
          >
            커플 연결 해제
          </button>
        </section>

      </main>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}
    </div>
  );
}

// Icon Helper
