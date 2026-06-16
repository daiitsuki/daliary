import { Settings } from "lucide-react";

interface ProfileHeaderProps {
  onSettingsClick: () => void;
}

export default function ProfileHeader({
  onSettingsClick,
}: ProfileHeaderProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between bg-[#FDFDFE] shrink-0 h-[64px] sticky top-0 z-10">
      <div className="w-10" /> {/* Spacer to center the title */}
      <h1 className="text-lg font-bold text-gray-800 tracking-tight">내 정보</h1>
      <button 
        onClick={onSettingsClick} 
        className="text-gray-600 p-2 w-10 h-10 flex items-center justify-center bg-white border border-rose-100/30 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-rose-50/50 hover:text-rose-400 rounded-full transition-all"
      >
        <Settings size={20} />
      </button>
    </header>
  );
}
