import { useState } from "react";
import { Monitor, RotateCcw } from "lucide-react";

export default function DisplaySettingsSection() {
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem("appZoomLevel");
    return saved ? Math.round(parseFloat(saved) * 100) : 100;
  });

  const handleZoomChange = (level: number) => {
    setZoomLevel(level);
    const decimalLevel = level / 100;
    localStorage.setItem("appZoomLevel", decimalLevel.toString());
    (document.body.style as any).zoom = decimalLevel.toString();
  };

  const resetZoom = () => {
    handleZoomChange(100);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-rose-400/80 rounded-full" />
        <h2 className="text-base sm:text-lg font-black text-gray-800 tracking-tight">
          화면 설정
        </h2>
      </div>

      <div className="bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden divide-y divide-gray-50/50">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Monitor size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-gray-700">
                  화면 확대/축소
                </h3>
                <p className="text-[9px] font-bold text-gray-400">
                  앱 전체의 화면 크기를 조절합니다
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[14px] font-black text-rose-400 w-12 text-right">
                {zoomLevel}%
              </span>
              <button
                onClick={resetZoom}
                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center"
                title="초기화"
              >
                <RotateCcw size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="pt-2 px-1">
            <input
              type="range"
              min="85"
              max="115"
              value={zoomLevel}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
              <span>85%</span>
              <span>100%</span>
              <span>115%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
