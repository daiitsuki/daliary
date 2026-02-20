import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { changelog } from "../data/changelog";
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

  // 뒤로가기 시 모달 닫기 로직
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-800">업데이트 내역</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
              <div className="space-y-6">
                {/* 상위 2개는 항상 노출 */}
                {initialItems.map((entry) => (
                  <div
                    key={entry.version}
                    className="relative pl-4 border-l-2 border-rose-100"
                  >
                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-white" />
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">
                          v{entry.version}
                        </span>
                        <span className="text-xs text-gray-400">{entry.date}</span>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {entry.changes.map((change, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 leading-relaxed"
                        >
                          • {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* 추가 내역 애니메이션 영역 */}
                <AnimatePresence initial={false}>
                  {showAll && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden space-y-6"
                    >
                      {extraItems.map((entry) => (
                        <div
                          key={entry.version}
                          className="relative pl-4 border-l-2 border-rose-100 pt-1"
                        >
                          <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-white" />
                          <div className="mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">
                                v{entry.version}
                              </span>
                              <span className="text-xs text-gray-400">
                                {entry.date}
                              </span>
                            </div>
                          </div>
                          <ul className="space-y-1">
                            {entry.changes.map((change, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-600 leading-relaxed"
                              >
                                • {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6">
                {!showAll && hasMore ? (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <ChevronDown size={16} />
                    이전 내역 더보기
                  </button>
                ) : showAll && hasMore ? (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        sessionStorage.setItem("dev_mode_active", "true");
                        if (onActivateDevMode) onActivateDevMode();
                        alert("개발자 모드가 활성화되었습니다.");
                      }}
                      className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors"
                    >
                      개발자 모드 활성화하기
                    </button>
                    <button
                      onClick={() => setShowAll(false)}
                      className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <ChevronUp size={16} />
                      목록 접기
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-50 bg-gray-50 text-center shrink-0">
              <p className="text-xs text-gray-400">
                현재 버전 v{changelog[changelog.length - 1].version}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}