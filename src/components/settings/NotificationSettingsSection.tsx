import React, { useState } from "react";
import { Bell, AlertCircle, Settings as SettingsIcon, MessageSquare, Calendar, MapPin, TrendingUp, CheckCircle2 } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationSettings } from "../../context/NotificationsContext";

interface NotificationSettingsSectionProps {
  userId: string | null;
}

const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = () => {
  const { settings, toggleNotifications, updateGranularSetting, permissionStatus } = useNotifications();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!settings) return null;

  const handleToggle = async () => {
    setIsProcessing(true);
    await toggleNotifications(!settings.is_enabled);
    setIsProcessing(false);
  };

  const notificationTypes: { key: keyof NotificationSettings; label: string; icon: React.ReactNode }[] = [
    { key: 'notify_question_answered', label: '오늘의 질문 답변', icon: <MessageSquare size={14} /> },
    { key: 'notify_question_request', label: '답변 요청', icon: <Bell size={14} /> },
    { key: 'notify_schedule_change', label: '일정 변경', icon: <Calendar size={14} /> },
    { key: 'notify_place_added', label: '가고 싶은 곳 추가', icon: <MapPin size={14} /> },
    { key: 'notify_visit_verified', label: '방문 인증 완료', icon: <CheckCircle2 size={14} /> },
    { key: 'notify_level_up', label: '레벨업 소식', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl">
            <Bell size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">알림 설정</h3>
            <p className="text-[11px] text-gray-400 font-medium">중요한 소식을 놓치지 마세요</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            settings.is_enabled ? "bg-rose-400" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.is_enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {settings.is_enabled && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1 mb-3">세부 알림 설정</p>
          <div className="grid grid-cols-1 gap-2">
            {notificationTypes.map((type) => (
              <div 
                key={type.key}
                className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl border border-gray-100/50"
              >
                <div className="flex items-center gap-3">
                  <div className="text-rose-300">
                    {type.icon}
                  </div>
                  <span className="text-[12px] font-bold text-gray-600">{type.label}</span>
                </div>
                <button
                  onClick={() => updateGranularSetting(type.key, !settings[type.key])}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings[type.key] ? "bg-rose-300" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings[type.key] ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {permissionStatus === "denied" && settings.is_enabled && (
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[12px] font-bold text-amber-900">알림 권한이 차단되어 있습니다</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              브라우저 설정에서 알림 권한을 '허용'으로 변경해야 알림을 받을 수 있습니다. 
              일반적으로 주소창 왼쪽의 자물쇠 아이콘을 클릭하여 설정할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-2xl">
          <SettingsIcon size={14} className="text-gray-400 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            알림은 보안을 위해 <span className="font-bold text-gray-700">가장 최근에 활성화한 기기 1대</span>로만 전송됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsSection;
