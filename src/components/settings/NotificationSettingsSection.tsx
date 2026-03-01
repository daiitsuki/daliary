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
  ChevronDown,
  ChevronUp,
  ShoppingBag,
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
  } = useNotifications();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!settings) return null;

  const isToggleOn = settings.is_enabled;

  const handleToggle = async () => {
    setIsProcessing(true);
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
      icon: <MessageSquare size={12} />,
    },
    {
      key: "notify_question_request",
      label: "답변 요청",
      icon: <Bell size={12} />,
    },
    {
      key: "notify_schedule_change",
      label: "일정 변경",
      icon: <Calendar size={12} />,
    },
    {
      key: "notify_trip_change",
      label: "여행 계획 변경",
      icon: <Plane size={12} />,
    },
    {
      key: "notify_place_added",
      label: "가고 싶은 곳 추가",
      icon: <MapPin size={12} />,
    },
    {
      key: "notify_visit_verified",
      label: "방문 인증 완료",
      icon: <CheckCircle2 size={12} />,
    },
    {
      key: "notify_level_up",
      label: "레벨업 소식",
      icon: <TrendingUp size={12} />,
    },
    {
      key: "notify_item_purchased",
      label: "아이템 구매",
      icon: <ShoppingBag size={12} />,
    },
    {
      key: "notify_game_reward",
      label: "게임 미션 달성",
      icon: <Gamepad2 size={12} />,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-rose-400/80 rounded-full" />
        <h2 className="text-base sm:text-lg font-black text-gray-800 tracking-tight">
          알림 설정
        </h2>
      </div>

      <div className="bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden divide-y divide-gray-50/50">
        {/* Main Toggle */}
        <div className="p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-gray-700">푸시 알림</h3>
                <p className="text-[9px] font-bold text-gray-400">
                  실시간 소식을 이 기기에서 받습니다
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={isProcessing}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all active:scale-90 ${
                isToggleOn ? "bg-rose-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                  isToggleOn ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Permission Warning */}
          {permissionStatus === "denied" && isToggleOn && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-2.5"
            >
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[11px] font-black text-amber-900">
                  알림 권한이 차단됨
                </p>
                <p className="text-[9px] font-bold text-amber-700/80 leading-relaxed">
                  브라우저 설정에서 권한을 '허용'으로 변경해주세요.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Collapsible Details */}
        <AnimatePresence>
          {isToggleOn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-gray-50/30"
            >
              <div className="p-4 sm:p-5">
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="flex items-center justify-between w-full py-1.5 group mb-1"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                    세부 알림 맞춤 설정
                  </span>
                  <div className="w-5 h-5 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    {isDetailsOpen ? (
                      <ChevronUp size={12} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={12} className="text-gray-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-1 mt-2"
                    >
                      {notificationTypes.map((type) => (
                        <div
                          key={type.key}
                          className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/50 transition-colors group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-rose-300 group-hover/item:scale-110 transition-transform">
                              {type.icon}
                            </div>
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
                            className={`relative inline-flex h-4.5 w-8.5 items-center rounded-full transition-all active:scale-90 ${
                              settings[type.key] ? "bg-rose-300" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                                settings[type.key]
                                  ? "translate-x-4.5"
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
