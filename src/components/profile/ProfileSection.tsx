import { useState, useEffect, useRef } from "react";
import { Camera, User, Check } from "lucide-react";
import { Profile } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../common/Input";

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
      <div className="flex flex-col items-center rounded-[28px] border border-rose-100/30 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
        <div className="relative mb-6">
          <div className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gray-50 shadow-sm sm:h-24 sm:w-24">
            {displayedUrl ? (
              <>
                {/* 현재 표시되는 이미지 */}
                <img
                  src={displayedUrl}
                  alt="Profile"
                  className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-80"
                />
                {/* 백그라운드 프리로드용 이미지 */}
                {pendingUrl && (
                  <img
                    src={pendingUrl}
                    alt="New Profile Pending"
                    onLoad={handleImageLoad}
                    className="pointer-events-none absolute inset-0 h-0 w-0 opacity-0"
                  />
                )}
              </>
            ) : pendingUrl ? (
              <img
                src={pendingUrl}
                alt="Profile Loading"
                onLoad={handleImageLoad}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <User size={36} className="text-gray-200" />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera size={20} strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-0 bottom-0 rounded-full border border-gray-50 bg-white p-2 text-gray-400 shadow-md transition-all hover:text-rose-500 active:scale-90"
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
          <Input
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="text-center text-base font-semibold"
            placeholder="원하는 닉네임을 입력하세요."
            clearable={false}
            maxLength={10}
            rightIcon={
              <AnimatePresence>
                {showSave && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                    onClick={onSave}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white shadow-md shadow-rose-200 transition-colors hover:bg-rose-600 active:scale-90"
                  >
                    <Check size={16} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            }
          />
        </div>
      </div>
    </section>
  );
}
