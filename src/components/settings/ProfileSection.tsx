import { Camera, User } from "lucide-react";
import { Profile } from "../../types";
import { useRef } from "react";

interface ProfileSectionProps {
  profile: Profile | null;
  nickname: string;
  onNicknameChange: (value: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave?: () => void;
  showSave?: boolean;
}

export default function ProfileSection({
  profile,
  nickname,
  onNicknameChange,
  onAvatarChange,
  onSave,
  showSave = false,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col items-center">
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={40} className="text-gray-300" />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full shadow-md hover:bg-gray-700 transition-colors"
        >
          <Camera size={16} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onAvatarChange}
        />
      </div>

      <div className="w-full">
        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
          닉네임
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="w-full bg-white p-4 pr-16 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-300 text-gray-800"
            placeholder="닉네임을 입력하세요"
          />
          {showSave && (
            <button
              onClick={onSave}
              className="absolute right-3 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-600 transition-colors"
            >
              저장
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
