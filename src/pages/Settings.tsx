import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCouple } from "../hooks/useCouple";
import imageCompression from "browser-image-compression";
import { Loader2 } from "lucide-react";
import { Profile } from "../types";
import ChangelogModal from "../components/ChangelogModal";
import { motion, Variants } from "framer-motion";
import ImageEditorModal from "../components/common/ImageEditorModal";

// Sub-components
import SettingsHeader from "../components/settings/SettingsHeader";
import ProfileSection from "../components/settings/ProfileSection";
import CoupleSettingsSection from "../components/settings/CoupleSettingsSection";
import CalendarSettingsSection from "../components/settings/CalendarSettingsSection";
import AppInfoSection from "../components/settings/AppInfoSection";
import DangerZoneSection from "../components/settings/DangerZoneSection";

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

export default function Settings() {
  const navigate = useNavigate();
  const { couple, fetchCoupleInfo, signOut, disconnect, isCoupleFormed } = useCouple();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  
  // 이미지 편집 관련 상태
  const [editingImage, setEditingImage] = useState<string | null>(null);
  
  const lastSaveTimeRef = useRef<number>(0);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setNickname(data.nickname || "");
      }

      if (couple?.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
    };
    loadData();
  }, [couple]);

  // 파일 선택 시 편집 모달 열기
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // 같은 파일을 다시 선택할 수 있도록 input 초기화
    e.target.value = "";
  };

  // 편집 완료 후 업로드
  const handleAvatarSave = async (croppedBlob: Blob) => {
    if (!profile) return;
    setEditingImage(null);

    try {
      setLoading(true);

      // Blob을 File 객체로 변환
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

      // 압축
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

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
          // 삭제 실패해도 업로드는 계속 진행
        }
      }

      // 업로드
      const fileExt = "jpg";
      const fileName = `avatars/${profile.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("diary-images") // 기존 버킷 재사용
        .upload(fileName, compressedFile, { upsert: true });

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

      // 상태 업데이트
      setProfile({ ...profile, avatar_url: publicUrl });
      alert("프로필 사진이 변경되었습니다.");
    } catch (error) {
      console.error(error);
      alert("사진 변경 실패");
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

  const handleDisconnect = async () => {
    if (!window.confirm("정말로 커플 연결을 해제하시겠습니까? 모든 데이터가 삭제됩니다.")) return;

    try {
      await disconnect();
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("연결 해제 실패");
    }
  };

  const handleSave = async (newAnniversary?: string) => {
    if (!profile) return;

    const targetAnniversary = newAnniversary || anniversary;
    const isNicknameChanged = nickname !== profile.nickname;
    const isAnniversaryChanged = couple && targetAnniversary !== couple.anniversary_date;

    if (!isNicknameChanged && !isAnniversaryChanged) return;

    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000; // 5분
    const savedTimestamp = localStorage.getItem("last_settings_save_time");
    const lastSaveTime = savedTimestamp ? parseInt(savedTimestamp, 10) : 0;
    
    const timeRemaining = lastSaveTime + COOLDOWN_MS - now;

    if (timeRemaining > 0) {
      const minutesRemaining = Math.ceil(timeRemaining / 60000);
      alert(`저장은 5분에 한 번씩만 가능합니다. ${minutesRemaining}분 후에 다시 시도해주세요.`);
      
      if (newAnniversary && couple?.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
      return;
    }

    if (!window.confirm("설정 변경은 5분에 한 번씩만 가능합니다. 정말로 변경하시겠습니까?")) {
      if (newAnniversary && couple?.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
      return;
    }

    try {
      setLoading(true);

      // 1. 프로필 업데이트 (닉네임)
      if (isNicknameChanged) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ nickname })
          .eq("id", profile.id);

        if (profileError) throw profileError;
      }

      // 2. 커플 업데이트 (기념일)
      if (isAnniversaryChanged) {
        const { error: coupleError } = await supabase
          .from("couples")
          .update({ anniversary_date: targetAnniversary })
          .eq("id", couple.id);

        if (coupleError) throw coupleError;
      }

      await fetchCoupleInfo();
      const currentTimestamp = Date.now();
      lastSaveTimeRef.current = currentTimestamp;
      localStorage.setItem("last_settings_save_time", currentTimestamp.toString());
      alert("저장되었습니다.");
    } catch (error) {
      console.error(error);
      alert("저장 실패");
      if (newAnniversary && couple?.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasNicknameChanged = profile && nickname !== profile.nickname;

  return (
    <div className="h-full bg-white flex flex-col">
      <SettingsHeader 
        onBack={() => navigate(-1)}
      />

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 custom-scrollbar"
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
          <CoupleSettingsSection 
            couple={couple}
            anniversary={anniversary}
            onAnniversaryChange={setAnniversary}
            isCoupleFormed={isCoupleFormed}
            onSave={handleSave}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CalendarSettingsSection />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AppInfoSection 
            onShowChangelog={() => setShowChangelog(true)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <DangerZoneSection 
            onLogout={handleLogout}
            onDisconnect={handleDisconnect}
          />
        </motion.div>
      </motion.main>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      {/* 이미지 편집 모달 */}
      {editingImage && (
        <ImageEditorModal
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleAvatarSave}
          circularCrop={true}
        />
      )}

      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </div>
  );
}