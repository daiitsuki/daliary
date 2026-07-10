import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Bell } from "lucide-react";
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
  onInvite: () => void;
  onReady: (id: string, ready: boolean) => void;
  onStart: () => void;
}

export default function ConnectFourLobby({
  game,
  profileId,
  partnerName,
  myRawName,
  partnerRawName,
  myProfile,
  partnerProfile,
  onInvite,
  onReady,
  onStart,
}: ConnectFourLobbyProps) {
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const wrapAsync = (action: () => Promise<any> | any) => async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  };

  const isHost = game?.host_id === profileId;
  const myReady = isHost ? game?.host_ready : game?.guest_ready;
  const partnerReady = isHost ? game?.guest_ready : game?.host_ready;
  const bothReady = myReady && partnerReady;

  useEffect(() => {
    if (bothReady && countdown === null) {
      setCountdown(3);
    } else if (!bothReady && countdown !== null) {
      setCountdown(null);
    }
  }, [bothReady]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      if (isHost) {
        // 카운트다운이 끝나면 방장이 시작 호출
        onStart();
      } else {
        // 방장이 네트워크 문제나 강제 종료로 onStart를 못 불렀을 때를 대비한 방어 로직 (3초 대기)
        const timer = setTimeout(() => {
          if (game?.status !== 'playing') {
            // 강제로 내 준비를 취소하여 교착 상태 해제
            onReady(game!.id, false);
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [countdown, isHost, onStart, game, onReady]);

  const handleReady = wrapAsync(() => {
    if (game) return onReady(game.id, !myReady);
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

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mt-8 px-4"
    >
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
        </div>

        {/* VS Area */}
        <div className="bg-gray-50/50 rounded-[24px] border border-gray-100/50 p-5 flex items-center justify-between relative overflow-hidden">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-[11px] font-black text-gray-300 italic tracking-tighter">VS</span>
          </div>

          {/* My Profile */}
          <div className="flex flex-col items-center gap-2 w-1/3 z-10">
            <div className={`w-14 h-14 rounded-2xl border ${myReady ? 'border-amber-200' : 'border-gray-200'} flex items-center justify-center overflow-hidden bg-white shadow-sm transition-colors`}>
                {myProfile?.avatar_url ? (
                  <img src={myProfile.avatar_url} alt={myRawName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-gray-300">{myRawName.slice(0, 1)}</span>
                )}
            </div>
            <div className="flex flex-col items-center mt-0.5">
              <span className="text-[12px] font-black text-gray-800">{myRawName}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md mt-0.5 ${myReady ? 'text-amber-500 bg-amber-50' : 'text-gray-400 bg-gray-100'}`}>
                {myReady ? '준비완료' : '대기중'}
              </span>
            </div>
          </div>

          {/* Partner Profile */}
          <div className="flex flex-col items-center gap-2 w-1/3 z-10">
            <div className={`w-14 h-14 rounded-2xl border ${partnerReady ? 'border-amber-200' : 'border-gray-200'} flex items-center justify-center overflow-hidden bg-white shadow-sm transition-colors`}>
                {partnerProfile?.avatar_url ? (
                  <img src={partnerProfile.avatar_url} alt={partnerRawName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-gray-300">{partnerRawName.slice(0, 1)}</span>
                )}
            </div>
            <div className="flex flex-col items-center mt-0.5">
              <span className="text-[12px] font-black text-gray-800">{partnerRawName}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md mt-0.5 ${partnerReady ? 'text-amber-500 bg-amber-50' : 'text-gray-400 bg-gray-100'}`}>
                {partnerReady ? '준비완료' : '대기중'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center justify-center gap-2 pt-1 h-[80px]">
          <AnimatePresence mode="wait">
            {countdown !== null ? (
              <motion.div 
                key="countdown"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="text-2xl font-black text-rose-500">{countdown}</div>
                <div className="text-[11px] font-bold text-gray-500">곧 게임이 시작됩니다!</div>
              </motion.div>
            ) : (
              <motion.div 
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 w-full justify-center"
              >
                {!partnerReady && (
                  <Button fullWidth={false} onClick={handleInvite} disabled={isPending} variant="outline-primary" icon={<Bell size={14} />}>
                    호출하기
                  </Button>
                )}
                <Button 
                  fullWidth={false}
                  onClick={handleReady}
                  disabled={isPending}
                  variant={myReady ? "secondary" : "primary"}
                >
                  {myReady ? '준비 취소' : '준비 완료'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

