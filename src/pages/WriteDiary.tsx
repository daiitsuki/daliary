import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';
import imageCompression from 'browser-image-compression';
import { ArrowLeft, Smile, Frown, Meh, Heart, Loader2, Image as ImageIcon, X } from 'lucide-react';

const MOODS = [
  { id: 'happy', icon: Smile, label: '행복', color: 'text-yellow-500 bg-yellow-100' },
  { id: 'sad', icon: Frown, label: '슬픔', color: 'text-blue-500 bg-blue-100' },
  { id: 'soso', icon: Meh, label: '그럭저럭', color: 'text-gray-500 bg-gray-100' },
  { id: 'love', icon: Heart, label: '설렘', color: 'text-pink-500 bg-pink-100' },
];

export default function WriteDiary() {
  const navigate = useNavigate();
  const { couple } = useCouple();
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 20MB 초과 제한
    if (file.size > 20 * 1024 * 1024) {
      alert('이미지 용량이 너무 큽니다. (최대 20MB)');
      return;
    }

    setIsCompressing(true);

    try {
      // 압축 옵션
      const options = {
        maxSizeMB: 1, // 1MB 이하로 압축 목표
        maxWidthOrHeight: 1920, // FHD 기준 리사이징
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      
      setImageFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Image compression failed:', error);
      alert('이미지 처리에 실패했습니다. 원본을 사용합니다.');
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !imageFile) || !couple) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      let publicImageUrl = null;

      // 1. 이미지 업로드 처리
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('diary-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Public URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('diary-images')
          .getPublicUrl(fileName);
          
        publicImageUrl = publicUrl;
      }

      // 2. DB Insert
      const { error } = await supabase.from('diaries').insert({
        couple_id: couple.id,
        writer_id: user.id,
        content,
        mood: selectedMood,
        image_url: publicImageUrl,
      });

      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('일기 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-6">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">일기 작성</h1>
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && !imageFile) || loading || isCompressing}
          className="text-rose-400 font-bold text-sm disabled:opacity-30 transition-opacity"
        >
          {loading ? <Loader2 className="animate-spin size-4" /> : '저장'}
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col max-w-xl mx-auto w-full space-y-8">
        {/* Mood Selection */}
        <section>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">오늘의 기분</p>
          <div className="flex justify-between gap-3">
            {MOODS.map((mood) => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex flex-col items-center flex-1 py-4 rounded-[24px] transition-all border ${
                    isSelected ? 'bg-white shadow-sm border-rose-200 scale-105' : 'bg-gray-50 border-transparent text-gray-400'
                  }`}
                >
                  <Icon size={24} className={isSelected ? mood.color.split(' ')[0] : 'text-gray-300'} />
                  <span className={`text-[10px] mt-2 font-bold ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Image Preview & Upload Button */}
        <section>
           <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">기록할 사진</p>
           {isCompressing ? (
             <div className="w-full h-48 bg-gray-50 rounded-[28px] flex flex-col items-center justify-center text-gray-300 border border-dashed border-gray-100">
                <Loader2 className="animate-spin mb-2" />
                <span className="text-[10px] font-bold">이미지 최적화 중...</span>
             </div>
           ) : previewUrl ? (
            <div className="relative w-full aspect-video rounded-[28px] overflow-hidden shadow-sm group border border-gray-50">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                   onClick={removeImage}
                   className="bg-white/90 text-red-500 p-3 rounded-full hover:bg-white transition-colors shadow-lg"
                 >
                   <X size={20} />
                 </button>
              </div>
            </div>
           ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video bg-gray-50 border border-dashed border-gray-200 rounded-[28px] text-gray-300 flex flex-col items-center justify-center hover:bg-gray-100/50 transition-all gap-2 group"
            >
              <ImageIcon size={32} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
            </button>
           )}
           <input 
             type="file" 
             ref={fileInputRef}
             className="hidden" 
             accept="image/*"
             onChange={handleImageChange}
           />
        </section>

        {/* Text Area */}
        <section className="flex-1 flex flex-col min-h-[200px]">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">글 남기기</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루는 어땠나요?"
            className="flex-1 w-full bg-white p-6 rounded-[28px] border border-gray-100 resize-none focus:outline-none focus:border-rose-100 text-gray-600 text-sm leading-relaxed placeholder:text-gray-300"
          />
        </section>
      </main>
    </div>
  );
}