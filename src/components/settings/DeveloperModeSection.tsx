import React, { useState } from "react";
import { Terminal, Send } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useCouple } from "../../hooks/useCouple";
import { supabase } from "../../lib/supabase";

const DeveloperModeSection: React.FC = () => {
  const { settings, isDeviceActive } = useNotifications();
  const { profile, couple } = useCouple();
  const [isSending, setIsSending] = useState(false);

  const handleSendTestNotification = async () => {
    if (!profile?.id || !couple?.id) return;

    if (!settings?.is_enabled || !isDeviceActive) {
      alert("알림 설정이 켜져있고 현재 기기가 활성화되어 있어야 합니다.");
      return;
    }

    try {
      setIsSending(true);
      const { error } = await supabase.from("notifications").insert({
        user_id: profile.id,
        couple_id: couple.id,
        type: "test",
        title: "테스트 알림",
        content: "개발자 모드에서 보낸 테스트 알림입니다.",
      });

      if (error) throw error;
      alert("알림을 보냈습니다.");
    } catch (error) {
      console.error(error);
      alert("알림 보내기 실패");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between ml-1">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          개발자 모드
        </h2>
      </div>

      <div className="bg-white p-5 rounded-[24px] border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <Terminal size={20} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800">나에게 알림 보내기</h3>
              <p className="text-[11px] text-gray-400 font-medium">
                내 FCM 토큰으로 테스트 알림을 보냅니다
              </p>
            </div>
          </div>
          <button
            onClick={handleSendTestNotification}
            disabled={isSending || !settings?.is_enabled || !isDeviceActive}
            className={`p-2 rounded-xl transition-colors ${
              isSending || !settings?.is_enabled || !isDeviceActive
                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                : "bg-rose-50 text-rose-400 hover:bg-rose-100"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DeveloperModeSection;
