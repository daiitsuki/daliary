import { useState } from "react";
import { Heart, UserPlus, User, Menu, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ImageViewerModal from "../common/ImageViewerModal";
import AnniversaryModal from "../common/AnniversaryModal";
import MenuDrawer from "../common/MenuDrawer";
import NotificationHistoryModal from "./NotificationHistoryModal";
import { useNotifications, useHomeData, useCouple } from "../../hooks";
import { supabase } from "../../lib/supabase";
import { getKSTTodayDow, timeToMinutes } from "../../utils/timetableUtils";

interface HomeHeaderProps {}

export default function HomeHeader({}: HomeHeaderProps) {
  const { myProfile, partnerProfile, dDay, couple } = useHomeData();
  const { profile } = useCouple();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const hasUnread = notifications.some((n) => !n.is_read);

  // 현재 요일 시간표 조회
  const todayDow = getKSTTodayDow();
  const { data: blocks = [] } = useQuery({
    queryKey: ["timetable_blocks_today", couple?.id, todayDow],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from("timetable_blocks")
        .select("id, writer_id, title, start_time, end_time")
        .eq("couple_id", couple.id)
        .eq("day_of_week", todayDow);

      if (error) throw error;
      return data || [];
    },
    enabled: !!couple?.id,
    staleTime: 1000 * 60 * 5,
  });

  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const currentMinutes = kst.getHours() * 60 + kst.getMinutes();

  const myBlocks = blocks.filter((b) => b.writer_id === profile?.id);
  const partnerBlocks = blocks.filter((b) => b.writer_id !== profile?.id);

  const getCurrentBlockTitle = (userBlocks: any[]) => {
    const current = userBlocks.find((b) => {
      const start = timeToMinutes(b.start_time);
      const end = timeToMinutes(b.end_time);
      return currentMinutes >= start && currentMinutes < end;
    });
    return current ? current.title : null;
  };

  const myCurrentSchedule = getCurrentBlockTitle(myBlocks);
  const partnerCurrentSchedule = getCurrentBlockTitle(partnerBlocks);

  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
  }>({
    isOpen: false,
    url: null,
    title: "",
  });

  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const openViewer = (url: string | null | undefined, title: string) => {
    if (!url) return;
    setViewerState({ isOpen: true, url, title });
  };

  const closeViewer = () => {
    setViewerState((prev) => ({ ...prev, isOpen: false }));
  };

  const getLastActiveLabel = (dateString?: string) => {
    if (!dateString) return null;
    const lastActive = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - lastActive.getTime()) / 1000,
    );

    if (diffInSeconds < 300) return "접속중";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return "오래전";
  };

  const activeStatus = getLastActiveLabel(partnerProfile?.last_active_at);

  return (
    <header className="px-6 pt-4 pb-2 flex flex-col sticky top-0 bg-[#FDFDFE]/90 backdrop-blur-md z-20">
      {/* Navigation Row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors relative"
        >
          <Menu size={24} className="text-gray-900" />
        </button>

        <button
          onClick={() => setIsNotificationOpen(true)}
          className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors relative"
        >
          <Bell size={24} className="text-gray-900" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Couple Row */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-6">
          {/* My Profile */}
          <div className="flex flex-col items-center">
            <div
              onClick={() =>
                openViewer(myProfile?.avatar_url, myProfile?.nickname || "나")
              }
              className={`w-12 h-12 rounded-full bg-white border border-rose-100 overflow-hidden shadow-sm transition-transform active:scale-95 flex items-center justify-center ${myProfile?.avatar_url ? "cursor-pointer" : ""}`}
            >
              {myProfile?.avatar_url ? (
                <img
                  src={myProfile.avatar_url}
                  alt="Me"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-gray-200" />
              )}
            </div>
            <span className="text-[11px] mt-1.5 text-gray-700 font-bold tracking-tight">
              {myProfile?.nickname || "나"}
            </span>
            {myCurrentSchedule && (
              <button
                type="button"
                onClick={() => navigate("/calendar?tab=timetable")}
                className="mt-1 px-2 py-0.5 rounded-md bg-gray-100/80 text-[10px] font-medium text-gray-600 max-w-[84px] truncate hover:bg-gray-200/80 transition-colors"
              >
                {myCurrentSchedule}
              </button>
            )}
          </div>

          {/* D-Day */}
          <div className="flex flex-col items-center px-2">
            <div
              onClick={() => setIsAnniversaryModalOpen(true)}
              className="bg-rose-50/70 px-4 py-1.5 rounded-full flex items-center gap-1.5 border border-rose-100/50 cursor-pointer transition-transform active:scale-95 hover:bg-rose-100/50 shadow-2xs"
            >
              <Heart className="text-rose-400 fill-rose-400" size={13} />
              <span className="text-rose-500 font-black text-[13px] tabular-nums">
                {couple ? `D+${dDay}` : "D-Day"}
              </span>
            </div>
          </div>

          {/* Partner Profile */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div
                onClick={() =>
                  openViewer(
                    partnerProfile?.avatar_url,
                    partnerProfile?.nickname || "파트너",
                  )
                }
                className={`w-12 h-12 rounded-full bg-white border border-gray-100 overflow-hidden shadow-sm transition-transform active:scale-95 flex items-center justify-center ${partnerProfile?.avatar_url ? "cursor-pointer" : ""}`}
              >
                {partnerProfile?.avatar_url ? (
                  <img
                    src={partnerProfile.avatar_url}
                    alt="Partner"
                    className="w-full h-full object-cover"
                  />
                ) : !partnerProfile ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                    <UserPlus size={18} />
                  </div>
                ) : (
                  <User size={20} className="text-gray-200" />
                )}
              </div>
              {/* Active Indicator outside overflow-hidden */}
              {activeStatus === "접속중" && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#FDFDFE] rounded-full shadow-sm" />
              )}
            </div>

            <div className="flex flex-col items-center mt-1.5">
              <span className="text-[11px] text-gray-700 font-bold tracking-tight leading-none">
                {partnerProfile?.nickname || "파트너"}
              </span>
              {partnerCurrentSchedule ? (
                <button
                  type="button"
                  onClick={() => navigate("/calendar?tab=timetable")}
                  className="mt-1 px-2 py-0.5 rounded-md bg-gray-100/80 text-[10px] font-medium text-gray-600 max-w-[84px] truncate hover:bg-gray-200/80 transition-colors"
                >
                  {partnerCurrentSchedule}
                </button>
              ) : activeStatus ? (
                <span
                  className={`text-[9px] font-bold mt-1 ${activeStatus === "접속중" ? "text-green-500" : "text-gray-400"}`}
                >
                  {activeStatus}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ImageViewerModal
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
        imageUrl={viewerState.url}
        title={viewerState.title}
      />

      <AnniversaryModal
        isOpen={isAnniversaryModalOpen}
        onClose={() => setIsAnniversaryModalOpen(false)}
      />

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        myProfile={myProfile}
      />

      <NotificationHistoryModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        userId={myProfile?.id || null}
      />
    </header>
  );
}
