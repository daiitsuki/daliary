import React, { useState } from "react";
import {
  Bell,
  AlertCircle,
  MessageSquare,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Plane,
  MessageCircle,
  ChevronDown,
  ChevronUp,
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!settings) return null;

  // The toggle is visually ON only if:
  // 1. Global setting is enabled AND
  // 2. This specific device is the active receiver
  const isToggleOn = settings.is_enabled && isDeviceActive;

  const handleToggle = async () => {
    setIsProcessing(true);
    // If it's visually ON, turn it OFF.
    // If it's visually OFF (either disabled globally OR active on another device), turn it ON (steal active status).
    await toggleNotifications(!isToggleOn);
    setIsProcessing(false);
  };

  const notificationTypes: {
    key: keyof NotificationSettings;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "notify_question_answered",
      label: "오늘의 질문 답변",
      icon: <MessageSquare size={14} />,
    },
    {
      key: "notify_question_request",
      label: "답변 요청",
      icon: <Bell size={14} />,
    },
    {
      key: "notify_schedule_change",
      label: "일정 변경",
      icon: <Calendar size={14} />,
    },
    {
      key: "notify_trip_change",
      label: "여행 계획 변경",
      icon: <Plane size={14} />,
    },
    {
      key: "notify_place_added",
      label: "가고 싶은 곳 추가",
      icon: <MapPin size={14} />,
    },
    {
      key: "notify_visit_verified",
      label: "방문 인증 완료",
      icon: <CheckCircle2 size={14} />,
    },
    {
      key: "notify_visit_comment",
      label: "방문 기록 댓글",
      icon: <MessageCircle size={14} />,
    },
    {
      key: "notify_level_up",
      label: "레벨업 소식",
      icon: <TrendingUp size={14} />,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between ml-1">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          알림
        </h2>
      </div>

      <div className="bg-white p-5 rounded-[24px] border border-gray-100 space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <Bell size={20} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800">알림 설정</h3>
              <p className="text-[11px] text-gray-400 font-medium">
                중요한 소식을 놓치지 마세요
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={isProcessing}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isToggleOn ? "bg-rose-400" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isToggleOn ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Device Active Warning */}
        {settings.is_enabled && !isDeviceActive && (
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              현재 알림이{" "}
              <span className="font-bold text-gray-700">다른 기기</span>에서
              활성화되어 있습니다. 여기서 알림을 받으려면 위 버튼을 켜주세요.
            </p>
          </div>
        )}

        {/* Permission Warning */}
        {permissionStatus === "denied" && isToggleOn && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-amber-900">
                알림 권한이 차단되어 있습니다
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                브라우저 설정에서 알림 권한을 '허용'으로 변경해야 알림을 받을 수
                있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Details */}
        <AnimatePresence>
          {isToggleOn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-2">
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="flex items-center justify-between w-full py-2 group"
                >
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                    세부 알림 설정
                  </span>
                  {isDetailsOpen ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {isDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 gap-2 mt-3"
                    >
                      {notificationTypes.map((type) => (
                        <div
                          key={type.key}
                          className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl border border-gray-100/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-rose-300">{type.icon}</div>
                            <span className="text-[12px] font-bold text-gray-600">
                              {type.label}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              updateGranularSetting(
                                type.key,
                                !settings[type.key],
                              )
                            }
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                              settings[type.key] ? "bg-rose-300" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                settings[type.key]
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default NotificationSettingsSection;
