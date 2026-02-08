import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { TOOL_ICONS, ICON_KEYS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, url: string, iconKey: string) => void;
  initialData?: { title: string; url: string; iconKey: string } | null;
}

export default function AddToolModal({ isOpen, onClose, onAdd, initialData }: AddToolModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('globe');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url);
        setSelectedIcon(initialData.iconKey);
      } else {
        setTitle('');
        setUrl('');
        setSelectedIcon('globe');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = 'https://' + url;
    }

    // Simple URL validation
    try {
      new URL(finalUrl);
    } catch (_) {
      setError('올바른 URL 형식이 아닙니다.');
      return;
    }

    onAdd(title, finalUrl, selectedIcon);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-800">
                {initialData ? '바로가기 수정' : '바로가기 추가'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">이름</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-300 text-gray-800 text-sm"
                  placeholder="예: 네이버"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-300 text-gray-800 text-sm font-mono"
                  placeholder="naver.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">아이콘 선택</label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-xl custom-scrollbar">
                  {ICON_KEYS.map((key) => {
                    const IconComponent = TOOL_ICONS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedIcon(key)}
                        className={`aspect-square flex items-center justify-center rounded-lg transition-all ${
                          selectedIcon === key 
                            ? 'bg-rose-500 text-white shadow-md scale-105' 
                            : 'bg-white text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-500 font-medium text-center">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full bg-gray-800 text-white p-3 rounded-xl font-bold hover:bg-gray-700 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <Check size={18} />
                <span>{initialData ? '수정하기' : '추가하기'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
