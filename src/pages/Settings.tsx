import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCouple } from "../hooks/useCouple";
import { motion, Variants } from "framer-motion";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

// Sub-components
import SettingsHeader from "../components/settings/SettingsHeader";
import CalendarSettingsSection from "../components/settings/CalendarSettingsSection";
import DangerZoneSection from "../components/settings/DangerZoneSection";
import NotificationSettingsSection from "../components/settings/NotificationSettingsSection";
import DeveloperModeSection from "../components/settings/DeveloperModeSection";
import AppInfoSection from "../components/settings/AppInfoSection";
import ChangelogModal from "../components/common/ChangelogModal";
import CoupleSettingsSection from "../components/settings/CoupleSettingsSection";

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
  const {
    couple,
    profile,
    fetchCoupleInfo,
    disconnect,
    isCoupleFormed,
  } = useCouple();
  const [isDevMode, setIsDevMode] = useState(
    () => sessionStorage.getItem("dev_mode_active") === "true",
  );
  const [showChangelog, setShowChangelog] = useState(false);
  const [anniversary, setAnniversary] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (couple?.anniversary_date) {
      setAnniversary(couple.anniversary_date);
    }
  }, [couple]);

  const handleAnniversarySave = async (newAnniversary?: string) => {
    if (!couple) return;

    const targetAnniversary = newAnniversary || anniversary;
    if (targetAnniversary === couple.anniversary_date) return;

    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000;
    const savedTimestamp = localStorage.getItem("last_settings_save_time");
    const lastSaveTime = savedTimestamp ? parseInt(savedTimestamp, 10) : 0;

    const timeRemaining = lastSaveTime + COOLDOWN_MS - now;

    if (timeRemaining > 0) {
      const minutesRemaining = Math.ceil(timeRemaining / 60000);
      alert(
        `저장은 5분에 한 번씩만 가능합니다. ${minutesRemaining}분 후에 다시 시도해주세요.`,
      );
      if (couple.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
      return;
    }

    if (
      !window.confirm(
        "설정 변경은 5분에 한 번씩만 가능합니다. 정말로 변경하시겠습니까?",
      )
    ) {
      if (couple.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
      return;
    }

    try {
      setLoading(true);

      const { error: coupleError } = await supabase
        .from("couples")
        .update({ anniversary_date: targetAnniversary })
        .eq("id", couple.id);

      if (coupleError) throw coupleError;

      await fetchCoupleInfo();
      localStorage.setItem("last_settings_save_time", Date.now().toString());
      alert("저장되었습니다.");
    } catch (error) {
      console.error(error);
      alert("저장 실패");
      if (couple.anniversary_date) {
        setAnniversary(couple.anniversary_date);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "정말로 커플 연결을 해제하시겠습니까? 모든 데이터가 삭제됩니다.",
      )
    )
      return;

    const userInput = window.prompt(
      "정말로 해제하시려면 '커플 연결 해제하기'를 입력해주세요.",
    );

    if (userInput !== "커플 연결 해제하기") {
      if (userInput !== null) {
        alert("입력 내용이 일치하지 않아 취소되었습니다.");
      }
      return;
    }

    try {
      await disconnect();
      navigate("/onboarding");
    } catch (error) {
      console.error(error);
      alert("연결 해제 실패");
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <SettingsHeader onBack={() => navigate(-1)} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 custom-scrollbar"
      >
        <motion.div variants={itemVariants}>
          <CoupleSettingsSection
            couple={couple}
            anniversary={anniversary}
            onAnniversaryChange={setAnniversary}
            isCoupleFormed={isCoupleFormed}
            onSave={handleAnniversarySave}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CalendarSettingsSection />
        </motion.div>

        <motion.div variants={itemVariants}>
          <NotificationSettingsSection userId={profile?.id || null} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AppInfoSection onShowChangelog={() => setShowChangelog(true)} />
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <DangerZoneSection onDisconnect={handleDisconnect} />
        </motion.div>

        {isDevMode && (
          <motion.div variants={itemVariants}>
            <DeveloperModeSection />
          </motion.div>
        )}
      </motion.main>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
        onActivateDevMode={() => setIsDevMode(true)}
      />
    </div>
  );
}
