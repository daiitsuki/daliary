import { HelpCircle } from "lucide-react";

interface DashboardHeaderProps {
  visitedRegionsCount: number;
  totalVisits: number;
  onHelpClick: () => void;
}

const DashboardHeader = ({
  visitedRegionsCount,
  totalVisits,
  onHelpClick,
}: DashboardHeaderProps) => (
  <div className="px-6 py-5 shrink-0 bg-white z-10">
    <div className="flex items-center justify-between mb-2">
      <h1 className="text-xl font-black text-gray-800 tracking-tight">우리의 여행 지도 🗺️</h1>
      <button
        onClick={onHelpClick}
        className="text-gray-400 hover:text-rose-400 transition-colors p-2 -mr-2 hover:bg-gray-50 rounded-full"
        aria-label="도움말 보기"
      >
        <HelpCircle size={20} />
      </button>
    </div>
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-1 bg-rose-50 rounded-lg text-xs font-bold text-rose-600">
        Region {visitedRegionsCount}
      </span>
      <span className="px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-600">
        Total {totalVisits}
      </span>
    </div>
  </div>
);

export default DashboardHeader;
