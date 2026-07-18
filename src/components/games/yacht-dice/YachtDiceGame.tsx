import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Dices } from "lucide-react";
import { useYachtDice, YachtDiceState } from "../../../hooks";
import { useHomeData } from "../../../hooks";
import Button from "../../common/Button";
import { useConfirm } from "../../../context/ConfirmContext";
import { useGameReactions } from "../../../hooks/games/useGameReactions";
import ReactionLayer from "../common/ReactionLayer";
import ReactionPicker from "../common/ReactionPicker";
import MultiplayerLobby from "../common/MultiplayerLobby";
import MultiplayerStatusBar from "../common/MultiplayerStatusBar";
import MultiplayerResultModal from "../common/MultiplayerResultModal";

import YachtDiceScoreBoard from "./YachtDiceScoreBoard";
import YachtDiceBoard from "./YachtDiceBoard";

interface YachtDiceGameProps {
  onBack: () => void;
}

export default function YachtDiceGame({ onBack }: YachtDiceGameProps) {
  const {
    game,
    loading,
    isMyTurn,
    profileId,
    setReady,
    invitePartner,
    startMatch,
    rollDice,
    toggleKeep,
    recordScore,
    endGame,
    leaveGame,
    claimTimeoutVictory,
    currentKept,
    currentRollsLeft,
    currentDice,
  } = useYachtDice();

  const { partnerProfile, myProfile } = useHomeData();
  const partnerName = partnerProfile?.nickname ? `${partnerProfile.nickname}님` : "상대방";
  const myName = myProfile?.nickname ? `${myProfile.nickname}님` : "상대방";

  const partnerRawName = partnerProfile?.nickname || "상대방";
  const myRawName = myProfile?.nickname || "나";

  const { confirm } = useConfirm();
  const [showResultModal, setShowResultModal] = useState(false);
  const [localLobbyView, setLocalLobbyView] = useState(false);
  const [isVisualRolling, setIsVisualRolling] = useState(false);
  
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
      handleUnmountOrUnload();
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
      const winnerId = game.host_id === profileId ? game.guest_id : game.host_id;
      if (winnerId) await endGame(game.id, winnerId, game.game_state);
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
        const winnerId = game.host_id === profileId ? game.guest_id : game.host_id;
        if (winnerId) {
          endGame(game.id, winnerId, game.game_state).then(() => {
            onBack();
          });
        }
      }
      return;
    }

    if (game && game.status === "finished" && !localLobbyView) {
      setLocalLobbyView(true);
      return;
    }

    if (game && (game.status === 'waiting' || game.status === 'finished')) {
      leaveGame(game.id);
    }
    onBack();
  };

  const gameState = game?.game_state as YachtDiceState | undefined;

  const isPlayer1 = gameState?.player1_id === profileId;
  const myScore = isPlayer1 ? gameState?.player1_score : gameState?.player2_score;
  const partnerScore = isPlayer1 ? gameState?.player2_score : gameState?.player1_score;

  const myTheme = { bgClass: "bg-rose-500", borderClass: "border-rose-500", textClass: "text-rose-500" };
  const partnerTheme = { bgClass: "bg-amber-400", borderClass: "border-amber-400", textClass: "text-amber-500" };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFDFE] flex flex-col relative pb-0 overflow-hidden">
      {game?.status === "playing" && (
        <ReactionLayer reactions={reactions} myProfileId={profileId} splitSides={true} />
      )}
      
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 bg-[#FDFDFE]/90 backdrop-blur-md z-40">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black text-gray-800 tracking-tight">
          요트다이스
        </h1>
        <div className="w-10 h-10" />
      </header>

      <div className="flex-1 overflow-y-auto">
        {!game || game.status === "waiting" || localLobbyView ? (
          <MultiplayerLobby
            game={game}
            profileId={profileId}
            gameTitle="요트다이스 대기방"
            gameSubtitle="YACHT DICE"
            icon={<div className="w-10 h-10 bg-indigo-50 text-indigo-500 border border-indigo-100/50 rounded-[14px] flex items-center justify-center"><Dices size={18} /></div>}
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
            className="flex flex-col max-w-lg mx-auto w-full px-4 pt-4 gap-4"
          >
            {game.status === 'playing' && (
              <MultiplayerStatusBar
                status={game.status as "playing" | "finished" | "waiting"}
                isMyTurn={isMyTurn}
                myRawName={myRawName}
                partnerRawName={partnerRawName}
                myProfile={myProfile}
                partnerProfile={partnerProfile}
                myTheme={myTheme}
                partnerTheme={partnerTheme}
                lastUpdatedAt={game.updated_at}
                onClaimVictory={() => claimTimeoutVictory(game.id)}
              />
            )}

            {game.status === 'finished' && (
              <div className="bg-rose-50 text-rose-500 text-center py-4 rounded-[24px] border border-rose-100 shadow-sm font-black text-lg">
                게임 종료!
                {game.winner_id === profileId ? " 승리하셨습니다 🎉" : 
                 game.winner_id ? " 아쉽게 패배했습니다 🥲" : " 무승부입니다 🤝"}
              </div>
            )}

            {gameState && myScore && partnerScore && (
              <div className="flex flex-col gap-4">
                <YachtDiceScoreBoard
                  myScore={myScore}
                  partnerScore={partnerScore}
                  dice={currentDice ?? gameState.dice}
                  rollsLeft={currentRollsLeft ?? gameState.rollsLeft}
                  isMyTurn={isMyTurn && game.status === "playing"}
                  myName={myRawName}
                  partnerName={partnerRawName}
                  onRecordScore={(category) => recordScore(category, partnerRawName)}
                  isRolling={isVisualRolling}
                />
              </div>
            )}

            {game.status === "playing" && (
              <div className="flex flex-col gap-2 mt-0 mb-2">
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

      {game?.status === "playing" && gameState && (
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <div className="max-w-lg mx-auto w-full p-4 pt-4 pb-24 md:pb-20">
            <YachtDiceBoard
              dice={currentDice ?? gameState.dice}
              kept={currentKept ?? gameState.kept}
              rollsLeft={currentRollsLeft ?? gameState.rollsLeft}
              isMyTurn={isMyTurn}
              onRoll={rollDice}
              onToggleKeep={toggleKeep}
              partnerName={partnerRawName}
              onRollingStateChange={setIsVisualRolling}
            />
          </div>
        </div>
      )}

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
