import React from "react";
import { Heart, UserPlus } from "lucide-react";

interface HomeHeaderProps {
  currentUserId: string | null;
  myProfile: any;
  partnerProfile: any;
  dDay: number | string;
  couple: any;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  currentUserId,
  myProfile,
  partnerProfile,
  dDay,
  couple,
}) => {
  const defaultAvatar = (id: string) =>
    `https://api.dicebear.com/7.x/lorelei/svg?seed=${id}`;

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
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border border-rose-100 overflow-hidden shadow-sm transition-transform hover:scale-105">
            <img
              src={
                myProfile?.avatar_url || defaultAvatar(currentUserId || "me")
              }
              alt="Me"
              className="w-full h-full object-cover opacity-90"
            />
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
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border border-gray-100 overflow-hidden shadow-sm transition-transform hover:scale-105 relative">
            {partnerProfile ? (
              <img
                src={
                  partnerProfile.avatar_url || defaultAvatar(partnerProfile.id)
                }
                alt="Partner"
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                <UserPlus size={20} />
              </div>
            )}

            {/* Online Indicator Dot if '접속중' */}
            {activeStatus === "접속중" && (
              <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
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
    </header>
  );
};

export default HomeHeader;
