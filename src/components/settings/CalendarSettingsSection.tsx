import { useState } from "react";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  Heart,
  Plane,
} from "lucide-react";
import { useHolidays } from "../../hooks";
import { useAnniversaries } from "../../hooks";

export default function CalendarSettingsSection() {
  const {
    showHolidays,
    toggleHolidays,
    refreshHolidays,
    updating,
    lastUpdated,
  } = useHolidays();
  const { showAnniversaries, toggleAnniversaries } = useAnniversaries();

  const [syncTrips, setSyncTrips] = useState<boolean>(() => {
    const stored = localStorage.getItem("syncTripsToCalendar");
    return stored === null ? true : stored === "true";
  });

  const toggleSyncTrips = (value: boolean) => {
    setSyncTrips(value);
    localStorage.setItem("syncTripsToCalendar", String(value));
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <section className="space-y-3">
      <div className="px-2 mb-3">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          캘린더 설정
        </h2>
      </div>

      <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/30 overflow-hidden divide-y divide-gray-50/50">
        {/* Toggle Controls */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Anniversary Toggle */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">
                  기념일 표시
                </h3>
               
              </div>
            </div>
            <button
              onClick={() => toggleAnniversaries(!showAnniversaries)}
              className={`relative inline-block h-[20px] w-[40px] shrink-0 rounded-full transition-all active:scale-90 ${
                showAnniversaries ? "bg-rose-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                  showAnniversaries ? "translate-x-[20px]" : "translate-x-0"
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
                <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">
                  공휴일 표시
                </h3>
               
              </div>
            </div>
            <button
              onClick={() => toggleHolidays(!showHolidays)}
              className={`relative inline-block h-[20px] w-[40px] shrink-0 rounded-full transition-all active:scale-90 ${
                showHolidays ? "bg-rose-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                  showHolidays ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Trip Sync Toggle Switch */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plane size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">
                  여행 계획 표시
                </h3>
               
              </div>
            </div>
            <button
              onClick={() => toggleSyncTrips(!syncTrips)}
              className={`relative inline-block h-[20px] w-[40px] shrink-0 rounded-full transition-all active:scale-90 ${
                syncTrips ? "bg-rose-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                  syncTrips ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Update Button Section */}
        <div className="p-5 sm:p-6">
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
                <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">
                  공휴일 정보 업데이트
                </h3>
                <p className="text-[12px] font-medium text-gray-400 leading-snug">
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
