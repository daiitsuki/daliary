import { Calendar } from "lucide-react";
import { Couple } from "../../types";
import DatePicker from "../common/DatePicker";

interface CoupleSettingsSectionProps {
  couple: Couple | null;
  anniversary: string;
  onAnniversaryChange: (value: string) => void;
  isCoupleFormed?: boolean;
}

export default function CoupleSettingsSection({
  couple,
  anniversary,
  onAnniversaryChange,
  isCoupleFormed = false,
}: CoupleSettingsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">
        커플 설정
      </h2>

      <div className="bg-white p-5 rounded-[24px] border border-gray-100 space-y-4">
        <div className="flex items-center space-x-3 text-gray-700 mb-2">
          <Calendar size={20} className="text-rose-400" />
          <span className="font-bold text-sm">처음 만난 날</span>
        </div>
        <DatePicker 
          value={anniversary} 
          onChange={onAnniversaryChange} 
          variant="dropdown"
        />
      </div>

      {!isCoupleFormed && (
        <div className="bg-white p-5 rounded-[24px] border border-gray-100">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">초대 코드</p>
          <p className="font-mono text-lg font-bold text-gray-700 tracking-widest bg-gray-50 p-3 rounded-xl text-center">
            {couple?.invite_code || "------"}
          </p>
        </div>
      )}
    </section>
  );
}
