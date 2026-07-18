import { useState, useEffect } from "react";

interface ThemeColors {
  bgClass: string;
  borderClass: string;
  textClass: string;
}

interface MultiplayerStatusBarProps {
  status: "playing" | "finished" | "waiting";
  isMyTurn: boolean;
  myRawName: string;
  partnerRawName: string;
  myProfile: any;
  partnerProfile: any;
  myTheme: ThemeColors;
  partnerTheme: ThemeColors;
  lastUpdatedAt?: string;
  onClaimVictory?: () => void;
}

export default function MultiplayerStatusBar({
  status,
  isMyTurn,
  myRawName,
  partnerRawName,
  myProfile,
  partnerProfile,
  myTheme,
  partnerTheme,
  lastUpdatedAt,
  onClaimVictory,
}: MultiplayerStatusBarProps) {
  // Determine whose turn it is structurally
  // The background glow matches the current turn player's bgClass
  const turnBgClass = isMyTurn ? myTheme.bgClass : partnerTheme.bgClass;
  const turnTextClass = isMyTurn ? myTheme.textClass : partnerTheme.textClass;

  const [showTimeoutBtn, setShowTimeoutBtn] = useState(false);

  useEffect(() => {
    if (status !== "playing" || isMyTurn || !lastUpdatedAt) {
      setShowTimeoutBtn(false);
      return;
    }
    const checkTimeout = () => {
      const diff = Date.now() - new Date(lastUpdatedAt).getTime();
      setShowTimeoutBtn(diff > 3 * 60 * 1000);
    };
    checkTimeout();
    const interval = setInterval(checkTimeout, 10000);
    return () => clearInterval(interval);
  }, [status, isMyTurn, lastUpdatedAt]);

  return (
    <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Turn Background Glow */}
      <div
        className={`absolute inset-0 opacity-10 transition-colors duration-500 ${
          status === "playing" ? turnBgClass : "bg-transparent"
        }`}
      />

      {/* My Profile */}
      <div className="relative z-50">
        <div
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 z-10 ${
            isMyTurn && status === "playing" ? "scale-105 opacity-100" : "scale-95 opacity-50 grayscale-[50%]"
          }`}
        >
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full border-[3px] ${myTheme.borderClass} flex items-center justify-center overflow-hidden bg-gray-50 shadow-sm relative z-10`}
            >
              {myProfile?.avatar_url ? (
                <img src={myProfile.avatar_url} alt={myRawName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-gray-400">{myRawName.slice(0, 1)}</span>
              )}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${myTheme.bgClass} border-2 border-white shadow-sm z-20`}
            />
          </div>
          <span
            className={`text-[11px] font-black ${
              isMyTurn && status === "playing" ? "text-gray-800" : "text-gray-500"
            }`}
          >
            {myRawName}
          </span>
        </div>
      </div>

      {/* Turn Text Center */}
      <div className="flex flex-col items-center z-10">
        {status === "playing" ? (
          <>
            <span className={`text-[13px] font-black mb-1 ${turnTextClass}`}>
              {isMyTurn ? "내 차례입니다" : `${partnerRawName}님의 차례입니다`}
            </span>
            {showTimeoutBtn ? (
              <button 
                onClick={onClaimVictory} 
                className="mt-1 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow hover:bg-gray-700 transition"
              >
                상대방 응답없음 (승리선언)
              </button>
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${turnBgClass} animate-pulse`} />
                <div
                  className={`w-1.5 h-1.5 rounded-full ${turnBgClass} animate-pulse`}
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full ${turnBgClass} animate-pulse`}
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            )}
          </>
        ) : (
          <span className="text-[13px] font-black text-gray-800">게임 종료!</span>
        )}
      </div>

      {/* Partner Profile */}
      <div
        className={`flex flex-col items-center gap-1.5 transition-all duration-300 z-10 ${
          !isMyTurn && status === "playing" ? "scale-105 opacity-100" : "scale-95 opacity-50 grayscale-[50%]"
        }`}
      >
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full border-[3px] ${partnerTheme.borderClass} flex items-center justify-center overflow-hidden bg-gray-50 shadow-sm relative z-10`}
          >
            {partnerProfile?.avatar_url ? (
              <img src={partnerProfile.avatar_url} alt={partnerRawName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-gray-400">{partnerRawName.slice(0, 1)}</span>
            )}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${partnerTheme.bgClass} border-2 border-white shadow-sm z-20`}
          />
        </div>
        <span
          className={`text-[11px] font-black ${
            !isMyTurn && status === "playing" ? "text-gray-800" : "text-gray-500"
          }`}
        >
          {partnerRawName}
        </span>
      </div>
    </div>
  );
}
