import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCouple } from "../hooks/useCouple";
import { useToast } from "../context/ToastContext";
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
import DisplaySettingsSection from "../components/settings/DisplaySettingsSection";

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
  const { showToast } = useToast();
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

    try {
      setLoading(true);

      const { error: coupleError } = await supabase
        .from("couples")
        .update({ anniversary_date: targetAnniversary })
        .eq("id", couple.id);

      if (coupleError) throw coupleError;

      await fetchCoupleInfo();
      showToast("저장되었습니다.", "success");
    } catch (error) {
      console.error(error);
      showToast("저장 실패", "error");
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
        showToast("입력 내용이 일치하지 않아 취소되었습니다.", "info");
      }
      return;
    }

    try {
      await disconnect();
      navigate("/onboarding");
    } catch (error) {
      console.error(error);
      showToast("연결 해제 실패", "error");
    }
  };

  return (
    <div className="flex-1 bg-[#FDFDFE] flex flex-col h-full overflow-y-auto custom-scrollbar relative">
      <SettingsHeader onBack={() => navigate(-1)} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl mx-auto px-6 py-6 space-y-8 pb-32 shrink-0"
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
          <DisplaySettingsSection />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AppInfoSection onShowChangelog={() => setShowChangelog(true)} />
        </motion.div>

        {isDevMode && (
          <motion.div variants={itemVariants} className="pt-2">
            <DangerZoneSection onDisconnect={handleDisconnect} />
          </motion.div>
        )}

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
