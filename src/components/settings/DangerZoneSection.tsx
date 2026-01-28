import { LogOut } from "lucide-react";

interface DangerZoneSectionProps {
  onLogout: () => void;
  onDisconnect: () => void;
}

export default function DangerZoneSection({
  onLogout,
  onDisconnect,
}: DangerZoneSectionProps) {
  return (
    <section className="space-y-6 flex flex-col items-center">
      <button
        onClick={onLogout}
        className="w-full bg-gray-50 text-gray-600 p-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
      >
        <LogOut size={18} />
        <span>로그아웃</span>
      </button>

      <button
        onClick={onDisconnect}
        className="text-[10px] text-gray-300 hover:text-red-300 transition-colors underline underline-offset-2"
      >
        커플 연결 해제
      </button>
    </section>
  );
}
