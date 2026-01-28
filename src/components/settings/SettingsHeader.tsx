import { ArrowLeft } from "lucide-react";

interface SettingsHeaderProps {
  onBack: () => void;
  onSave: () => void;
  loading: boolean;
  hasChanges: boolean | null;
}

export default function SettingsHeader({
  onBack,
  onSave,
  loading,
  hasChanges,
}: SettingsHeaderProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
      <button onClick={onBack} className="text-gray-600">
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-lg font-bold text-gray-800">설정</h1>
      <button
        onClick={onSave}
        disabled={loading || !hasChanges}
        className={`font-medium transition-colors ${loading || !hasChanges ? "text-gray-300" : "text-rose-500"}`}
      >
        저장
      </button>
    </header>
  );
}
