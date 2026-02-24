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
    <section className="flex flex-col items-center w-full">
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-full bg-white text-gray-600 p-4 rounded-[24px] font-black flex items-center justify-center space-x-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 hover:bg-gray-50/50 transition-all active:scale-95"
        >
          <LogOut size={18} strokeWidth={2.5} className="text-gray-400" />
          <span className="text-[15px] tracking-tight">로그아웃</span>
        </button>
      )}

      {onDisconnect && (
        <button
          onClick={onDisconnect}
          className="mt-8 flex items-center gap-2 px-4 py-2 text-[10px] font-black text-gray-300 hover:text-red-400 transition-all group"
        >
          <HeartOff size={12} className="group-hover:animate-pulse" />
          <span className="underline underline-offset-4 decoration-gray-200 group-hover:decoration-red-200">
            커플 연결 해제하기
          </span>
        </button>
      )}
    </section>
  );
}
