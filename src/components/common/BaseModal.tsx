import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Maximize2, Minimize2 } from "lucide-react";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ElementType;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  contentClassName?: string;
  Icon?: any;
  allowFullscreen?: boolean;
}

const BaseModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon = Moon,
  headerContent,
  children,
  footer,
  maxWidth = "md",
  contentClassName = "p-6 space-y-6",
  allowFullscreen = false,
}: BaseModalProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "base-modal" }, "");
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "base-modal") onCloseRef.current();
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "base-modal") {
          window.history.back();
        }
      };
    }
  }, [isOpen]);

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6">
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
            className={`relative w-full bg-white shadow-xl flex flex-col overflow-hidden transform-gpu transition-[max-height,max-width,height,border-radius] duration-300 ease-out ${
              isFullscreen
                ? "h-[100dvh] max-h-[100dvh] rounded-none max-w-none"
                : `${maxWidthClass} rounded-t-[32px] md:rounded-[32px] max-h-[85vh]`
            }`}
          >
            {/* Header */}
            <div className="px-6 py-5 sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-50 flex flex-col shrink-0 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-black text-gray-800 tracking-tight leading-none">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-[11px] text-gray-500 font-bold leading-none mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {allowFullscreen && (
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 bg-gray-100/50 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 rounded-full transition-all active:scale-95 hidden md:block"
                    >
                      {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 bg-gray-100/50 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 rounded-full transition-all active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              {headerContent}
            </div>

            {/* Body */}
            <div
              className={`flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar ${contentClassName} ${
                isFullscreen ? "!h-full !max-h-none" : ""
              }`}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 bg-gray-50/50 shrink-0">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default BaseModal;
