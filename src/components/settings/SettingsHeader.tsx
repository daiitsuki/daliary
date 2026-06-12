import { ArrowLeft } from "lucide-react";

interface SettingsHeaderProps {
  onBack: () => void;
}

export default function SettingsHeader({
  onBack,
}: SettingsHeaderProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between bg-[#FDFDFE] shrink-0 h-[64px] sticky top-0 z-10">
      <button 
        onClick={onBack} 
        className="text-gray-600 p-2 w-10 h-10 flex items-center justify-center bg-white border border-rose-100/30 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-rose-50/50 hover:text-rose-400 rounded-full transition-all"
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-lg font-black text-gray-800 tracking-tight">설정</h1>
      <div className="w-10" /> {/* Spacer to center the title */}
    </header>
  );
}
