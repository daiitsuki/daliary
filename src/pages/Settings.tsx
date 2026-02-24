import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCouple } from "../hooks/useCouple";
import { motion, Variants } from "framer-motion";

// Sub-components
import SettingsHeader from "../components/settings/SettingsHeader";
import CalendarSettingsSection from "../components/settings/CalendarSettingsSection";
import DangerZoneSection from "../components/settings/DangerZoneSection";
import NotificationSettingsSection from "../components/settings/NotificationSettingsSection";
import DeveloperModeSection from "../components/settings/DeveloperModeSection";
import AppInfoSection from "../components/settings/AppInfoSection";
import ChangelogModal from "../components/common/ChangelogModal";

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
  const { profile, disconnect } = useCouple();
  const [isDevMode, setIsDevMode] = useState(
    () => sessionStorage.getItem("dev_mode_active") === "true",
  );
  const [showChangelog, setShowChangelog] = useState(false);

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
      navigate("/");
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

      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
        onActivateDevMode={() => setIsDevMode(true)}
      />
    </div>
  );
}
