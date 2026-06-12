import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { changelog } from "../../data/changelog";
import { motion, AnimatePresence } from "framer-motion";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateDevMode?: () => void;
}

export default function ChangelogModal({
  isOpen,
  onClose,
  onActivateDevMode,
}: ChangelogModalProps) {
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "changelog" }, "");
      
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "changelog") {
          onClose();
        }
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "changelog") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const reversedChangelog = [...changelog].reverse();
  const initialItems = reversedChangelog.slice(0, 2);
  const extraItems = reversedChangelog.slice(2);
  const hasMore = reversedChangelog.length > 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-sm sm:max-w-md rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden max-h-[85vh] flex flex-col border border-white/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-50/80 to-transparent pointer-events-none" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
              <h2 className="text-[18px] font-bold text-gray-800 tracking-tight">업데이트 내역</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-4 custom-scrollbar flex-1 relative z-0">
              <div className="pt-2 pb-4">
                {/* 상위 2개는 항상 노출 */}
                {initialItems.map((entry, index) => {
                  const isLastInitial = index === initialItems.length - 1;
                  const borderClass = isLastInitial && !showAll 
                    ? "border-l-transparent pb-2" 
                    : "border-rose-100/60 pb-8";

                  return (
                    <div
                      key={entry.version}
                      className={`relative pl-6 border-l-2 ${borderClass}`}
                    >
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-[3px] border-rose-400 shadow-[0_0_0_4px_white]" />
                      <div className="mb-3">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-[16px] font-bold text-gray-800 tracking-tight">
                            v{entry.version}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
                            {entry.date}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {entry.changes.map((change, idx) => (
                          <li
                            key={idx}
                            className="text-[13px] font-medium text-gray-600 leading-relaxed flex items-start"
                          >
                            <span className="mr-2.5 text-rose-300 mt-[5px] text-[10px]">•</span>
                            <span className="flex-1">{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {/* 추가 내역 애니메이션 영역 */}
                <AnimatePresence initial={false}>
                  {showAll && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden px-4 -mx-4"
                    >
                      {extraItems.map((entry, idx) => {
                        const isVeryLast = idx === extraItems.length - 1;
                        return (
                          <div
                            key={entry.version}
                            className={`relative pl-6 border-l-2 ${isVeryLast ? "border-l-transparent pb-2" : "border-rose-100/60 pb-8"}`}
                          >
                            <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-[3px] border-gray-300 shadow-[0_0_0_4px_white]" />
                            <div className="mb-3">
                              <div className="flex items-baseline gap-2.5">
                                <span className="text-[16px] font-bold text-gray-500 tracking-tight">
                                  v{entry.version}
                                </span>
                                <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
                                  {entry.date}
                                </span>
                              </div>
                            </div>
                            <ul className="space-y-2">
                              {entry.changes.map((change, idx) => (
                                <li
                                  key={idx}
                                  className="text-[13px] font-medium text-gray-500 leading-relaxed flex items-start"
                                >
                                  <span className="mr-2.5 text-gray-300 mt-[5px] text-[10px]">•</span>
                                  <span className="flex-1">{change}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-2 mb-4">
                {!showAll && hasMore ? (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-[13px] font-medium text-gray-500 bg-gray-50 rounded-[20px] hover:bg-gray-100 transition-colors"
                  >
                    이전 내역 더보기
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </button>
                ) : showAll && hasMore ? (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => setShowAll(false)}
                      className="w-full py-3.5 flex items-center justify-center gap-2 text-[13px] font-medium text-gray-500 bg-gray-50 rounded-[20px] hover:bg-gray-100 transition-colors"
                    >
                      목록 접기
                      <ChevronUp size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        sessionStorage.setItem("dev_mode_active", "true");
                        if (onActivateDevMode) onActivateDevMode();
                        alert("개발자 모드가 활성화되었습니다.");
                      }}
                      className="text-[11px] font-bold text-gray-300 hover:text-gray-400 transition-colors underline underline-offset-4 decoration-gray-200"
                    >
                      개발자 모드 활성화하기
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50/50 text-center shrink-0 border-t border-gray-100/50 relative z-10">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Current Version v{changelog[changelog.length - 1].version}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}