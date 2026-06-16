import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCouple } from "../hooks/useCouple";
import { useToast } from "../context/ToastContext";
import imageCompression from "browser-image-compression";
import { convertToWebP } from "../utils/imageUtils";
import { Loader2 } from "lucide-react";
import { Profile as ProfileType } from "../types";
import { motion, Variants, AnimatePresence } from "framer-motion";
import ImageEditorModal from "../components/common/ImageEditorModal";

// Sub-components
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileSection from "../components/profile/ProfileSection";
import InventorySection from "../components/profile/InventorySection";
import DangerZoneSection from "../components/settings/DangerZoneSection";
import ActivityStatsSection from "../components/profile/ActivityStatsSection";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Profile() {
  const navigate = useNavigate();
  const { profile: contextProfile, fetchCoupleInfo, signOut } = useCouple();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미지 편집 관련 상태
  const [editingImage, setEditingImage] = useState<string | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile);
      setNickname(contextProfile.nickname || "");
    }
  }, [contextProfile]);

  // 파일 선택 시 편집 모달 열기
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // FileReader(Base64) 대신 메모리 부하가 없고 가벼운 Object URL 사용
    const url = URL.createObjectURL(file);
    setEditingImage(url);
    
    // 같은 파일을 다시 선택할 수 있도록 파일 로드가 끝난 후 비동기적으로 input 초기화
    setTimeout(() => {
      e.target.value = "";
    }, 0);
  };

  // 편집 완료 후 업로드
  const handleAvatarSave = async (croppedBlob: Blob) => {
    if (!profile) return;
    
    // 편집용 임시 Object URL 메모리 해제
    if (editingImage) {
      URL.revokeObjectURL(editingImage);
    }
    setEditingImage(null);
    setLoading(true);

    // requestAnimationFrame을 사용해 브라우저가 로딩 스피너를 먼저 안정적으로 렌더링하도록 함
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    try {
      // Blob을 File 객체로 변환
      const file = new File([croppedBlob], "avatar.webp", {
        type: "image/webp",
      });

      // 압축 (리사이즈, WebP 유지)
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true,
        fileType: 'image/webp' as const,
      };
      const compressedFile = await imageCompression(file, options);
      // WebP 변환 (quality 0.8)
      const webpBlob = await convertToWebP(compressedFile, 0.8);

      // 기존 아바타 삭제 로직 추가
      if (profile.avatar_url) {
        try {
          const urlParts = profile.avatar_url.split("/");
          const oldFileName = `avatars/${urlParts[urlParts.length - 1]}`;
          if (oldFileName.includes("avatars/")) {
            await supabase.storage.from("diary-images").remove([oldFileName]);
          }
        } catch (deleteError) {
          console.error("Old avatar deletion failed:", deleteError);
        }
      }

      // 업로드
      const fileName = `avatars/${profile.id}_${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("diary-images")
        .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("diary-images").getPublicUrl(fileName);

      // DB 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      // 상태 업데이트 및 전역 캐시 동기화
      setProfile({ ...profile, avatar_url: publicUrl });
      await fetchCoupleInfo();
      showToast("프로필 사진이 변경되었습니다.", "success");
    } catch (error) {
      console.error(error);
      showToast("사진 변경 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!nickname.trim()) {
      showToast("프로필명을 입력해주세요.", "error");
      return;
    }

    const isNicknameChanged = nickname !== profile.nickname;

    if (!isNicknameChanged) return;

    try {
      setLoading(true);

      // 프로필 업데이트 (닉네임)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nickname })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      await fetchCoupleInfo();
      showToast("저장되었습니다.", "success");
    } catch (error) {
      console.error(error);
      showToast("저장 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  const hasNicknameChanged = profile && nickname !== profile.nickname;

  return (
    <div className="flex-1 bg-[#FDFDFE] flex flex-col h-full overflow-y-auto custom-scrollbar relative">
      <ProfileHeader onSettingsClick={() => navigate("/settings")} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl mx-auto px-6 py-6 space-y-8 pb-32 shrink-0"
      >
        <motion.div variants={itemVariants}>
          <ProfileSection
            profile={profile}
            nickname={nickname}
            onNicknameChange={setNickname}
            onAvatarChange={handleAvatarSelect}
            onSave={() => handleSave()}
            showSave={!!hasNicknameChanged}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ActivityStatsSection profileId={profile?.id} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <InventorySection />
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <DangerZoneSection onLogout={handleLogout} />
        </motion.div>
      </motion.main>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      <AnimatePresence>
        {editingImage && (
          <ImageEditorModal
            image={editingImage}
            onClose={() => {
              URL.revokeObjectURL(editingImage);
              setEditingImage(null);
            }}
            onSave={handleAvatarSave}
            circularCrop={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
