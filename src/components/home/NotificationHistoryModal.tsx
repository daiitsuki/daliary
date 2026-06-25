import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, MessageSquare, MapPin, TrendingUp, CheckCircle2, ShoppingBag, Gamepad2, Plane } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import BaseModal from "../common/BaseModal";

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({ isOpen, onClose }) => {
  const { notifications, loading, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClose = () => {
    const hasUnread = notifications.some((n) => !n.is_read);
    if (hasUnread) {
      markAllAsRead();
    }
    onClose();
  };

  const handleCloseRef = React.useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

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
      case "item_purchased":
        return <ShoppingBag size={16} className="text-rose-400" />;
      case "game_reward":
        return <Gamepad2 size={16} className="text-emerald-400" />;
      case "trip_change":
        return <Plane size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // Mark all as read since the modal is closing/seen
    const hasUnread = notifications.some((n) => !n.is_read);
    if (hasUnread) {
      markAllAsRead();
    }

    // Navigate to target URL
    const targetUrl = notif.metadata?.url || "/home";
    onClose();
    navigate(targetUrl);
  };

  const footerContent = (
    <div className="text-center w-full">
      <p className="text-[11px] text-gray-400 font-medium">
        알림은 최대 20개까지 보관됩니다
      </p>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="알림 소식"
      icon={Bell}
      maxWidth="md"
      contentClassName="p-4"
      footer={footerContent}
    >
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
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.is_read 
                  ? "bg-white border-gray-50 hover:bg-gray-50/50" 
                  : "bg-rose-50/30 border-rose-100/50 hover:bg-rose-50/50"
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
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
};

export default NotificationHistoryModal;
