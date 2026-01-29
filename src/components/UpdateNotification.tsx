import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowUpCircle } from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';

const UpdateNotification = () => {
  const { hasUpdate, updateApp } = useAppUpdate();

  return (
    <AnimatePresence>
      {hasUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: [0, -10, 0], // 위아래로 10px씩 이동
            scale: 1 
          }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 }
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        >
          <button
            onClick={updateApp}
            className="flex items-center gap-3 bg-gray-900/90 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 hover:bg-black transition-all group active:scale-95"
          >
            <div className="relative">
              <RefreshCw size={20} className="text-rose-400 animate-spin-slow" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-gray-800" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-gray-400">새로운 버전 출시</p>
              <p className="text-sm font-bold text-white flex items-center gap-1">
                업데이트하기 <ArrowUpCircle size={14} className="text-rose-400 group-hover:-translate-y-0.5 transition-transform" />
              </p>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
