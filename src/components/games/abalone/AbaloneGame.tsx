import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Hexagon, Flag, Info } from "lucide-react";
import { useAbalone, AbaloneState } from "../../../hooks/games/useAbalone";
import { useHomeData } from "../../../hooks";
import AbaloneBoard from "./AbaloneBoard";
import Button from "../../common/Button";
import { useConfirm } from "../../../context/ConfirmContext";
import { useGameReactions } from "../../../hooks/games/useGameReactions";
import ReactionLayer from "../common/ReactionLayer";
import ReactionPicker from "../common/ReactionPicker";
import MultiplayerLobby from "../common/MultiplayerLobby";
import MultiplayerStatusBar from "../common/MultiplayerStatusBar";
import MultiplayerResultModal from "../common/MultiplayerResultModal";

interface AbaloneGameProps {
  onBack: () => void;
}

export default function AbaloneGame({ onBack }: AbaloneGameProps) {
  const {
    game,
    loading,
    isMyTurn,
    profileId,
    setReady,
    invitePartner,
    startMatch,
    moveMarbles,
    getValidMoves,
    endGame,
    leaveGame,
    claimTimeoutVictory,
    lastMoveDir,
  } = useAbalone();

  const { partnerProfile, myProfile } = useHomeData();
  const partnerName = partnerProfile?.nickname
    ? `${partnerProfile.nickname}님`
    : "상대방";
  const myName = myProfile?.nickname ? `${myProfile.nickname}님` : "나";
  const partnerRawName = partnerProfile?.nickname || "상대방";
  const myRawName = myProfile?.nickname || "나";

  const { confirm } = useConfirm();
  const [showResultModal, setShowResultModal] = useState(false);
  const [localLobbyView, setLocalLobbyView] = useState(false);

  const [selectedTail, setSelectedTail] = useState<{
    q: number;
    r: number;
  } | null>(null);

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
      setSelectedTail(null);
    }
  }, [game?.status, game?.current_turn_id]);

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

  const gameState = game?.game_state as AbaloneState | undefined;
  const isBlack = gameState?.black_player_id === profileId;
  const playerToken = isBlack ? 1 : 2;

  const handleSquareClick = (q: number, r: number) => {
    if (!isMyTurn || game?.status !== "playing" || !gameState) return;

    if (gameState.board[`${q},${r}`] === playerToken) {
      if (selectedTail?.q === q && selectedTail?.r === r) {
        setSelectedTail(null);
      } else {
        setSelectedTail({ q, r });
      }
    } else {
      setSelectedTail(null);
    }
  };

  const handleMoveClick = (dirIndex: number) => {
    if (selectedTail) {
      moveMarbles(selectedTail.q, selectedTail.r, dirIndex);
      setSelectedTail(null);
    }
  };

  const myTheme = isBlack
    ? {
        bgClass: "bg-rose-400",
        borderClass: "border-rose-400",
        textClass: "text-rose-500",
      }
    : {
        bgClass: "bg-sky-400",
        borderClass: "border-sky-400",
        textClass: "text-sky-500",
      };
  const partnerTheme = !isBlack
    ? {
        bgClass: "bg-rose-400",
        borderClass: "border-rose-400",
        textClass: "text-rose-500",
      }
    : {
        bgClass: "bg-sky-400",
        borderClass: "border-sky-400",
        textClass: "text-sky-500",
      };

  const validMoves =
    selectedTail && isMyTurn && gameState
      ? getValidMoves(
          gameState.board,
          selectedTail.q,
          selectedTail.r,
          playerToken,
        )
      : [];

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
          Abalone
        </h1>
        <div className="h-10 w-10" />
      </header>

      <div className="flex-1 overflow-y-auto">
        {!game || game.status === "waiting" || localLobbyView ? (
          <MultiplayerLobby
            game={game}
            profileId={profileId}
            gameTitle="아발론 대기방"
            gameSubtitle="ABALONE"
            icon={
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100/50 bg-purple-50 text-purple-500">
                <Hexagon
                  size={24}
                  fill="currentColor"
                  className="text-purple-400"
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
            readyColorClass="text-purple-500"
            readyBgClass="bg-purple-50"
            readyBorderClass="border-purple-200"
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
              <div className="flex items-center justify-between px-2">
                {/* 왼쪽 점수 (내 점수 - 내가 밀어낸 상대방 구슬 수) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-3.5 w-3.5 rounded-full transition-all duration-300 ${
                          i <
                          (isBlack
                            ? gameState?.white_lost || 0
                            : gameState?.black_lost || 0)
                            ? isBlack
                              ? "bg-sky-400 shadow-sm"
                              : "bg-rose-400 shadow-sm"
                            : "bg-gray-100 shadow-inner"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex h-full flex-col items-center justify-end pt-4">
                  <div className="text-[10px] font-bold text-gray-400">
                    턴: {Math.floor((gameState?.turn_count || 0) / 2) + 1} / 100
                  </div>
                </div>

                {/* 오른쪽 점수 (상대 점수 - 상대가 밀어낸 내 구슬 수) */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex flex-row-reverse items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-3.5 w-3.5 rounded-full transition-all duration-300 ${
                          i <
                          (!isBlack
                            ? gameState?.white_lost || 0
                            : gameState?.black_lost || 0)
                            ? !isBlack
                              ? "bg-sky-400 shadow-sm"
                              : "bg-rose-400 shadow-sm"
                            : "bg-gray-100 shadow-inner"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {gameState?.board && (
              <AbaloneBoard
                board={gameState.board}
                isMyTurn={isMyTurn && game.status === "playing"}
                playerToken={playerToken}
                validMoves={validMoves}
                selectedTail={selectedTail}
                lastMoveDir={lastMoveDir}
                onSquareClick={handleSquareClick}
                onMoveClick={handleMoveClick}
              />
            )}

            {game.status === "playing" && (
              <>
                <div className="mt-4 flex items-center justify-center gap-2.5">
                  <ReactionPicker onSelect={sendReaction} inline />
                  <div className="mx-1 h-10 w-px bg-gray-200 sm:h-5" />
                  <button
                    onClick={handleSurrender}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-gray-100 bg-white text-rose-500 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md active:scale-95"
                    title="기권하기"
                  >
                    <Flag size={20} />
                  </button>
                </div>

                <div className="mt-8 px-2 pb-16">
                  <div className="rounded-2xl border border-gray-100/50 bg-[#F8F9FA] p-4 text-sm text-gray-600 shadow-inner">
                    <h3 className="mb-2.5 flex items-center gap-1.5 font-bold text-gray-700">
                      <Info size={16} className="text-gray-500" />
                      아발론 게임 규칙
                    </h3>
                    <ul className="list-inside list-disc space-y-2 text-xs leading-relaxed text-gray-500">
                      <li>
                        상대의 구슬 <strong>3개</strong>를 보드 밖으로 먼저
                        밀어내면 승리합니다.
                      </li>
                      <li>
                        이동시킬 그룹의 <strong>맨 끝 구슬(꼬리)</strong>을 먼저
                        터치한 후, 화살표를 누르면 해당 방향으로{" "}
                        <strong>일렬 이동</strong>합니다. (평행 이동 불가)
                      </li>
                      <li>
                        상대 구슬과 부딪혔을 때,{" "}
                        <strong>내 구슬 수가 더 많아야만</strong> 상대방을
                        밀어낼 수 있습니다. (예: 2 vs 1, 3 vs 2)
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {game.status === "finished" && (
              <div className="mt-4">
                <Button
                  onClick={handleReturnToLobby}
                  variant="primary"
                  size="md"
                >
                  로비로 돌아가기
                </Button>
              </div>
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
        winMessage="완벽한 전략! 승리하셨습니다."
        loseMessage="아쉬워요. 다음 판은 꼭 이겨주세요!"
      />
    </div>
  );
}
