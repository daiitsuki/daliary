import React, { useState } from "react";
import {
  Bell,
  AlertCircle,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Gamepad2,
} from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationSettings } from "../../context/NotificationsContext";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationSettingsSectionProps {
  userId: string | null;
}

const NotificationSettingsSection: React.FC<
  NotificationSettingsSectionProps
> = () => {
  const {
    settings,
    toggleNotifications,
    updateGranularSetting,
    permissionStatus,
    isDeviceActive,
  } = useNotifications();
  const [isProcessing, setIsProcessing] = useState(false);
  // 낙관적 업데이트: 실제 isDeviceActive가 확정되기 전에 UI를 먼저 반응시키는 임시 상태
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  if (!settings) return null;

  // optimisticActive가 있으면 우선 사용, 없으면 실제 상태 사용
  const isToggleOn = optimisticActive ?? isDeviceActive;

  const handleToggle = async () => {
    if (isProcessing) return;
    const nextState = !isToggleOn;
    // ① 클릭 즉시 UI를 낙관적으로 반전
    setOptimisticActive(nextState);
    setIsProcessing(true);
    try {
      const success = await toggleNotifications(nextState);
      if (!success) {
        // ② 실패 시 즉시 원래 상태로 복구
        setOptimisticActive(null);
      }
    } finally {
      // ③ 완료 후 실제 isDeviceActive로 자연스럽게 전환
      setOptimisticActive(null);
      setIsProcessing(false);
    }
  };

  const notificationTypes: {
    key: keyof NotificationSettings;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "notify_communication",
      label: "소통 알림",
      description: "(질문, 추억 피드 댓글, 프로필 사진 변경)",
      icon: <MessageSquare size={16} strokeWidth={2.5} />,
    },
    {
      key: "notify_schedule_trip",
      label: "일정 및 여행 알림",
      description: "(캘린더 일정, 여행 계획, 세부 스케줄 업데이트)",
      icon: <Calendar size={16} strokeWidth={2.5} />,
    },
    {
      key: "notify_visit_verified",
      label: "방문 인증 완료",
      description: "(새로운 장소 방문 인증 완료)",
      icon: <CheckCircle2 size={16} strokeWidth={2.5} />,
    },
    {
      key: "notify_game_activity",
      label: "활동 보상",
      description: "(캐릭터 레벨업, 아이템 구매, 미션 달성)",
      icon: <Gamepad2 size={16} strokeWidth={2.5} />,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="px-2 mb-3">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          알림 설정
        </h2>
      </div>

      <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/30 overflow-hidden">
        {/* Main Toggle Area */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-rose-50 rounded-[14px] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bell size={20} className="text-rose-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">푸시 알림</h3>
              
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={isProcessing}
              aria-label={`푸시 알림 ${isToggleOn ? '끄기' : '켜기'}`}
              className={`relative inline-flex h-6 w-[44px] items-center rounded-full transition-colors ${
                isProcessing ? 'cursor-not-allowed' : 'active:scale-95'
              } ${isToggleOn ? "bg-rose-400" : "bg-gray-200"}`}
            >
              <span
                className={`relative inline-flex items-center justify-center h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                  isToggleOn ? "translate-x-6" : "translate-x-1"
                }`}
              >
                {isProcessing && (
                  <span className="absolute w-3 h-3 rounded-full border-[1.5px] border-gray-200 border-t-rose-400 animate-spin" />
                )}
              </span>
            </button>
          </div>

          {/* Permission Warning */}
          <AnimatePresence>
            {permissionStatus === "denied" && isToggleOn && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100/50 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-black text-amber-900">
                      알림 권한이 차단됨
                    </span>
                    <span className="text-[11px] font-bold text-amber-700/80 leading-snug">
                      기기 브라우저 설정에서 권한을 '허용'으로 변경해주세요.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Detailed Settings List (Shown naturally when Main Toggle is ON) */}
        <AnimatePresence>
          {isToggleOn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50/50 border-t border-gray-100/50"
            >
              <div className="p-5 sm:p-6 space-y-6">
                {notificationTypes.map((type) => (
                  <div
                    key={type.key}
                    className="flex items-center justify-between group/item"
                  >
                    <div className="flex items-center gap-3.5 pr-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex shrink-0 items-center justify-center text-gray-400 group-hover/item:scale-110 group-hover/item:text-rose-400 transition-all">
                        {type.icon}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-semibold text-gray-800 tracking-tight">
                          {type.label}
                        </span>
                        <span className="text-[12px] font-medium text-gray-400 leading-snug">
                          {type.description}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateGranularSetting(type.key, !settings[type.key])}
                      className={`relative inline-block h-[20px] w-[40px] shrink-0 rounded-full transition-all active:scale-90 ${
                        settings[type.key] ? "bg-rose-400" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                          settings[type.key] ? "translate-x-[20px]" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default NotificationSettingsSection;
