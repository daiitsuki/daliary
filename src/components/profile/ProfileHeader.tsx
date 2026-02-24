import { Settings } from "lucide-react";

interface ProfileHeaderProps {
  onSettingsClick: () => void;
}

export default function ProfileHeader({
  onSettingsClick,
}: ProfileHeaderProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0 h-[64px]">
      <div className="w-8" /> {/* Spacer to center the title */}
      <h1 className="text-lg font-bold text-gray-800">내 정보</h1>
      <button 
        onClick={onSettingsClick} 
        className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors p-1 w-8 h-8 flex items-center justify-center"
      >
        <Settings size={24} />
      </button>
    </header>
  );
}
