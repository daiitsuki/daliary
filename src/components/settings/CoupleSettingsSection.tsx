import { Calendar } from "lucide-react";
import { Couple } from "../../types";

interface CoupleSettingsSectionProps {
  couple: Couple | null;
  anniversary: string;
  onAnniversaryChange: (value: string) => void;
}

export default function CoupleSettingsSection({
  couple,
  anniversary,
  onAnniversaryChange,
}: CoupleSettingsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">
        커플 설정
      </h2>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-gray-700">
          <Calendar size={20} className="text-rose-400" />
          <span className="font-medium">처음 만난 날</span>
        </div>
        <input
          type="date"
          value={anniversary}
          onChange={(e) => onAnniversaryChange(e.target.value)}
          className="bg-transparent text-right font-medium text-gray-600 focus:outline-none"
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">초대 코드</p>
        <p className="font-mono text-lg font-bold text-gray-700 tracking-widest">
          {couple?.invite_code || "------"}
        </p>
      </div>
    </section>
  );
}
