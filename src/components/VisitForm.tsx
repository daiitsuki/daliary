import React, { useState, useRef } from 'react';
import { useVisitVerification, KOREA_REGIONS } from '../hooks/useVisitVerification';
import { Camera, X, Calendar, MapPin } from 'lucide-react';

interface VisitFormProps {
  placeId: string;
  placeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const VisitForm = ({ placeId, placeName, onClose, onSuccess }: VisitFormProps) => {
  const { verifyVisit, isSubmitting, error } = useVisitVerification();
  
  const [region, setRegion] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default today
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await verifyVisit({
      placeId,
      date: new Date(date),
      file: selectedFile,
      comment,
      region
    });

    if (success) {
      alert('방문 인증이 완료되었습니다!');
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            {placeName} 방문 인증
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> 방문 날짜
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* 2. Region Selection (Chips) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">행정구역 선택</label>
              <div className="flex flex-wrap gap-2">
                {KOREA_REGIONS.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      region === r
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {!region && <p className="text-xs text-red-400 mt-1 pl-1">* 행정구역을 선택해주세요.</p>}
            </div>

            {/* 3. Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">인증 사진</label>
              <div 
                className={`relative w-full h-48 bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden ${
                  !previewUrl ? 'border-gray-300' : 'border-indigo-300'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">터치하여 사진 업로드</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* 4. Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">한 줄 평</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="장소에 대한 간단한 느낌을 남겨주세요."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
              />
            </div>

            {/* Error Message */}
            {error && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !region}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 active:transform active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? '저장 중...' : '방문 완료 인증하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitForm;
