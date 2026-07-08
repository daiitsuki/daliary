import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import Button from "../components/common/Button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolvePromise, setResolvePromise] =
    useState<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      setOptions(typeof opts === "string" ? { message: opts } : opts);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(
    (value: boolean) => {
      setIsOpen(false);
      if (resolvePromise) {
        resolvePromise(value);
        setResolvePromise(undefined);
      }
    },
    [resolvePromise],
  );

  const {
    title = "확인",
    message,
    confirmText = "확인",
    cancelText = "취소",
    isDanger = true,
  } = options;


  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="p-5 sm:p-8 flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${isDanger ? "bg-rose-50 text-rose-500" : "bg-gray-50 text-gray-500"}`}
                >
                  <AlertCircle
                    className="w-6 h-6 sm:w-7 sm:h-7"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1.5 sm:mb-2">
                  {title}
                </h3>
                <p className="text-[13px] sm:text-sm font-medium text-gray-500 leading-relaxed mb-5 sm:mb-6 whitespace-pre-line">
                  {message}
                </p>

                <div className="flex gap-2 sm:gap-3 w-full mt-1 sm:mt-2">
                  <Button
                    onClick={() => handleClose(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={() => handleClose(true)}
                    variant={isDanger ? "danger" : "primary"}
                    className="flex-1"
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {createPortal(modalContent, document.body)}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context)
    throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
};
