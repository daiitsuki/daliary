import { Info } from "lucide-react";
import { changelog } from "../../data/changelog";

interface AppInfoSectionProps {
  onShowChangelog: () => void;
}

export default function AppInfoSection({ onShowChangelog }: AppInfoSectionProps) {
  const latestVersion = changelog.length > 0 ? changelog[changelog.length - 1].version : '1.0.0';

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">
        앱 정보
      </h2>

      <button
        onClick={onShowChangelog}
        className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3 text-gray-700">
          <Info size={20} className="text-rose-400" />
          <span className="font-medium">업데이트 내역</span>
        </div>
        <span className="text-sm text-gray-400">v{latestVersion}</span>
      </button>
    </section>
  );
}
