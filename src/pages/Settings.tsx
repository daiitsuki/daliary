import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCouple } from "../hooks/useCouple";
import imageCompression from "browser-image-compression";
import { Loader2 } from "lucide-react";
import { Profile } from "../types";
import ChangelogModal from "../components/ChangelogModal";

// Sub-components
import SettingsHeader from "../components/settings/SettingsHeader";
import ProfileSection from "../components/settings/ProfileSection";
import CoupleSettingsSection from "../components/settings/CoupleSettingsSection";
import AppInfoSection from "../components/settings/AppInfoSection";
import DangerZoneSection from "../components/settings/DangerZoneSection";

export default function Settings() {
  const navigate = useNavigate();
  const { couple, fetchCoupleInfo, signOut } = useCouple();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

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

  // 프로필 사진 변경
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setLoading(true);

      // 압축
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // 업로드
      const fileExt = file.name.split(".").pop();
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

  // 정보 저장 (닉네임, 기념일)
  const handleSave = async () => {
    if (!profile || !couple) return;
    setLoading(true);

    try {
      // 1. 닉네임 업데이트
      if (nickname !== profile.nickname) {
        const { error } = await supabase
          .from("profiles")
          .update({ nickname })
          .eq("id", profile.id);
        if (error) throw error;
      }

      // 2. 기념일 업데이트
      if (anniversary !== couple.anniversary_date) {
        const { error } = await supabase
          .from("couples")
          .update({ anniversary_date: anniversary })
          .eq("id", couple.id);
        if (error) throw error;
      }

      await fetchCoupleInfo(); // 전역 상태 갱신
      alert("저장되었습니다.");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 커플 연결 해제 및 데이터 전체 삭제
  const handleDisconnect = async () => {
    if (
      !confirm(
        "정말 연결을 끊으시겠습니까? 우리만의 모든 일기, 사진, 포인트 기록이 영구적으로 삭제되며 복구할 수 없습니다.",
      )
    )
      return;
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("delete_couple_and_all_data");

      if (error) throw error;

      alert("모든 데이터가 삭제되고 연결이 해제되었습니다.");
      // 전역 상태 초기화 및 이동
      await fetchCoupleInfo();
      navigate("/onboarding");
    } catch (error: any) {
      console.error(error);
      alert("해제 실패: " + (error.message || "알 수 없는 오류"));
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

  const hasChanges =
    (profile && nickname !== profile.nickname) ||
    (couple && anniversary !== couple.anniversary_date);

  return (
    <div className="h-full bg-white flex flex-col">
      <SettingsHeader 
        onBack={() => navigate(-1)}
        onSave={handleSave}
        loading={loading}
        hasChanges={hasChanges}
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-4 custom-scrollbar">
        <ProfileSection 
          profile={profile}
          nickname={nickname}
          onNicknameChange={setNickname}
          onAvatarChange={handleAvatarChange}
        />

        <CoupleSettingsSection 
          couple={couple}
          anniversary={anniversary}
          onAnniversaryChange={setAnniversary}
        />

        <AppInfoSection 
          onShowChangelog={() => setShowChangelog(true)}
        />

        <DangerZoneSection 
          onLogout={handleLogout}
          onDisconnect={handleDisconnect}
        />
      </main>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </div>
  );
}