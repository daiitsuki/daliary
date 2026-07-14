import { Trophy, AlertCircle } from "lucide-react";
import BaseModal from "../../common/BaseModal";
import Button from "../../common/Button";

interface MultiplayerResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerId: string | null | undefined;
  myProfileId: string | undefined;
  onReturnToLobby: () => void;
  drawMessage?: string;
  winMessage?: string;
  loseMessage?: string;
}

export default function MultiplayerResultModal({
  isOpen,
  onClose,
  winnerId,
  myProfileId,
  onReturnToLobby,
  drawMessage = "치열한 접전 끝에 비겼습니다.",
  winMessage = "멋진 플레이였습니다!",
  loseMessage = "다음 판에는 꼭 이기시길 바라요!",
}: MultiplayerResultModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="게임 결과"
      icon={winnerId ? Trophy : AlertCircle}
    >
      <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
        {winnerId === null || winnerId === undefined ? (
          <>
            <div className="text-4xl">🤝</div>
            <h3 className="text-xl font-black text-gray-800">무승부!</h3>
            <p className="text-sm text-gray-500 font-bold">{drawMessage}</p>
          </>
        ) : winnerId === myProfileId ? (
          <>
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-black text-rose-500">승리하셨습니다!</h3>
            <p className="text-sm text-gray-500 font-bold">{winMessage}</p>
          </>
        ) : (
          <>
            <div className="text-4xl">🥲</div>
            <h3 className="text-xl font-black text-gray-800">아쉽게 졌습니다</h3>
            <p className="text-sm text-gray-500 font-bold">{loseMessage}</p>
          </>
        )}
        <div className="w-full mt-4">
          <Button onClick={onReturnToLobby} variant="primary" size="md">
            로비로 돌아가기
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
