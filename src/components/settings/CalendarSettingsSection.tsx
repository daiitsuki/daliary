import { Calendar as CalendarIcon, RefreshCw, Loader2, Heart } from "lucide-react";
import { useHolidays } from "../../hooks/useHolidays";
import { useAnniversaries } from "../../hooks/useAnniversaries";

export default function CalendarSettingsSection() {
  const { showHolidays, toggleHolidays, refreshHolidays, updating, lastUpdated } = useHolidays();
  const { showAnniversaries, toggleAnniversaries } = useAnniversaries();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">
        캘린더 설정
      </h2>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Anniversary Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center space-x-3 text-gray-700">
            <Heart size={20} className="text-rose-400" />
            <span className="font-medium">기념일 표시</span>
          </div>
          <button
            onClick={() => toggleAnniversaries(!showAnniversaries)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
              showAnniversaries ? "bg-rose-400" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showAnniversaries ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Holiday Toggle Switch */}
        <div className="p-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center space-x-3 text-gray-700">
            <CalendarIcon size={20} className="text-rose-400" />
            <span className="font-medium">공휴일 표시</span>
          </div>
          <button
            onClick={() => toggleHolidays(!showHolidays)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
              showHolidays ? "bg-rose-400" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showHolidays ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Update Button */}
        <button
          onClick={refreshHolidays}
          disabled={updating}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3 text-gray-700">
            {updating ? (
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            ) : (
              <RefreshCw size={20} className="text-gray-400" />
            )}
            <div className="flex flex-col">
              <span className="font-medium">공휴일 정보 업데이트</span>
              <span className="text-xs text-gray-400">
                {lastUpdated 
                  ? `마지막 업데이트: ${formatDate(lastUpdated)}`
                  : "서버에서 최신 공휴일 정보를 받아옵니다."}
              </span>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}