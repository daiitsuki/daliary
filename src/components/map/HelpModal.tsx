import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
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

export default HelpModal;
