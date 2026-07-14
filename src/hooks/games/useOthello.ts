import { useState, useCallback } from 'react';
import { useMultiplayerGame } from "./useMultiplayerGame";
import { useCouple } from "../";

// 1: Black, 2: White
export type OthelloPlayer = 1 | 2;
export type OthelloBoard = (OthelloPlayer | null)[][];

export interface OthelloState {
  board: OthelloBoard;
  black_player_id: string;
  white_player_id: string;
}

const ROWS = 8;
const COLS = 8;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export function useOthello() {
  const { profile } = useCouple();
  const {
    game,
    loading: baseLoading,
    setReady,
    startGame: baseStart,
    updateGameState: baseUpdate,
    endGame: baseEnd,
    leaveGame: baseLeave,
    sendInvitePush
  } = useMultiplayerGame('othello');

  const [isUpdating, setIsUpdating] = useState(false);

  const invitePartner = (myName: string = '상대방') => {
    return sendInvitePush(
      '🎮 오셀로 대결 초대',
      `${myName}이 오셀로 대결을 요청했어요! 지금 바로 입장해보세요.`,
      '/games?game=othello'
    );
  };

  const getInitialBoard = (): OthelloBoard => {
    const board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    board[3][3] = 2; // White
    board[3][4] = 1; // Black
    board[4][3] = 1; // Black
    board[4][4] = 2; // White
    return board;
  };

  const startMatch = () => {
    if (!game || !game.host_id || !game.guest_id) return;
    
    // 랜덤으로 선/후공 (Black/White) 배정 (50% 확률)
    const isHostBlack = Math.random() < 0.5;
    const blackId = isHostBlack ? game.host_id : game.guest_id;
    const whiteId = isHostBlack ? game.guest_id : game.host_id;
    
    // 검은색이 항상 선공
    const current_turn_id = blackId;

    return baseStart(game.id, {
      current_turn_id,
      game_state: {
        board: getInitialBoard(),
        black_player_id: blackId,
        white_player_id: whiteId
      }
    });
  };

  const getFlippableDiscs = (board: OthelloBoard, row: number, col: number, player: OthelloPlayer) => {
    if (board[row][col] !== null) return [];
    
    const opponent = player === 1 ? 2 : 1;
    const flippable: { r: number; c: number }[] = [];

    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      const currentDirFlippable: { r: number; c: number }[] = [];

      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === opponent) {
        currentDirFlippable.push({ r, c });
        r += dr;
        c += dc;
      }

      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        flippable.push(...currentDirFlippable);
      }
    }

    return flippable;
  };

  const getValidMoves = (board: OthelloBoard, player: OthelloPlayer) => {
    const validMoves: { r: number; c: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === null) {
          const flippable = getFlippableDiscs(board, r, c, player);
          if (flippable.length > 0) {
            validMoves.push({ r, c });
          }
        }
      }
    }
    return validMoves;
  };

  const countDiscs = (board: OthelloBoard) => {
    let black = 0;
    let white = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === 1) black++;
        else if (board[r][c] === 2) white++;
      }
    }
    return { black, white };
  };

  const placePiece = useCallback(async (row: number, col: number) => {
    if (!game || game.status !== 'playing' || !profile?.id) return;
    if (game.current_turn_id !== profile.id || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const gameState = game.game_state as OthelloState;
      const board = JSON.parse(JSON.stringify(gameState.board)) as OthelloBoard;
      
      const isBlack = gameState.black_player_id === profile.id;
      const playerToken: OthelloPlayer = isBlack ? 1 : 2;
      const opponentToken: OthelloPlayer = isBlack ? 2 : 1;

      const flippable = getFlippableDiscs(board, row, col, playerToken);
      
      if (flippable.length === 0) {
        setIsUpdating(false);
        return;
      }

      // 1. 돌 놓고 뒤집기
      board[row][col] = playerToken;
      flippable.forEach(({ r, c }) => {
        board[r][c] = playerToken;
      });

      // 2. 턴 및 종료 판정
      const opponentValidMoves = getValidMoves(board, opponentToken);
      const myValidMoves = getValidMoves(board, playerToken);
      
      const partnerId = profile.id === game.host_id ? game.guest_id : game.host_id;

      let nextTurnId: string | null = partnerId;
      let isGameOver = false;

      if (opponentValidMoves.length > 0) {
        // 상대가 둘 곳이 있으면 턴이 넘어감
        nextTurnId = partnerId;
      } else if (myValidMoves.length > 0) {
        // 상대는 둘 곳이 없지만 나는 둘 곳이 있으면 내 턴 유지 (상대 패스)
        nextTurnId = profile.id;
      } else {
        // 둘 다 둘 곳이 없으면 게임 종료
        isGameOver = true;
      }

      if (isGameOver) {
        const { black, white } = countDiscs(board);
        let winnerId: string | null = null;
        if (black > white) {
          winnerId = gameState.black_player_id;
        } else if (white > black) {
          winnerId = gameState.white_player_id;
        }
        await baseEnd(game.id, winnerId, { ...gameState, board });
      } else {
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
    setReady,
    invitePartner,
    startMatch,
    placePiece,
    getValidMoves,
    countDiscs,
    endGame: baseEnd,
    leaveGame: baseLeave
  };
}
