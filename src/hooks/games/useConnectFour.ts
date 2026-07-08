import { useState, useCallback } from 'react';
import { useMultiplayerGame } from "../";
import { useCouple } from "../";

// 1: Red, 2: Yellow
export type ConnectFourPlayer = 1 | 2;
export type ConnectFourBoard = (ConnectFourPlayer | null)[][]; 

export interface ConnectFourState {
  board: ConnectFourBoard;
  red_player_id: string;
  yellow_player_id: string;
}

const ROWS = 6;
const COLS = 7;

export function useConnectFour() {
  const { profile } = useCouple();
  const {
    game,
    loading: baseLoading,
    createGame: baseCreate,
    joinGame,
    setReady,
    startGame: baseStart,
    updateGameState: baseUpdate,
    endGame: baseEnd,
    leaveGame: baseLeave,
    sendInvitePush
  } = useMultiplayerGame('connect_four');

  const [isUpdating, setIsUpdating] = useState(false);

  const createRoom = () => {
    return baseCreate({
      board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
      red_player_id: '',
      yellow_player_id: ''
    });
  };

  const invitePartner = (myName: string = '상대방') => {
    return sendInvitePush(
      '🎮 사목 대결 초대',
      `${myName}이 사목 대결을 요청했어요! 지금 바로 입장해보세요.`,
      '/games?game=connect-four'
    );
  };

  const startMatch = () => {
    if (!game || !game.host_id || !game.guest_id) return;
    
    // 랜덤으로 선/후공 (Red/Yellow) 배정 (50% 확률)
    const isHostRed = Math.random() < 0.5;
    const redId = isHostRed ? game.host_id : game.guest_id;
    const yellowId = isHostRed ? game.guest_id : game.host_id;
    
    // 빨간색이 항상 선공이 되도록 설정
    const current_turn_id = redId;

    return baseStart(game.id, {
      current_turn_id,
      game_state: {
        board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
        red_player_id: redId,
        yellow_player_id: yellowId
      }
    });
  };

  const checkWin = (board: ConnectFourBoard, row: number, col: number, player: ConnectFourPlayer) => {
    // 가로, 세로, 2개의 대각선 방향
    const directions = [
      [[0, 1], [0, -1]], // 가로
      [[1, 0], [-1, 0]], // 세로
      [[1, 1], [-1, -1]], // 대각선 ↘
      [[1, -1], [-1, 1]]  // 대각선 ↗
    ];
    
    for (const dir of directions) {
      let count = 1;
      for (const [dr, dc] of dir) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          count++;
          r += dr;
          c += dc;
        }
      }
      if (count >= 4) return true; // 4개 이상 연결 시 승리
    }
    return false;
  };

  const checkDraw = (board: ConnectFourBoard) => {
    // 맨 윗줄이 꽉 찼는지 확인 (비겼을 때)
    return board[0].every(cell => cell !== null);
  };

  const dropPiece = useCallback(async (colIndex: number) => {
    if (!game || game.status !== 'playing' || !profile?.id) return;
    if (game.current_turn_id !== profile.id || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const gameState = game.game_state as ConnectFourState;
      // 깊은 복사로 보드 상태 복제
      const board = JSON.parse(JSON.stringify(gameState.board)) as ConnectFourBoard;
      
      const isRed = gameState.red_player_id === profile.id;
      const playerToken: ConnectFourPlayer = isRed ? 1 : 2;

      // 해당 열(Column)에서 빈 칸 중 가장 아래(Row) 인덱스 찾기
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][colIndex] === null) {
          targetRow = r;
          break;
        }
      }

      if (targetRow === -1) {
        setIsUpdating(false); // 열이 꽉 찬 경우 무시
        return;
      }

      board[targetRow][colIndex] = playerToken;

      const isWin = checkWin(board, targetRow, colIndex, playerToken);
      const isDraw = !isWin && checkDraw(board);

      if (isWin) {
        // 승리: 한 번의 DB 쿼리로 게임 종료와 보드 업데이트를 동시에 처리 (Atomic Transaction)
        await baseEnd(game.id, profile.id, { ...gameState, board });
      } else if (isDraw) {
        // 무승부: 한 번의 DB 쿼리로 무승부 종료 처리
        await baseEnd(game.id, null, { ...gameState, board });
      } else {
        // 턴 넘기기
        const nextTurnId = profile.id === game.host_id ? game.guest_id : game.host_id;
        await baseUpdate(game.id, { ...gameState, board }, nextTurnId);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [game, profile, isUpdating, baseUpdate, baseEnd]);

  return {
    game,
    loading: baseLoading,
    isMyTurn: game?.current_turn_id === profile?.id,
    profileId: profile?.id,
    createRoom,
    joinGame,
    setReady,
    invitePartner,
    startMatch,
    dropPiece,
    endGame: baseEnd,
    leaveGame: baseLeave
  };
}
