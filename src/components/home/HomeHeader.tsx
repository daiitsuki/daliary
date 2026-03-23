import React, { useState } from "react";
import { Heart, UserPlus, User } from "lucide-react";
import ImageViewerModal from "../common/ImageViewerModal";
import AnniversaryModal from "../common/AnniversaryModal";
import { Profile, Couple } from "../../types";

interface HomeHeaderProps {
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  dDay: number | string;
  couple: Couple | null;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  myProfile,
  partnerProfile,
  dDay,
  couple,
}) => {
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
    <header className="px-6 pt-6 pb-2 flex flex-col sticky top-0 bg-[#FDFDFE]/90 backdrop-blur-md z-20">
      {/* Brand Row */}
      <div className="flex items-center gap-2 mb-4">
        <img src="/logo.png" alt="logo" className="w-6 h-6 object-contain" />
        <span className="text-[17px] font-bold text-gray-900 tracking-tight">
          달이어리
        </span>
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
            <span className="text-[11px] mt-1.5 text-gray-400 font-bold tracking-tight">
              {myProfile?.nickname || "나"}
            </span>
          </div>

          {/* D-Day */}
          <div className="flex flex-col items-center px-4">
            <div 
              onClick={() => setIsAnniversaryModalOpen(true)}
              className="bg-rose-50/50 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-rose-100/30 cursor-pointer transition-transform active:scale-95 hover:bg-rose-100/40"
            >
              <Heart className="text-rose-400 fill-rose-400" size={12} />
              <span className="text-rose-500 font-bold text-[13px] tabular-nums">
                {couple ? `${dDay}` : "D-Day"}
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
                    partnerProfile?.nickname || "상대방",
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
              <span className="text-[11px] text-gray-400 font-bold tracking-tight leading-none">
                {partnerProfile?.nickname || "상대방"}
              </span>
              {activeStatus && (
                <span
                  className={`text-[9px] font-bold mt-0.5 ${activeStatus === "접속중" ? "text-green-500" : "text-gray-300"}`}
                >
                  {activeStatus}
                </span>
              )}
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
    </header>
  );
};

export default HomeHeader;
