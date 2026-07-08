import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, AlignLeft } from "lucide-react";
import { TimetableBlock } from "../../hooks";
import { useEffect, useState } from "react";
import Button from "../common/Button";

interface PartnerBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: TimetableBlock | null;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const PartnerBlockModal = ({ isOpen, onClose, block }: PartnerBlockModalProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  if (!block) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-sm bg-white rounded-t-[32px] md:rounded-[32px] shadow-xl flex flex-col overflow-hidden"
          >
            {/* Header with color bar */}
            <div className="h-3 w-full shrink-0" style={{ backgroundColor: block.color }} />
            <div className="px-6 py-5 flex items-start justify-between bg-white/80 backdrop-blur-xl shrink-0">
              <div className="flex-1 pr-4">
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black mb-2" style={{ backgroundColor: block.color + "20", color: block.color }}>
                  {DAYS[block.day_of_week]}요일
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 leading-tight tracking-tight">
                  {block.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 bg-gray-100/50 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 rounded-full transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                  <Clock size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 mb-0.5">시간</p>
                  <p className="text-sm font-bold">{block.start_time} – {block.end_time}</p>
                </div>
              </div>

              {block.place_name && (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-0.5">장소</p>
                    <p className="text-sm font-bold">{block.place_name}</p>
                    {block.place_address && (
                      <p className="text-xs font-bold text-gray-500 mt-0.5 truncate">{block.place_address}</p>
                    )}
                  </div>
                </div>
              )}

              {block.memo && (
                <div className="flex items-start gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                    <AlignLeft size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-0.5">메모</p>
                    <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{block.memo}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50/50 flex justify-center shrink-0">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PartnerBlockModal;
