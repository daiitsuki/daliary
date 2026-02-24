import {
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  Heart,
} from "lucide-react";
import { useHolidays } from "../../hooks/useHolidays";
import { useAnniversaries } from "../../hooks/useAnniversaries";

export default function CalendarSettingsSection() {
  const {
    showHolidays,
    toggleHolidays,
    refreshHolidays,
    updating,
    lastUpdated,
  } = useHolidays();
  const { showAnniversaries, toggleAnniversaries } = useAnniversaries();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-rose-400/80 rounded-full" />
        <h2 className="text-base sm:text-lg font-black text-gray-800 tracking-tight">
          캘린더 설정
        </h2>
      </div>

      <div className="bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden divide-y divide-gray-50/50">
        {/* Toggle Controls */}
        <div className="p-4 sm:p-5 space-y-5">
          {/* Anniversary Toggle */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-gray-700">
                  기념일 표시
                </h3>
                <p className="text-[9px] font-bold text-gray-400">
                  우리의 소중한 날들을 보여줍니다
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleAnniversaries(!showAnniversaries)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all active:scale-90 ${
                showAnniversaries ? "bg-rose-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                  showAnniversaries ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Holiday Toggle Switch */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarIcon size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-gray-700">
                  공휴일 표시
                </h3>
                <p className="text-[9px] font-bold text-gray-400">
                  대한민국의 공휴일을 보여줍니다
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleHolidays(!showHolidays)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all active:scale-90 ${
                showHolidays ? "bg-rose-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                  showHolidays ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Update Button Section */}
        <div className="p-4 sm:p-5">
          <button
            onClick={refreshHolidays}
            disabled={updating}
            className="w-full flex items-center justify-between group text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {updating ? (
                  <Loader2 size={18} className="text-gray-400 animate-spin" />
                ) : (
                  <RefreshCw size={18} className="text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-[14px] font-black text-gray-700">
                  공휴일 정보 업데이트
                </h3>
                <p className="text-[9px] font-bold text-gray-400">
                  {lastUpdated
                    ? `최근: ${formatDate(lastUpdated)}`
                    : "최신 정보를 받아옵니다."}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
