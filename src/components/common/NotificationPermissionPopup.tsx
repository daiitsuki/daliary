import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useCouple } from "../../hooks/useCouple";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { useToast } from "../../context/ToastContext";

const DISMISS_KEY = "daliary_notif_popup_dismissed_until";

export default function NotificationPermissionPopup() {
  const { permissionStatus, isDeviceActive, toggleNotifications } =
    useNotifications();
  const { profile, couple, loading: coupleLoading } = useCouple();
  const location = useLocation();
  const { showToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    // 로딩 중이면 아직 판단하지 않음
    if (coupleLoading) return;

    // 로그인 안 됨 또는 커플 미연결 시 표시 안 함
    if (!profile || !couple) return;

    // 로그인/온보딩 페이지에서는 표시 안 함
    if (location.pathname === "/login" || location.pathname === "/onboarding")
      return;

    // 이번 세션에 이미 팝업을 닫았거나 본 이력이 있다면 더 이상 표시하지 않음
    const sessionDismissed = sessionStorage.getItem(
      "daliary_notif_popup_session_dismissed",
    );
    if (sessionDismissed === "true") return;

    const timer = setTimeout(() => {
      // Notification API가 없는 환경이면 표시 안 함
      if (typeof Notification === "undefined") return;

      // 이미 알림이 활성화된 기기면 표시 안 함
      if (permissionStatus === "granted" && isDeviceActive) return;

      // 하루동안 보지 않기가 활성화된 경우 표시 안 함
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil) {
        const until = parseInt(dismissedUntil, 10);
        if (Date.now() < until) return;
        localStorage.removeItem(DISMISS_KEY);
      }

      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    permissionStatus,
    isDeviceActive,
    profile,
    couple,
    coupleLoading,
    location.pathname,
  ]);

  const handleDismissForDay = () => {
    const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(oneDayFromNow));
    sessionStorage.setItem("daliary_notif_popup_session_dismissed", "true");
    setIsVisible(false);
  };

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const success = await toggleNotifications(true);
      if (success) {
        sessionStorage.setItem("daliary_notif_popup_session_dismissed", "true");
        setIsVisible(false);
      } else {
        // 브라우저에서 차단한 경우
        if (Notification.permission === "denied") {
          showToast("브라우저 설정에서 알림 권한을 허용해주세요.", "error");
        } else {
          showToast("알림 활성화에 실패했어요.", "error");
        }
      }
    } catch {
      showToast("알림 활성화에 실패했어요.", "error");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleBackdropClose = () => {
    // 단순히 닫기만 하고 이번 세션에는 더 이상 보여주지 않도록 sessionStorage에 플래그 설정
    sessionStorage.setItem("daliary_notif_popup_session_dismissed", "true");
    setIsVisible(false);
  };

  const isDenied = permissionStatus === "denied";

  const popupContent = (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[360px] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleBackdropClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-300 transition-all z-10"
            >
              <X size={18} />
            </button>

            {/* 컨텐츠 */}
            <div className="px-8 pt-10 pb-8">
              {/* 아이콘 영역 */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center shadow-lg shadow-rose-100/50">
                    <BellOff size={32} className="text-rose-400" />
                  </div>
                  {/* 뱃지 */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
                    <span className="text-white text-[10px] font-black">!</span>
                  </div>
                </div>
              </div>

              {/* 타이틀 */}
              <h3 className="text-center text-lg font-black text-gray-800 mb-2">
                알림이 꺼져 있어요
              </h3>
              <p className="text-center text-[13px] font-medium text-gray-400 leading-relaxed mb-8">
                {isDenied
                  ? "브라우저에서 알림이 차단되어 있습니다.\n브라우저 설정에서 알림을 허용해주세요."
                  : "상대방의 답변, 일정 변경 등\n중요한 소식을 놓치고 있을 수 있어요!"}
              </p>

              {/* 버튼 영역 */}
              <div className="space-y-3">
                {!isDenied && (
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isEnabling}
                    className="w-full py-4 bg-rose-500 text-white text-[14px] font-black rounded-2xl shadow-lg shadow-rose-200/50 flex items-center justify-center gap-2.5 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isEnabling ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                    ) : (
                      <Bell size={18} strokeWidth={2.5} />
                    )}
                    알림 켜기
                  </button>
                )}

                <button
                  onClick={handleDismissForDay}
                  className="w-full py-3.5 bg-gray-50 text-gray-400 text-[13px] font-bold rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all"
                >
                  하루동안 보지 않기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(popupContent, document.body);
}
