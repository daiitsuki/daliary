import { LogOut, HeartOff } from "lucide-react";

interface DangerZoneSectionProps {
  onLogout?: () => void;
  onDisconnect?: () => void;
}

export default function DangerZoneSection({
  onLogout,
  onDisconnect,
}: DangerZoneSectionProps) {
  return (
    <section className="flex flex-col items-center w-full mt-4 pb-8">
      <div className="w-full max-w-[200px] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-full bg-white text-gray-600 p-5 sm:p-6 rounded-[28px] font-semibold flex items-center justify-center space-x-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/30 hover:bg-rose-50/10 transition-all active:scale-95 mb-6"
        >
          <LogOut size={18} strokeWidth={2.5} className="text-gray-400" />
          <span className="text-[15px] tracking-tight">로그아웃</span>
        </button>
      )}

      {onDisconnect && (
        <button
          onClick={onDisconnect}
          className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-gray-400 hover:text-gray-500 transition-all group mt-2"
        >
          <HeartOff size={12} />
          <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-400">
            커플 연결 해제하기
          </span>
        </button>
      )}
    </section>
  );
}
