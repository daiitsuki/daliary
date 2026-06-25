import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

// ── Context ───────────────────────────────────
const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DURATION_MS = 2800;

// ── Styles ────────────────────────────────────
const config: Record<ToastType, { icon: React.ReactNode; cls: string }> = {
  success: {
    icon: <CheckCircle2 size={15} strokeWidth={2.5} />,
    cls: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  error: {
    icon: <XCircle size={15} strokeWidth={2.5} />,
    cls: 'text-rose-500 bg-rose-50 border-rose-100',
  },
  info: {
    icon: <AlertCircle size={15} strokeWidth={2.5} />,
    cls: 'text-blue-500 bg-blue-50 border-blue-100',
  },
};

import { createPortal } from 'react-dom';

const ToastList: React.FC<{ toasts: ToastItem[] }> = ({ toasts }) => createPortal(
  <div
    className="fixed z-[99999] flex flex-col gap-2 items-center pointer-events-none"
    style={{
      top: 'max(env(safe-area-inset-top, 0px) + 12px, 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(360px, calc(100vw - 32px))',
    }}
  >
    <AnimatePresence initial={false}>
      {toasts.map((t) => {
        const { icon, cls } = config[t.type];
        return (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className={`w-full flex items-center gap-3 rounded-2xl border shadow-xl px-4 py-3 pointer-events-auto ${cls}`}
          >
            <span className="shrink-0">{icon}</span>
            <p className="text-xs font-bold leading-tight">{t.message}</p>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>,
  document.body
);

// ── Provider ──────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastList toasts={toasts} />
    </ToastContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────
export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
