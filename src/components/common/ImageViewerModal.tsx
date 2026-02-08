import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title
}) => {
  // 모달 오픈 시 스크롤 방지
  useEffect(() => {
    if (isOpen && imageUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, imageUrl]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-pointer"
          />

          {/* Controls */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pointer-events-auto"
            >
              <h3 className="text-white text-sm font-black tracking-tight drop-shadow-md">{title}</h3>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 pointer-events-auto"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(imageUrl, title);
                }}
                className="p-3 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all active:scale-90"
                title="이미지 저장"
              >
                <Download size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
                title="닫기"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>

          {/* Image Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full h-full flex items-center justify-center z-10 p-4 pointer-events-none"
          >
            <img
              src={imageUrl}
              alt={title || "Image Viewer"}
              className="max-w-full max-h-[85vh] object-contain shadow-[0_0_60px_rgba(0,0,0,0.6)] rounded-xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// 다운로드 헬퍼 함수
const handleDownload = async (imageUrl: string, title?: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'image'}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

export default ImageViewerModal;
