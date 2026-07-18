import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Circle, Eye, EyeOff, Bot } from "lucide-react";
import { useOthello, OthelloState } from "../../../hooks/games/useOthello";
import { useHomeData } from "../../../hooks";
import OthelloBoard from "./OthelloBoard";
import Button from "../../common/Button";
import { useConfirm } from "../../../context/ConfirmContext";
import { useGameReactions } from "../../../hooks/games/useGameReactions";
import ReactionLayer from "../common/ReactionLayer";
import ReactionPicker from "../common/ReactionPicker";
import MultiplayerLobby from "../common/MultiplayerLobby";
import MultiplayerStatusBar from "../common/MultiplayerStatusBar";
import MultiplayerResultModal from "../common/MultiplayerResultModal";

const BOARD_WEIGHTS = [
  [120, -20,  20,   5,   5,  20, -20, 120],
  [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
  [ 20,  -5,  15,   3,   3,  15,  -5,  20],
  [  5,  -5,   3,   3,   3,   3,  -5,   5],
  [  5,  -5,   3,   3,   3,   3,  -5,   5],
  [ 20,  -5,  15,   3,   3,  15,  -5,  20],
  [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
  [120, -20,  20,   5,   5,  20, -20, 120]
];

const getAutoMove = (validMoves: {r: number, c: number}[]) => {
  if (validMoves.length === 0) return null;
  return validMoves.reduce((best, move) => {
    return BOARD_WEIGHTS[move.r][move.c] > BOARD_WEIGHTS[best.r][best.c] ? move : best;
  }, validMoves[0]);
};

interface OthelloGameProps {
  onBack: () => void;
}

export default function OthelloGame({ onBack }: OthelloGameProps) {
  const {
    game,
    loading,
    isMyTurn,
    profileId,
    setReady,
    invitePartner,
    startMatch,
    placePiece,
    getValidMoves,
    countDiscs,
    endGame,
    leaveGame,
    claimTimeoutVictory,
  } = useOthello();

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

  // Guide Toggle State
  const [showGuide, setShowGuide] = useState(() => {
    const saved = localStorage.getItem("othello_guide_enabled");
    return saved !== null ? saved === "true" : true;
  });

  // Auto Mode State
  const [isAutoMode, setIsAutoMode] = useState(() => {
    const saved = localStorage.getItem("othello_auto_mode");
    return saved !== null ? saved === "true" : false;
  });

  useEffect(() => {
    localStorage.setItem("othello_auto_mode", isAutoMode.toString());
  }, [isAutoMode]);

  const { reactions, sendReaction } = useGameReactions(game?.id);
  const previousStatusRef = useRef<string | undefined>(undefined);
  const isInitialMount = useRef(true);

  useEffect(() => {
    localStorage.setItem("othello_guide_enabled", showGuide.toString());
  }, [showGuide]);

  useEffect(() => {
    if (game && isInitialMount.current) {
      isInitialMount.current = false;
      if (game.status === "finished") {
        setLocalLobbyView(true);
      }
    }
  }, [game]);

  useEffect(() => {
    if (
      previousStatusRef.current === "playing" &&
      game?.status === "finished"
    ) {
      setShowResultModal(true);
    }
    previousStatusRef.current = game?.status;
  }, [game?.status]);

  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    import("../../../lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then((response) => {
        tokenRef.current = response.data.session?.access_token || null;
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
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
        if (myReady && game.status !== "playing") {
          if (tokenRef.current) {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/multiplayer_games?id=eq.${game.id}`;
            fetch(url, {
              method: "PATCH",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${tokenRef.current}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify(
                isHost ? { host_ready: false } : { guest_ready: false },
              ),
              keepalive: true,
            }).catch(() => {});
          } else {
            setReady(game.id, false).catch(() => {});
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleUnmountOrUnload);
    window.addEventListener("pagehide", handleUnmountOrUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnmountOrUnload);
      window.removeEventListener("pagehide", handleUnmountOrUnload);
      handleUnmountOrUnload();
    };
  }, []);

  useEffect(() => {
    if (game?.status === "playing") {
      setLocalLobbyView(false);
    }
  }, [game?.status]);

  const handleCloseResult = () => setShowResultModal(false);
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
          endGame(game.id, winnerId).then(() => onBack());
        }
      }
      return;
    }

    if (game && game.status === "finished" && !localLobbyView) {
      setLocalLobbyView(true);
      return;
    }

    if (game && (game.status === "waiting" || game.status === "finished")) {
      leaveGame(game.id);
    }
    onBack();
  };

  const gameState = game?.game_state as OthelloState | undefined;
  const isBlack = gameState?.black_player_id === profileId;

  // Auto Move Effect
  useEffect(() => {
    if (game?.status === "playing" && isMyTurn && isAutoMode && gameState?.board) {
      const currentValidMoves = getValidMoves(gameState.board, isBlack ? 1 : 2);
      if (currentValidMoves.length > 0) {
        const move = getAutoMove(currentValidMoves);
        if (move) {
          const timer = setTimeout(() => {
            placePiece(move.r, move.c);
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status, isMyTurn, isAutoMode, gameState?.board, isBlack, placePiece]);

  const myTheme = isBlack
    ? {
        bgClass: "bg-sky-400",
        borderClass: "border-sky-400",
        textClass: "text-sky-500",
      }
    : {
        bgClass: "bg-rose-400",
        borderClass: "border-rose-400",
        textClass: "text-rose-500",
      };
  const partnerTheme = !isBlack
    ? {
        bgClass: "bg-sky-400",
        borderClass: "border-sky-400",
        textClass: "text-sky-500",
      }
    : {
        bgClass: "bg-rose-400",
        borderClass: "border-rose-400",
        textClass: "text-rose-500",
      };

  const validMoves =
    gameState?.board && isMyTurn
      ? getValidMoves(gameState.board, isBlack ? 1 : 2)
      : [];
  const currentDiscs = gameState?.board
    ? countDiscs(gameState.board)
    : { black: 2, white: 2 };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#FDFDFE] pb-10">
      {game?.status === "playing" && (
        <ReactionLayer
          reactions={reactions}
          myProfileId={profileId}
          splitSides={true}
        />
      )}

      <header className="sticky top-0 z-40 flex items-center justify-between bg-[#FDFDFE]/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black tracking-tight text-gray-800">
          Othello
        </h1>
        <div className="h-10 w-10" />
      </header>

      <div className="flex-1 overflow-y-auto">
        {!game || game.status === "waiting" || localLobbyView ? (
          <MultiplayerLobby
            game={game}
            profileId={profileId}
            gameTitle="오셀로 대기방"
            gameSubtitle="OTHELLO"
            icon={
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] border border-sky-100/50 bg-sky-50 text-sky-500">
                <Circle
                  size={18}
                  fill="currentColor"
                  className="absolute -mt-2 -ml-2 text-sky-400"
                />
                <Circle
                  size={18}
                  fill="currentColor"
                  className="absolute mt-2 ml-2 text-rose-400"
                />
              </div>
            }
            partnerName={partnerName}
            myRawName={myRawName}
            partnerRawName={partnerRawName}
            myProfile={myProfile}
            partnerProfile={partnerProfile}
            onInvite={() => invitePartner(myName)}
            onReady={setReady}
            onStart={startMatch}
            readyColorClass="text-sky-500"
            readyBgClass="bg-sky-50"
            readyBorderClass="border-sky-200"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-6"
          >
            {/* Status & Scores */}
            <div className="flex flex-col gap-3">
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
              <div className="flex items-center justify-between px-1">
                {/* 왼쪽 점수 (내 점수) */}
                <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-black shadow-sm ${
                  isBlack ? "border-sky-100 bg-sky-50 text-sky-700" : "border-rose-100 bg-rose-50 text-rose-700"
                }`}>
                  <div className={`h-3 w-3 rounded-full shadow-sm ${isBlack ? "bg-sky-400" : "bg-rose-400"}`} />
                  <span>{isBlack ? currentDiscs.black : currentDiscs.white}</span>
                </div>

                {/* 가운데 컨트롤 버튼들 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutoMode(!isAutoMode)}
                    className={`group relative flex items-center justify-center rounded-full overflow-hidden p-[1px] shadow-sm transition-colors ${
                      isAutoMode ? "bg-transparent" : "bg-gray-100"
                    }`}
                  >
                    {isAutoMode && (
                      <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(#10b981_0%,transparent_50%)]" />
                    )}
                    <div
                      className={`relative z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                        isAutoMode
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-white text-gray-400 group-hover:text-gray-700"
                      }`}
                    >
                      <Bot size={14} />
                      <span>자동</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className={`group relative flex items-center justify-center rounded-full overflow-hidden p-[1px] shadow-sm transition-colors ${
                      showGuide ? "bg-emerald-300" : "bg-gray-100"
                    }`}
                  >
                    <div
                      className={`relative z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                        showGuide
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-white text-gray-400 group-hover:text-gray-700"
                      }`}
                    >
                      {showGuide ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>힌트</span>
                    </div>
                  </button>
                </div>

                {/* 오른쪽 점수 (상대 점수) */}
                <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-black shadow-sm ${
                  !isBlack ? "border-sky-100 bg-sky-50 text-sky-700" : "border-rose-100 bg-rose-50 text-rose-700"
                }`}>
                  <span>{!isBlack ? currentDiscs.black : currentDiscs.white}</span>
                  <div className={`h-3 w-3 rounded-full shadow-sm ${!isBlack ? "bg-sky-400" : "bg-rose-400"}`} />
                </div>
              </div>
            </div>

            {gameState?.board && (
              <OthelloBoard
                board={gameState.board}
                isMyTurn={isMyTurn && game.status === "playing"}
                validMoves={validMoves}
                showGuide={showGuide}
                onSquareClick={isAutoMode ? () => {} : placePiece}
              />
            )}

            {game.status === "playing" && (
              <div className="flex flex-col gap-4">
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
              <Button onClick={handleReturnToLobby} variant="primary" size="md">
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
        winMessage="완벽한 전략! 오셀로 마스터입니다."
        loseMessage="아쉬워요. 다음 판은 꼭 이겨주세요!"
      />
    </div>
  );
}
