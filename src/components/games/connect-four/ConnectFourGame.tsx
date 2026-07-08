import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Trophy, AlertCircle } from "lucide-react";
import {
  useConnectFour,
  ConnectFourState,
} from "../../../hooks";
import { useHomeData } from "../../../hooks";
import ConnectFourLobby from "./ConnectFourLobby";
import ConnectFourBoard from "./ConnectFourBoard";
import BaseModal from "../../common/BaseModal";
import Button from "../../common/Button";
import { useConfirm } from "../../../context/ConfirmContext";

interface ConnectFourGameProps {
  onBack: () => void;
}

export default function ConnectFourGame({ onBack }: ConnectFourGameProps) {
  const {
    game,
    loading,
    isMyTurn,
    profileId,
    createRoom,
    joinGame,
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

  useEffect(() => {
    if (game?.status === "finished") {
      setShowResultModal(true);
    } else {
      setShowResultModal(false);
    }
  }, [game?.status]);

  const handleCloseResult = () => {
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

    if (game && (game.status === 'waiting' || game.status === 'finished')) {
      leaveGame(game.id);
    }
    onBack();
  };

  const gameState = game?.game_state as ConnectFourState | undefined;

  // 현재 내 색상 파악
  const isRed = gameState?.red_player_id === profileId;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFDFE] flex flex-col relative pb-10">
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
        {!game || game.status === "waiting" ? (
          <ConnectFourLobby
            game={game}
            profileId={profileId}
            partnerName={partnerName}
            myRawName={myRawName}
            partnerRawName={partnerRawName}
            myProfile={myProfile}
            partnerProfile={partnerProfile}
            onCreateRoom={createRoom}
            onJoinRoom={joinGame}
            onInvite={() => invitePartner(myName)}
            onReady={setReady}
            onStart={startMatch}
            onLeave={leaveGame}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col max-w-lg mx-auto w-full px-4 pt-6 gap-8"
          >
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              {/* Turn Background Glow */}
              <div
                className={`absolute inset-0 opacity-10 transition-colors duration-500 ${
                  game.status === "playing"
                    ? isMyTurn
                      ? isRed
                        ? "bg-rose-500"
                        : "bg-amber-400"
                      : !isRed
                        ? "bg-rose-500"
                        : "bg-amber-400"
                    : "bg-transparent"
                }`}
              />

              {/* My Profile */}
              <div
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 z-10 ${isMyTurn && game.status === "playing" ? "scale-105 opacity-100" : "scale-95 opacity-50 grayscale-[50%]"}`}
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full border-[3px] ${isRed ? "border-rose-500" : "border-amber-400"} flex items-center justify-center overflow-hidden bg-gray-50 shadow-sm relative z-10`}
                  >
                    {myProfile?.avatar_url ? (
                      <img
                        src={myProfile.avatar_url}
                        alt={myRawName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black text-gray-400">
                        {myRawName.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${isRed ? "bg-rose-500" : "bg-amber-400"} border-2 border-white shadow-sm z-20`}
                  />
                </div>
                <span
                  className={`text-[11px] font-black ${isMyTurn && game.status === "playing" ? "text-gray-800" : "text-gray-500"}`}
                >
                  {myRawName}
                </span>
              </div>

              {/* Turn Text Center */}
              <div className="flex flex-col items-center z-10">
                {game.status === "playing" ? (
                  <>
                    <span
                      className={`text-[13px] font-black mb-1 ${isMyTurn ? (isRed ? "text-rose-500" : "text-amber-500") : !isRed ? "text-rose-500" : "text-amber-500"}`}
                    >
                      {isMyTurn
                        ? "내 차례입니다"
                        : `${partnerRawName}님의 차례입니다`}
                    </span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? (isRed ? "bg-rose-500" : "bg-amber-400") : !isRed ? "bg-rose-500" : "bg-amber-400"} animate-pulse`}
                      />
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? (isRed ? "bg-rose-500" : "bg-amber-400") : !isRed ? "bg-rose-500" : "bg-amber-400"} animate-pulse`}
                        style={{ animationDelay: "200ms" }}
                      />
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? (isRed ? "bg-rose-500" : "bg-amber-400") : !isRed ? "bg-rose-500" : "bg-amber-400"} animate-pulse`}
                        style={{ animationDelay: "400ms" }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-[13px] font-black text-gray-800">
                    게임 종료!
                  </span>
                )}
              </div>

              {/* Partner Profile */}
              <div
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 z-10 ${!isMyTurn && game.status === "playing" ? "scale-105 opacity-100" : "scale-95 opacity-50 grayscale-[50%]"}`}
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full border-[3px] ${!isRed ? "border-rose-500" : "border-amber-400"} flex items-center justify-center overflow-hidden bg-gray-50 shadow-sm relative z-10`}
                  >
                    {partnerProfile?.avatar_url ? (
                      <img
                        src={partnerProfile.avatar_url}
                        alt={partnerRawName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black text-gray-400">
                        {partnerRawName.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${!isRed ? "bg-rose-500" : "bg-amber-400"} border-2 border-white shadow-sm z-20`}
                  />
                </div>
                <span
                  className={`text-[11px] font-black ${!isMyTurn && game.status === "playing" ? "text-gray-800" : "text-gray-500"}`}
                >
                  {partnerRawName}
                </span>
              </div>
            </div>

            {/* Board */}
            {gameState && (
              <ConnectFourBoard
                board={gameState?.board || Array(6).fill(Array(7).fill(null))}
                isMyTurn={isMyTurn && game.status === "playing"}
                onColumnClick={dropPiece}
              />
            )}

            {/* Surrender Button */}
            {game.status === "playing" && (
              <Button
                onClick={handleSurrender}
                variant="danger-ghost"
                size="sm"
                className="mt-2"
              >
                기권하기
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Result Modal */}
      <BaseModal
        isOpen={showResultModal}
        onClose={handleCloseResult}
        title="게임 결과"
        icon={game?.winner_id ? Trophy : AlertCircle}
      >
        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
          {game?.winner_id === null ? (
            <>
              <div className="text-4xl">🤝</div>
              <h3 className="text-xl font-black text-gray-800">무승부!</h3>
              <p className="text-sm text-gray-500 font-bold">
                치열한 접전 끝에 비겼습니다.
              </p>
            </>
          ) : game?.winner_id === profileId ? (
            <>
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-black text-rose-500">
                승리하셨습니다!
              </h3>
              <p className="text-sm text-gray-500 font-bold">
                멋진 플레이였습니다!
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl">🥲</div>
              <h3 className="text-xl font-black text-gray-800">
                아쉽게 졌습니다
              </h3>
              <p className="text-sm text-gray-500 font-bold">
                다음 판에는 꼭 이기시길 바라요!
              </p>
            </>
          )}
          <div className="w-full mt-4">
            <Button onClick={handleCloseResult} variant="primary" size="md">
              돌아가기
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
