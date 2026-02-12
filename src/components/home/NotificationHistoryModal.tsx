import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Calendar, MessageSquare, MapPin, TrendingUp, CheckCircle2 } from "lucide-react";
import { useNotifications, AppNotification } from "../../hooks/useNotifications";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({ isOpen, onClose, userId }) => {
  const { notifications, loading, markAsRead } = useNotifications(userId);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 뒤로가기 시 모달 닫기 로직
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "notification" }, "");
      
      const handlePopState = () => {
        onClose();
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        // 만약 모달이 뒤로가기가 아닌 다른 방식(X 버튼 등)으로 닫혔다면 히스토리 정리
        if (window.history.state?.modal === "notification") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case "question_answered":
      case "question_request":
        return <MessageSquare size={16} className="text-rose-400" />;
      case "schedule_change":
        return <Calendar size={16} className="text-blue-400" />;
      case "place_added":
        return <MapPin size={16} className="text-amber-400" />;
      case "visit_verified":
        return <CheckCircle2 size={16} className="text-green-400" />;
      case "level_up":
        return <TrendingUp size={16} className="text-purple-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform-gpu"
          >
            <div className="p-6 flex items-center justify-between border-b border-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-rose-400" />
                <h2 className="text-lg font-bold text-gray-800">알림 소식</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-400 text-[13px] font-medium">알림을 불러오고 있어요</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-20 text-center">
                  <Bell size={40} className="text-gray-100 mx-auto mb-4" />
                  <p className="text-gray-400 text-[13px] font-medium">아직 새로운 소식이 없어요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        notif.is_read 
                          ? "bg-white border-gray-50" 
                          : "bg-rose-50/30 border-rose-100/50"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          notif.is_read ? "bg-gray-50" : "bg-white shadow-sm"
                        }`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-[13px] font-bold leading-tight ${
                              notif.is_read ? "text-gray-600" : "text-gray-900"
                            }`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                              {format(new Date(notif.created_at), "M월 d일 a h:mm", { locale: ko })}
                            </span>
                          </div>
                          <p className={`text-[12px] leading-relaxed ${
                            notif.is_read ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {notif.content}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="shrink-0 w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center shrink-0">
              <p className="text-[11px] text-gray-400 font-medium">
                알림은 최대 20개까지 보관됩니다
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default NotificationHistoryModal;
