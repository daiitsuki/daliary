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
  couple 
}) => {
  const defaultAvatar = (id: string) => `https://api.dicebear.com/7.x/lorelei/svg?seed=${id}`;

  return (
    <header className="px-6 pt-10 pb-6 flex flex-col items-center sticky top-0 bg-white/70 backdrop-blur-lg z-20">
      <div className="flex items-center justify-center space-x-10 mb-2">
        {/* My Profile */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border border-rose-100 overflow-hidden shadow-sm transition-transform hover:scale-105">
            <img
              src={myProfile?.avatar_url || defaultAvatar(currentUserId || 'me')}
              alt="Me"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
          <span className="text-[10px] mt-2.5 text-gray-400 font-bold tracking-[0.1em] uppercase">
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
                src={partnerProfile.avatar_url || defaultAvatar(partnerProfile.id)}
                alt="Partner"
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                <UserPlus size={20} />
              </div>
            )}
          </div>
          <span className="text-[10px] mt-2.5 text-gray-400 font-bold tracking-[0.1em] uppercase">
            {partnerProfile?.nickname || "상대방"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
