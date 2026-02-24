import { ArrowLeft } from "lucide-react";

interface SettingsHeaderProps {
  onBack: () => void;
}

export default function SettingsHeader({
  onBack,
}: SettingsHeaderProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0 h-[64px]">
      <button 
        onClick={onBack} 
        className="text-gray-600 p-1 w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-lg font-bold text-gray-800">설정</h1>
      <div className="w-8" /> {/* Spacer to center the title */}
    </header>
  );
}
