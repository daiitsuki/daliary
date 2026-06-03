import { Plus, Settings2, User, Users, Download } from "lucide-react";
import { Profile } from "../../types";

interface TimetableHeaderProps {
  viewMode: "my" | "partner";
  onViewModeChange: (mode: "my" | "partner") => void;
  onAddBlock: () => void;
  onOpenSettings: () => void;
  partnerProfile: Profile | null;
  onExport: () => void;
}

const TimetableHeader = ({
  viewMode,
  onViewModeChange,
  onAddBlock,
  onOpenSettings,
  partnerProfile,
  onExport,
}: TimetableHeaderProps) => {
  return (
    <div className="w-full px-0.5 mb-2 sm:mb-3">
      <div className="relative flex items-center bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full h-14 sm:h-16 overflow-hidden">
        <div className="flex items-center justify-between w-full px-2 sm:px-3">
          {/* 좌측: 설정 및 범위 안내 */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-full transition-all active:scale-90"
              title="표시 시간 설정"
            >
              <Settings2
                className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                strokeWidth={2.2}
              />
            </button>
            <button
              onClick={onExport}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-full transition-all active:scale-90"
              title="이미지로 저장"
            >
              <Download
                className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                strokeWidth={2.2}
              />
            </button>
          </div>

          {/* 중앙: 내 시간표 / 짝꿍 시간표 전환 */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
            <button
              onClick={() => onViewModeChange("my")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 ${
                viewMode === "my"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <User size={13} strokeWidth={2.5} />나
            </button>
            <button
              onClick={() => onViewModeChange("partner")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 ${
                viewMode === "partner"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Users size={13} strokeWidth={2.5} />
              {partnerProfile?.nickname || "상대방"}
            </button>
          </div>

          {/* 우측: 추가 버튼 (내 시간표일 때만 활성) */}
          <button
            onClick={viewMode === "my" ? onAddBlock : undefined}
            className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${
              viewMode === "my"
                ? "text-gray-400 hover:text-rose-500 hover:bg-rose-50/50"
                : "text-gray-200 cursor-not-allowed"
            }`}
            title={
              viewMode === "my"
                ? "새 시간표 추가"
                : `${partnerProfile?.nickname || "상대방"}님의 시간표는 수정할 수 없습니다`
            }
          >
            <Plus
              className="w-[18px] h-[18px] sm:w-5 sm:h-5"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimetableHeader;
