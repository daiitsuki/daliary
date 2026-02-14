import React, { useState, useRef, useEffect } from 'react';
import { useVisitVerification } from '../hooks/useVisitVerification';
import { KOREA_REGIONS, SUB_REGIONS, METROPOLITAN_CITIES } from '../constants/regions';
import { Camera, X, MapPin, Check, ChevronRight, Calendar } from 'lucide-react';
import DatePicker from './common/DatePicker';

interface VisitFormProps {
  placeId: string;
  placeName: string;
  placeAddress?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const VisitForm = ({ placeId, placeName, placeAddress, onClose, onSuccess }: VisitFormProps) => {
  const { verifyVisit, isSubmitting, error } = useVisitVerification();
  
  const [region, setRegion] = useState('');
  const [subRegion, setSubRegion] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (placeAddress) {
      const parts = placeAddress.split(' ');
      if (parts.length >= 1) {
        const firstPart = parts[0];
        let matchedRegion = '';
        if (firstPart.includes('서울')) matchedRegion = '서울';
        else if (firstPart.includes('부산')) matchedRegion = '부산';
        else if (firstPart.includes('대구')) matchedRegion = '대구';
        else if (firstPart.includes('인천')) matchedRegion = '인천';
        else if (firstPart.includes('광주')) matchedRegion = '광주';
        else if (firstPart.includes('대전')) matchedRegion = '대전';
        else if (firstPart.includes('울산')) matchedRegion = '울산';
        else if (firstPart.includes('세종')) matchedRegion = '세종';
        else if (firstPart.includes('경기')) matchedRegion = '경기';
        else if (firstPart.includes('강원')) matchedRegion = '강원';
        else if (firstPart.includes('충북') || firstPart.includes('충청북도')) matchedRegion = '충북';
        else if (firstPart.includes('충남') || firstPart.includes('충청남도')) matchedRegion = '충남';
        else if (firstPart.includes('전북') || (firstPart.includes('전라북') && !firstPart.includes('특별자치도'))) matchedRegion = '전북';
        else if (firstPart.includes('전북특별자치도')) matchedRegion = '전북';
        else if (firstPart.includes('전남') || firstPart.includes('전라남도')) matchedRegion = '전남';
        else if (firstPart.includes('경북') || firstPart.includes('경상북도')) matchedRegion = '경북';
        else if (firstPart.includes('경남') || firstPart.includes('경상남도')) matchedRegion = '경남';
        else if (firstPart.includes('제주')) matchedRegion = '제주';

        if (matchedRegion && KOREA_REGIONS.includes(matchedRegion)) {
          setRegion(matchedRegion);
          if (!METROPOLITAN_CITIES.includes(matchedRegion) && parts.length >= 2) {
            const secondPart = parts[1];
            const subRegions = SUB_REGIONS[matchedRegion] || [];
            const matchedSubRegion = subRegions.find(sr => 
              secondPart.includes(sr) || sr.includes(secondPart)
            );
            if (matchedSubRegion) {
              setSubRegion(matchedSubRegion);
            }
          }
        }
      }
    }
  }, [placeAddress]);

  // 뒤로가기 시 모달 닫기 로직
  useEffect(() => {
    window.history.pushState({ modal: "visit-form" }, "");
    
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal !== "visit-form") {
        onClose();
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.modal === "visit-form") {
        window.history.back();
      }
    };
  }, [onClose]);

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
      region,
      subRegion: subRegion || undefined
    });

    if (success) {
      alert('방문 인증이 완료되었습니다!');
      onSuccess();
    }
  };

  const handleRegionSelect = (r: string) => {
    setRegion(r);
    setSubRegion('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              방문 인증하기
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-1">{placeName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <form id="visit-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Date Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" /> 방문 날짜
              </label>
              <DatePicker 
                value={date}
                onChange={setDate}
                variant="calendar"
              />
            </div>

            {/* 2. Photo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-400" /> 인증 사진
              </label>
              <div 
                className={`group relative w-full aspect-video md:h-52 bg-gray-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  previewUrl ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 hover:border-rose-300 hover:bg-rose-50/10'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        사진 변경하기
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-rose-400 transition-colors">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">터치하여 사진 업로드</span>
                  </div>
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

            {/* 3. Region Selection (Chips) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" /> 행정구역 선택
                </span>
                {!region && <span className="text-[10px] text-rose-500 font-medium">* 필수 선택</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {KOREA_REGIONS.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => handleRegionSelect(r)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      region === r
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-500'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sub-Region Selection (if applicable) */}
            {region && SUB_REGIONS[region] && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-rose-400" /> 상세 지역 선택
                  </span>
                  {!subRegion && <span className="text-[10px] text-rose-500 font-medium">* 필수 선택</span>}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUB_REGIONS[region].map((sr) => (
                    <button
                      type="button"
                      key={sr}
                      onClick={() => setSubRegion(sr)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        subRegion === sr
                          ? 'bg-rose-400 border-rose-400 text-white shadow-md'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-400'
                      }`}
                    >
                      {sr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 rounded-xl text-xs font-bold text-rose-500 text-center animate-pulse">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-gray-50 bg-white shrink-0 safe-area-bottom">
          <button
            form="visit-form"
            type="submit"
            disabled={isSubmitting || !region || (SUB_REGIONS[region] && !subRegion)}
            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-base hover:bg-rose-600 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-rose-100 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" strokeWidth={2.5} />
                방문 인증 완료
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VisitForm;