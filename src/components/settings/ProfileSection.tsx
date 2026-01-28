import { Camera } from "lucide-react";
import { Profile } from "../../types";
import { useRef } from "react";

interface ProfileSectionProps {
  profile: Profile | null;
  nickname: string;
  onNicknameChange: (value: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileSection({
  profile,
  nickname,
  onNicknameChange,
  onAvatarChange,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col items-center">
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${profile?.id || "default"}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
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
        <input
          type="text"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          className="w-full bg-white p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-300 text-gray-800"
          placeholder="닉네임을 입력하세요"
        />
        {profile && nickname !== profile.nickname && (
          <p className="text-xs text-rose-500 mt-2 ml-1 animate-pulse">
            * 오른쪽 위 저장 버튼을 눌러 변경사항을 저장하세요.
          </p>
        )}
      </div>
    </section>
  );
}
