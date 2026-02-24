import { Info } from "lucide-react";
import { changelog } from "../../data/changelog";

interface AppInfoSectionProps {
  onShowChangelog: () => void;
}

export default function AppInfoSection({ onShowChangelog }: AppInfoSectionProps) {
  const latestVersion = changelog.length > 0 ? changelog[changelog.length - 1].version : '1.0.0';

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-rose-400/80 rounded-full" />
        <h2 className="text-base sm:text-lg font-black text-gray-800 tracking-tight">
          앱 정보
        </h2>
      </div>

      <button
        onClick={onShowChangelog}
        className="w-full bg-white p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 flex items-center justify-between group hover:bg-gray-50/30 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Info size={18} className="text-rose-400" />
          </div>
          <span className="text-[13px] font-black text-gray-700">업데이트 내역</span>
        </div>
        <div className="bg-rose-50/50 px-2.5 py-0.5 rounded-full border border-rose-100/50">
          <span className="text-[10px] font-black text-rose-400 tabular-nums">v{latestVersion}</span>
        </div>
      </button>
    </section>
  );
}
