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
      <div className="flex items-center gap-2 px-1">
        <div className="w-1.5 h-5 bg-gray-400 rounded-full" />
        <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">
          개발자 모드
        </h2>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-[32px] border border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Test Notification */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Terminal size={22} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-gray-700">나에게 알림 보내기</h3>
              <p className="text-[10px] font-bold text-gray-400">
                테스트 푸시 알림을 즉시 발송합니다
              </p>
            </div>
          </div>
          <button
            onClick={handleSendTestNotification}
            disabled={isSending || !settings?.is_enabled || !isDeviceActive}
            className={`p-3 rounded-2xl transition-all active:scale-90 ${
              isSending || !settings?.is_enabled || !isDeviceActive
                ? "bg-gray-50 text-gray-200 cursor-not-allowed border border-transparent"
                : "bg-rose-50 text-rose-400 hover:bg-rose-100 border border-rose-100/50 shadow-sm"
            }`}
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DeveloperModeSection;
