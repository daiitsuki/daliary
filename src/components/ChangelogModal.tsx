import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { changelog } from "../data/changelog";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({
  isOpen,
  onClose,
}: ChangelogModalProps) {
  const [showAll, setShowAll] = useState(false);

  if (!isOpen) return null;

  const reversedChangelog = [...changelog].reverse();
  const displayedChangelog = showAll
    ? reversedChangelog
    : reversedChangelog.slice(0, 2);
  const hasMore = reversedChangelog.length > 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col animate-scaleIn">
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
        <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar flex-1">
          {displayedChangelog.map((entry, index) => (
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

          {!showAll && hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronDown size={16} />
              이전 내역 더보기
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-50 bg-gray-50 text-center shrink-0">
          <p className="text-xs text-gray-400">
            현재 버전 v{changelog[changelog.length - 1].version}
          </p>
        </div>
      </div>
    </div>
  );
}
