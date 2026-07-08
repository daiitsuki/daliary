import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Bell, Play, CheckCircle2, X } from "lucide-react";
import Button from "../../common/Button";
import { MultiplayerGame } from "../../../types";
import { useToast } from "../../../context/ToastContext";

interface ConnectFourLobbyProps {
  game: MultiplayerGame | null;
  profileId: string | undefined;
  partnerName: string;
  myRawName: string;
  partnerRawName: string;
  myProfile: any;
  partnerProfile: any;
  onCreateRoom: () => void;
  onJoinRoom: (id: string) => void;
  onInvite: () => void;
  onReady: (id: string, ready: boolean) => void;
  onStart: () => void;
  onLeave: (id: string) => void;
}

export default function ConnectFourLobby({
  game,
  profileId,
  partnerName,
  myRawName,
  partnerRawName,
  myProfile,
  partnerProfile,
  onCreateRoom,
  onJoinRoom,
  onInvite,
  onReady,
  onStart,
  onLeave,
}: ConnectFourLobbyProps) {
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const wrapAsync = (action: () => Promise<any> | any) => async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  };

  const handleCreateRoom = wrapAsync(onCreateRoom);
  const handleJoinRoom = wrapAsync(() => {
    if (game) return onJoinRoom(game.id);
  });
  const handleReady = wrapAsync(() => {
    if (game) return onReady(game.id, !game.guest_ready);
  });
  const handleStart = wrapAsync(onStart);
  const handleLeave = wrapAsync(() => {
    if (game) return onLeave(game.id);
  });

  const handleInvite = () => {
    const lastInviteTime = localStorage.getItem("last_connect_four_invite");
    const now = Date.now();

    if (lastInviteTime && now - parseInt(lastInviteTime, 10) < 60000) {
      const remainingSeconds = Math.ceil(
        (60000 - (now - parseInt(lastInviteTime, 10))) / 1000,
      );
      showToast(
        `초대 알림은 ${remainingSeconds}초 후에 다시 보낼 수 있습니다.`,
        "error",
      );
      return;
    }

    onInvite();
    localStorage.setItem("last_connect_four_invite", now.toString());
    showToast(`${partnerName}에게 게임 초대 알림을 보냈습니다!`, "success");
  };

  const renderLobbyContent = () => {
    if (!game) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border border-blue-50/50 shadow-[0_10px_40px_rgba(0,0,0,0.03)] gap-4 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 border border-blue-100/50 rounded-2xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-[14px] font-black text-gray-800 mb-0.5">사목 (Connect Four)</h3>
            <p className="text-[11px] text-gray-400 font-bold">커플과 함께 실시간으로 사목 게임을 즐겨보세요!</p>
          </div>
          <div className="mt-2 flex justify-center">
            <Button fullWidth={false} onClick={handleCreateRoom} disabled={isPending} variant="primary" icon={<Play size={16} />}>
              방 만들기
            </Button>
          </div>
        </div>
      );
    }

    const isHost = game.host_id === profileId;
    const isGuest = game.guest_id === profileId;
    const isGuestHere = !!game.guest_id;

    if (!isHost && !isGuest) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border border-rose-50/50 shadow-[0_10px_40px_rgba(0,0,0,0.03)] gap-4 text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 border border-rose-100/50 rounded-2xl flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-[14px] font-black text-gray-800 mb-0.5">초대받은 게임이 있습니다!</h3>
            <p className="text-[11px] text-gray-400 font-bold">{partnerRawName}님이 대결을 기다리고 있어요.</p>
          </div>
          <div className="mt-2 flex justify-center">
            <Button fullWidth={false} onClick={handleJoinRoom} disabled={isPending} variant="primary" icon={<CheckCircle2 size={16} />}>
              입장하기
            </Button>
          </div>
        </div>
      );
    }

    const hostProfile = isHost ? myProfile : partnerProfile;
    const guestProfile = isHost ? partnerProfile : myProfile;
    const hostName = isHost ? myRawName : partnerRawName;
    const guestName = isHost ? partnerRawName : myRawName;

    return (
      <div className="flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-5 gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 border border-blue-100/50 rounded-[14px] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-gray-800">사목 대기방</h3>
              <p className="text-[10px] font-bold text-gray-400 tracking-wide">CONNECT FOUR</p>
            </div>
          </div>
          <button 
            onClick={handleLeave}
            disabled={isPending}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* VS Area */}
        <div className="bg-gray-50/50 rounded-[24px] border border-gray-100/50 p-5 flex items-center justify-between relative">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-[11px] font-black text-gray-300 italic tracking-tighter">VS</span>
          </div>

          {/* Host */}
          <div className="flex flex-col items-center gap-2 w-1/3 z-10">
            <div className="w-14 h-14 rounded-2xl border border-rose-200 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                {hostProfile?.avatar_url ? (
                  <img src={hostProfile.avatar_url} alt={hostName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-gray-300">{hostName.slice(0, 1)}</span>
                )}
            </div>
            <div className="flex flex-col items-center mt-0.5">
              <span className="text-[12px] font-black text-gray-800">{hostName}</span>
              <span className="text-[9px] font-black text-rose-400 bg-rose-50 px-2 py-0.5 rounded-md mt-0.5">방장</span>
            </div>
          </div>

          {/* Guest */}
          <div className="flex flex-col items-center gap-2 w-1/3 z-10">
            {isGuestHere ? (
              <>
                <div className={`w-14 h-14 rounded-2xl border ${game.guest_ready ? 'border-amber-200' : 'border-gray-200'} flex items-center justify-center overflow-hidden bg-white shadow-sm transition-colors`}>
                    {guestProfile?.avatar_url ? (
                      <img src={guestProfile.avatar_url} alt={guestName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-gray-300">{guestName.slice(0, 1)}</span>
                    )}
                </div>
                <div className="flex flex-col items-center mt-0.5">
                  <span className="text-[12px] font-black text-gray-800">{guestName}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md mt-0.5 ${game.guest_ready ? 'text-amber-500 bg-amber-50' : 'text-gray-400 bg-gray-100'}`}>
                    {game.guest_ready ? '준비완료' : '대기중'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                  <Users size={16} className="text-gray-300" />
                </div>
                <div className="flex flex-col items-center mt-0.5">
                  <span className="text-[12px] font-black text-gray-800">{guestName}</span>
                  <span className="text-[9px] font-black text-gray-400 px-2 py-0.5 rounded-md mt-0.5">대기중</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {isHost ? (
            <>
              {!isGuestHere && (
                <Button fullWidth={false} onClick={handleInvite} disabled={isPending} variant="outline-primary" icon={<Bell size={14} />}>
                  호출하기
                </Button>
              )}
              <Button 
                fullWidth={false}
                onClick={handleStart} 
                disabled={!game.guest_ready || isPending}
                variant="primary" 
                icon={<Play size={14} fill="currentColor" />}
              >
                {game.guest_ready ? '게임 시작' : `${partnerRawName}님을 기다리는 중...`}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <Button 
                fullWidth={false}
                onClick={handleReady}
                disabled={isPending}
                variant={game.guest_ready ? "secondary" : "primary"}
              >
                {game.guest_ready ? '준비 취소' : '준비 완료'}
              </Button>
              {game.guest_ready && (
                <p className="text-[10px] text-center text-gray-400 font-bold mt-1">
                  {partnerRawName}님이 게임을 시작하기를 기다리고 있습니다.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mt-8 px-4"
    >
      {renderLobbyContent()}
    </motion.div>
  );
}
