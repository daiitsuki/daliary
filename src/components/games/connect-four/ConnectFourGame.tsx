import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Users } from "lucide-react";
import {
  useConnectFour,
  ConnectFourState,
} from "../../../hooks";
import { useHomeData } from "../../../hooks";
import ConnectFourBoard from "./ConnectFourBoard";
import Button from "../../common/Button";
import { useConfirm } from "../../../context/ConfirmContext";
import { useGameReactions } from "../../../hooks/games/useGameReactions";
import ReactionLayer from "../common/ReactionLayer";
import ReactionPicker from "../common/ReactionPicker";
import MultiplayerLobby from "../common/MultiplayerLobby";
import MultiplayerStatusBar from "../common/MultiplayerStatusBar";
import MultiplayerResultModal from "../common/MultiplayerResultModal";

interface ConnectFourGameProps {
  onBack: () => void;
}

export default function ConnectFourGame({ onBack }: ConnectFourGameProps) {
  const {
    game,
    loading,
    isMyTurn,
    profileId,
    setReady,
    invitePartner,
    startMatch,
    dropPiece,
    endGame,
    leaveGame,
  } = useConnectFour();

  const { partnerProfile, myProfile } = useHomeData();
  const partnerName = partnerProfile?.nickname
    ? `${partnerProfile.nickname}님`
    : "상대방";
  const myName = myProfile?.nickname ? `${myProfile.nickname}님` : "상대방";

  const partnerRawName = partnerProfile?.nickname || "상대방";
  const myRawName = myProfile?.nickname || "나";

  const { confirm } = useConfirm();
  const [showResultModal, setShowResultModal] = useState(false);
  const [localLobbyView, setLocalLobbyView] = useState(false);
  
  const { reactions, sendReaction } = useGameReactions(game?.id);
  
  const previousStatusRef = useRef<string | undefined>(undefined);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (game && isInitialMount.current) {
      isInitialMount.current = false;
      if (game.status === "finished") {
        setLocalLobbyView(true);
      }
    }
  }, [game]);

  useEffect(() => {
    if (previousStatusRef.current === "playing" && game?.status === "finished") {
      setShowResultModal(true);
    }
    previousStatusRef.current = game?.status;
  }, [game?.status]);

  const tokenRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Get token for keepalive fetch
    import('../../../lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then((response) => {
        tokenRef.current = response.data.session?.access_token || null;
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        tokenRef.current = session?.access_token || null;
      });
      return () => subscription.unsubscribe();
    });
  }, []);

  const stateRef = useRef({ game, profileId, setReady });
  useEffect(() => {
    stateRef.current = { game, profileId, setReady };
  }, [game, profileId, setReady]);

  useEffect(() => {
    const handleUnmountOrUnload = () => {
      const { game, profileId, setReady } = stateRef.current;
      if (game && profileId) {
        const isHost = game.host_id === profileId;
        const myReady = isHost ? game.host_ready : game.guest_ready;
        if (myReady && game.status !== 'playing') {
          // 브라우저 종료 시에도 요청이 전달되도록 keepalive fetch 사용
          if (tokenRef.current) {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/multiplayer_games?id=eq.${game.id}`;
            fetch(url, {
              method: 'PATCH',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${tokenRef.current}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(isHost ? { host_ready: false } : { guest_ready: false }),
              keepalive: true
            }).catch(() => {});
          } else {
            setReady(game.id, false).catch(() => {});
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleUnmountOrUnload);
    window.addEventListener('pagehide', handleUnmountOrUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnmountOrUnload);
      window.removeEventListener('pagehide', handleUnmountOrUnload);
      handleUnmountOrUnload(); // 컴포넌트 언마운트 시(뒤로가기 등)에도 실행
    };
  }, []);

  useEffect(() => {
    if (game?.status === "playing") {
      setLocalLobbyView(false);
    }
  }, [game?.status]);

  const handleCloseResult = () => {
    setShowResultModal(false);
  };

  const handleReturnToLobby = () => {
    setLocalLobbyView(true);
    setShowResultModal(false);
  };

  const handleSurrender = async () => {
    if (!game || game.status !== "playing") return;

    const isConfirmed = await confirm({
      title: "기권하기",
      message: "정말 기권하시겠습니까?\n기권 시 패배로 기록됩니다.",
      confirmText: "기권",
      isDanger: true,
    });

    if (isConfirmed) {
      const winnerId =
        game.host_id === profileId ? game.guest_id : game.host_id;
      if (winnerId) await endGame(game.id, winnerId);
    }
  };

  const handleBack = async () => {
    if (game && game.status === "playing") {
      const isConfirmed = await confirm({
        title: "탈주 경고",
        message: "게임이 진행 중입니다.\n게임을 유기하면 기권 처리됩니다.",
        confirmText: "나가기",
        isDanger: true,
      });

      if (isConfirmed) {
        const winnerId =
          game.host_id === profileId ? game.guest_id : game.host_id;
        if (winnerId) {
          endGame(game.id, winnerId).then(() => {
            onBack();
          });
        }
      }
      return;
    }

    // 게임이 끝난 상태에서 보드판을 보고 있다면, 게임을 아예 나가는 대신 로비로 이동
    if (game && game.status === "finished" && !localLobbyView) {
      setLocalLobbyView(true);
      return;
    }

    if (game && (game.status === 'waiting' || game.status === 'finished')) {
      leaveGame(game.id);
    }
    onBack();
  };

  const gameState = game?.game_state as ConnectFourState | undefined;

  // 현재 내 색상 파악
  const isRed = gameState?.red_player_id === profileId;
  const myTheme = isRed
    ? { bgClass: "bg-rose-500", borderClass: "border-rose-500", textClass: "text-rose-500" }
    : { bgClass: "bg-amber-400", borderClass: "border-amber-400", textClass: "text-amber-500" };
  const partnerTheme = !isRed
    ? { bgClass: "bg-rose-500", borderClass: "border-rose-500", textClass: "text-rose-500" }
    : { bgClass: "bg-amber-400", borderClass: "border-amber-400", textClass: "text-amber-500" };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFDFE] flex flex-col relative pb-10 overflow-hidden">
      {/* Reactions Overlay */}
      {game?.status === "playing" && (
        <ReactionLayer reactions={reactions} myProfileId={profileId} splitSides={true} />
      )}
      
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 bg-[#FDFDFE]/90 backdrop-blur-md z-40">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black text-gray-800 tracking-tight">
          Connect Four
        </h1>
        <div className="w-10 h-10" /> {/* 여백 맞춤용 */}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!game || game.status === "waiting" || localLobbyView ? (
          <MultiplayerLobby
            game={game}
            profileId={profileId}
            gameTitle="사목 대기방"
            gameSubtitle="CONNECT FOUR"
            icon={<div className="w-10 h-10 bg-blue-50 text-blue-500 border border-blue-100/50 rounded-[14px] flex items-center justify-center"><Users size={18} /></div>}
            partnerName={partnerName}
            myRawName={myRawName}
            partnerRawName={partnerRawName}
            myProfile={myProfile}
            partnerProfile={partnerProfile}
            onInvite={() => invitePartner(myName)}
            onReady={setReady}
            onStart={startMatch}
            readyColorClass="text-amber-500"
            readyBgClass="bg-amber-50"
            readyBorderClass="border-amber-200"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col max-w-lg mx-auto w-full px-4 pt-6 gap-8"
          >
            <MultiplayerStatusBar
              status={game.status as "playing" | "finished" | "waiting"}
              isMyTurn={isMyTurn}
              myRawName={myRawName}
              partnerRawName={partnerRawName}
              myProfile={myProfile}
              partnerProfile={partnerProfile}
              myTheme={myTheme}
              partnerTheme={partnerTheme}
            />

            {/* Board */}
            {gameState && (
              <ConnectFourBoard
                board={gameState?.board || Array(6).fill(Array(7).fill(null))}
                isMyTurn={isMyTurn && game.status === "playing"}
                onColumnClick={dropPiece}
              />
            )}

            {/* Surrender Button & Reaction Picker */}
            {game.status === "playing" && (
              <div className="flex flex-col gap-4 mt-2">
                <ReactionPicker onSelect={sendReaction} inline />
                <Button
                  onClick={handleSurrender}
                  variant="danger-ghost"
                  size="sm"
                >
                  기권하기
                </Button>
              </div>
            )}

            {/* Return to Lobby Button */}
            {game.status === "finished" && (
              <Button
                onClick={handleReturnToLobby}
                variant="primary"
                size="md"
                className="mt-2"
              >
                로비로 돌아가기
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <MultiplayerResultModal
        isOpen={showResultModal}
        onClose={handleCloseResult}
        winnerId={game?.winner_id}
        myProfileId={profileId}
        onReturnToLobby={handleReturnToLobby}
      />
    </div>
  );
}
