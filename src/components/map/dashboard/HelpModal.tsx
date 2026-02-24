import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 뒤로가기 시 모달 닫기 로직
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "map-help" }, "");
      
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "map-help") {
          onClose();
        }
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "map-help") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-sm bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-800">여행 지도 가이드</h3>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-gray-50 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-rose-50 p-3 rounded-2xl text-rose-500 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">
                    지역을 터치해보세요
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    지도의 각 지역을 터치하면 해당 지역의{" "}
                    <strong className="text-gray-800">방문 인증 사진</strong>을 모아서 볼 수 있어요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-rose-50 p-3 rounded-2xl text-rose-500 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-rose-400 border-[3px] border-rose-200 shadow-sm"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">색상 의미</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    방문 횟수가 많을수록 지역의 색상이{" "}
                    <span className="text-rose-500 font-bold">진한 장미색</span>으로
                    변해요. 전국의 모든 지역을 채워보세요!
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-2 bg-rose-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 active:scale-[0.98]"
              >
                확인했어요
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default HelpModal;
