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
      <div className="flex flex-col items-center gap-4 mt-2">
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-500 transition-all group"
          >
            <LogOut size={12} />
            <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-400">
              로그아웃
            </span>
          </button>
        )}

        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-500 transition-all group"
          >
            <HeartOff size={12} />
            <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-400">
              커플 연결 해제하기
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
