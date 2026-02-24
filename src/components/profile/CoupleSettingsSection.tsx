import { Calendar } from "lucide-react";
import { Couple } from "../../types";
import DatePicker from "../common/DatePicker";

interface CoupleSettingsSectionProps {
  couple: Couple | null;
  anniversary: string;
  onAnniversaryChange: (value: string) => void;
  isCoupleFormed?: boolean;
  onSave?: () => void;
  showSave?: boolean;
}

export default function CoupleSettingsSection({
  couple,
  anniversary,
  onAnniversaryChange,
  isCoupleFormed = false,
  onSave,
}: CoupleSettingsSectionProps) {
  const handleDateChange = (newDate: string) => {
    onAnniversaryChange(newDate);
    if (newDate !== couple?.anniversary_date && onSave) {
      setTimeout(() => onSave(), 0);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-rose-400/80 rounded-full" />
        <h2 className="text-base sm:text-lg font-black text-gray-800 tracking-tight">
          커플 설정
        </h2>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 space-y-5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Calendar size={14} className="text-rose-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              처음 만난 날
            </span>
          </div>
          <div className="bg-gray-50/50 rounded-[20px] p-0.5 border border-transparent hover:border-rose-100 transition-all">
            <DatePicker
              value={anniversary}
              onChange={handleDateChange}
              variant="dropdown"
            />
          </div>
        </div>

        {!isCoupleFormed && (
          <div className="pt-5 border-t border-gray-50 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em] mb-2.5">
              우리의 연결 코드
            </span>
            <div className="w-full bg-rose-50/30 border border-rose-100/50 p-4 rounded-[20px] group hover:bg-rose-50/50 transition-all">
              <p className="font-mono text-xl sm:text-2xl font-black text-rose-500 tracking-[0.3em] tabular-nums">
                {couple?.invite_code || "------"}
              </p>
            </div>
            <p className="mt-3.5 text-[10px] font-bold text-gray-400 leading-relaxed">
              상대방의 앱에 이 코드를 입력하면
              <br />
              함께 달이어리를 쓸 수 있어요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
