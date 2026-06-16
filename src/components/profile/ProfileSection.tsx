import { useState, useEffect, useRef } from "react";
import { Camera, User, Check } from "lucide-react";
import { Profile } from "../../types";
import { motion, AnimatePresence } from "framer-motion";

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

  // 더블 버퍼링 이미지 렌더링 상태
  const [displayedUrl, setDisplayedUrl] = useState(profile?.avatar_url || "");
  const [pendingUrl, setPendingUrl] = useState("");

  useEffect(() => {
    const nextUrl = profile?.avatar_url || "";
    if (nextUrl !== displayedUrl) {
      if (!displayedUrl) {
        setDisplayedUrl(nextUrl);
      } else {
        setPendingUrl(nextUrl);
      }
    }
  }, [profile?.avatar_url, displayedUrl]);

  const handleImageLoad = () => {
    if (pendingUrl) {
      setDisplayedUrl(pendingUrl);
      setPendingUrl("");
    }
  };

  return (
    <section className="space-y-3">
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/30 flex flex-col items-center">
        <div className="relative mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-50 overflow-hidden border-[3px] border-white shadow-sm flex items-center justify-center relative group">
          {displayedUrl ? (
            <>
              {/* 현재 표시되는 이미지 */}
              <img
                src={displayedUrl}
                alt="Profile"
                className="w-full h-full object-cover absolute inset-0 transition-opacity group-hover:opacity-80"
              />
              {/* 백그라운드 프리로드용 이미지 */}
              {pendingUrl && (
                <img
                  src={pendingUrl}
                  alt="New Profile Pending"
                  onLoad={handleImageLoad}
                  className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                />
              )}
            </>
          ) : pendingUrl ? (
            <img
              src={pendingUrl}
              alt="Profile Loading"
              onLoad={handleImageLoad}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <User size={36} className="text-gray-200" />
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
          >
            <Camera size={20} strokeWidth={2.5} />
          </button>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 bg-white text-gray-400 p-2 rounded-full shadow-md hover:text-rose-500 transition-all active:scale-90 border border-gray-50"
        >
          <Camera size={14} strokeWidth={2.5} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onAvatarChange}
        />
      </div>

      <div className="w-full max-w-sm">
        <div className="relative group">
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="w-full text-center bg-gray-50/50 p-3 sm:p-3.5 pr-12 rounded-xl border border-transparent focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50/50 outline-none font-semibold text-gray-800 text-base transition-all placeholder:text-gray-300"
            placeholder="어떻게 불러드릴까요?"
          />

          <AnimatePresence>
            {showSave && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                onClick={onSave}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-rose-500 text-white rounded-lg shadow-md shadow-rose-200 flex items-center justify-center hover:bg-rose-600 transition-colors active:scale-90"
              >
                <Check size={16} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </section>
  );
}
