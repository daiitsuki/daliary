import React, { useState } from "react";
import { Heart, UserPlus, User } from "lucide-react";
import ImageViewerModal from "../common/ImageViewerModal";

interface HomeHeaderProps {
  myProfile: any;
  partnerProfile: any;
  dDay: number | string;
  couple: any;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  myProfile,
  partnerProfile,
  dDay,
  couple,
}) => {
  const [viewerState, setViewerState] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: ""
  });

  const openViewer = (url: string | null, title: string) => {
    if (!url) return;
    setViewerState({ isOpen: true, url, title });
  };

  const closeViewer = () => {
    setViewerState(prev => ({ ...prev, isOpen: false }));
  };

  const getLastActiveLabel = (dateString?: string) => {
    if (!dateString) return null;
    const lastActive = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - lastActive.getTime()) / 1000,
    );

    if (diffInSeconds < 300) return "접속중"; // Less than 5 minutes
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}일 전`; // Up to 7 days
    return "오래전";
  };

  const activeStatus = getLastActiveLabel(partnerProfile?.last_active_at);

  return (
    <header className="px-6 pt-10 pb-6 flex flex-col items-center sticky top-0 bg-white/70 backdrop-blur-lg z-20">
      <div className="flex items-center justify-center space-x-10 mb-2">
        {/* My Profile */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => openViewer(myProfile?.avatar_url, myProfile?.nickname || "나")}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border border-rose-100 overflow-hidden shadow-sm transition-transform active:scale-95 flex items-center justify-center ${myProfile?.avatar_url ? 'cursor-pointer hover:scale-105' : ''}`}
          >
            {myProfile?.avatar_url ? (
              <img
                src={myProfile.avatar_url}
                alt="Me"
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <User size={24} className="text-gray-300" />
            )}
          </div>
          <span className="text-[11px] mt-2.5 text-gray-400 font-bold tracking-[0.1em] uppercase">
            {myProfile?.nickname || "나"}
          </span>
        </div>

        {/* Heart & D-Day */}
        <div className="flex flex-col items-center px-2">
          <Heart className="text-rose-300 fill-rose-300/20 mb-1" size={24} />
          <span className="text-rose-500 font-black text-lg md:text-xl tracking-tighter">
            {couple ? `D+${dDay}` : "D-Day"}
          </span>
        </div>

        {/* Partner Profile */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => openViewer(partnerProfile?.avatar_url, partnerProfile?.nickname || "상대방")}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border border-gray-100 overflow-hidden shadow-sm transition-transform active:scale-95 relative flex items-center justify-center ${partnerProfile?.avatar_url ? 'cursor-pointer hover:scale-105' : ''}`}
          >
            {partnerProfile?.avatar_url ? (
              <img
                src={partnerProfile.avatar_url}
                alt="Partner"
                className="w-full h-full object-cover opacity-90"
              />
            ) : !partnerProfile ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                <UserPlus size={20} />
              </div>
            ) : (
              <User size={24} className="text-gray-300" />
            )}
          </div>
          <div className="flex flex-col items-center mt-2.5">
            <span className="text-[11px] text-gray-400 font-bold tracking-[0.1em] uppercase leading-none">
              {partnerProfile?.nickname || "상대방"}
            </span>
            {activeStatus && (
              <div
                className={`flex items-center gap-1 mt-1 ${activeStatus === "접속중" ? "text-green-500" : "text-gray-400"}`}
              >
                {activeStatus === "접속중" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
                <span className="text-[10px] font-medium leading-none">
                  {activeStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageViewerModal
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
        imageUrl={viewerState.url}
        title={viewerState.title}
      />
    </header>
  );
};

export default HomeHeader;
