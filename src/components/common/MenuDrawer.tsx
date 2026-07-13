import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Settings, Heart, PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../types";

import { changelog } from "../../data/changelog";
import ChangelogModal from "./ChangelogModal";
import { useCouple } from "../../hooks";
import { useCouplePoints } from "../../hooks";
import { useHomeContext } from "../../context/HomeContext";
import { differenceInSeconds, parseISO, startOfDay } from "date-fns";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  myProfile: Profile | null;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  myProfile,
}) => {
  const navigate = useNavigate();
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const { couple } = useCouple();
  const { currentPoints } = useCouplePoints();
  const { partnerProfile } = useHomeContext();

  // changelog 배열의 마지막 항목(최신) 버전을 가져옵니다.
  const latestVersion = changelog[changelog.length - 1]?.version || "1.0.0";

  // 함께한 시간 실시간 계산 (시간/분/초 단위)
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !couple?.anniversary_date) {
      setElapsedTime(null);
      return;
    }

    const updateTime = () => {
      try {
        const anniversary = startOfDay(parseISO(couple.anniversary_date!));
        const now = new Date();
        const diffSeconds = differenceInSeconds(now, anniversary);

        if (diffSeconds < 0) {
          // 미래인 경우 기존 D-Day 방식 유지
          const days = Math.ceil(diffSeconds / 86400);
          setElapsedTime(`D${days}`);
          return;
        }

        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;

        setElapsedTime(
          `${hours.toLocaleString()}시간 ${minutes}분 ${seconds}초`,
        );
      } catch (error) {
        setElapsedTime(null);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isOpen, couple?.anniversary_date]);

  // 브라우저 뒤로가기 버튼 지원
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "menu-drawer" }, "");
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "menu-drawer") {
          onClose();
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "menu-drawer") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  // 간소화된 메뉴 리스트
  const menuItems = [
    { icon: <User size={20} />, label: "내 정보", path: "/profile" },
    { icon: <Settings size={20} />, label: "설정", path: "/settings" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-[280px] max-w-[80%] h-full bg-[#FDFDFE] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
              <span className="text-xl font-black text-rose-500 tracking-tighter">
                달이어리
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Profile Summary */}
            <div className="px-6 py-4 border-b border-gray-50 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 overflow-hidden flex items-center justify-center shrink-0">
                  {myProfile?.avatar_url ? (
                    <img
                      src={myProfile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-rose-200" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-gray-900 truncate">
                    {myProfile?.nickname || "사용자"}
                  </span>
                </div>
              </div>

              {/* Stats Area */}
              {couple && (
                <div className="flex flex-col gap-4 bg-rose-50/40 p-4 rounded-2xl border border-rose-100/30">
                  {elapsedTime && (
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-rose-100/50 shrink-0">
                        <Heart
                          size={18}
                          className="text-rose-400 fill-rose-400"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-rose-300 tracking-tight mb-0.5">
                          {partnerProfile?.nickname
                            ? `${partnerProfile.nickname}님과 함께한 시간`
                            : "함께한 시간"}
                        </span>
                        <span className="text-[14px] font-black text-rose-500 tabular-nums">
                          {elapsedTime}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-rose-100/50 shrink-0">
                      <PiggyBank size={18} className="text-rose-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tight mb-0.5">
                        잔여 포인트
                      </span>
                      <span className="text-[14px] font-black text-gray-700 tabular-nums">
                        {currentPoints.toLocaleString()} P
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu List */}
            <nav className="flex-1 px-3 py-6 space-y-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-rose-50 hover:text-rose-500 text-gray-600 active:scale-[0.98]"
                >
                  <span className="text-rose-400">{item.icon}</span>
                  <span className="font-bold text-[15px]">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-6 space-y-4">
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setIsChangelogOpen(true)}
                  className="text-[11px] text-gray-300 font-medium hover:text-rose-400 transition-colors"
                >
                  v{latestVersion}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(drawerContent, document.getElementById("app-container") || document.body)}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </>
  );
};

export default MenuDrawer;
