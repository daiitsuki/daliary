import { ArrowLeft } from "lucide-react";

interface SettingsHeaderProps {
  onBack: () => void;
}

export default function SettingsHeader({
  onBack,
}: SettingsHeaderProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
      <button onClick={onBack} className="text-gray-600">
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-lg font-bold text-gray-800">설정</h1>
      <div className="w-6" /> {/* Spacer to center the title */}
    </header>
  );
}
