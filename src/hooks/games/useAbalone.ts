import { useState, useCallback, useEffect } from 'react';
import { useMultiplayerGame } from "./useMultiplayerGame";
import { useCouple } from "../";

export type PlayerToken = 1 | 2; // 1: Black, 2: White

export interface AbaloneState {
  board: Record<string, PlayerToken>;
  black_lost: number;
  white_lost: number;
  black_player_id: string;
  white_player_id: string;
  turn_count: number;
}

export interface HexCoord {
  q: number;
  r: number;
}

export const DIRECTIONS = [
  { q: 1, r: 0 },   // 0: Right
  { q: 0, r: 1 },   // 1: Bottom Right
  { q: -1, r: 1 },  // 2: Bottom Left
  { q: -1, r: 0 },  // 3: Left
  { q: 0, r: -1 },  // 4: Top Left
  { q: 1, r: -1 }   // 5: Top Right
];

const MAX_TURNS = 200; // 100 turns per player (1 turn = 1 black + 1 white move)

export function useAbalone() {
  const { profile } = useCouple();
  const {
    game,
    loading: baseLoading,
    setReady,
    startGame: baseStart,
    updateGameState: baseUpdate,
    endGame: baseEnd,
    leaveGame: baseLeave,
    claimTimeoutVictory: baseClaimTimeoutVictory,
    sendInvitePush
  } = useMultiplayerGame('abalone');

  const [isUpdating, setIsUpdating] = useState(false);

  const invitePartner = (myName: string = '상대방') => {
    return sendInvitePush(
      '🎮 아발론 대결 초대',
      `${myName}이 아발론 대결을 요청했어요! 지금 바로 입장해보세요.`,
      '/games?game=abalone'
    );
  };

  const getInitialBoard = (): Record<string, PlayerToken> => {
    const board: Record<string, PlayerToken> = {};
    
    // Standard setup (radius = 4)
    // Black (Player 1) is at the bottom: r = 2, 3, 4
    for (let q = -4; q <= 0; q++) board[`${q},4`] = 1;
    for (let q = -4; q <= 1; q++) board[`${q},3`] = 1;
    for (let q = -2; q <= 0; q++) board[`${q},2`] = 1;

    // White (Player 2) is at the top: r = -4, -3, -2
    for (let q = 0; q <= 4; q++) board[`${q},-4`] = 2;
    for (let q = -1; q <= 4; q++) board[`${q},-3`] = 2;
    for (let q = 0; q <= 2; q++) board[`${q},-2`] = 2;

    return board;
  };

  const startMatch = () => {
    if (!game || !game.host_id || !game.guest_id) return;
    
    const isHostBlack = Math.random() < 0.5;
    const blackId = isHostBlack ? game.host_id : game.guest_id;
    const whiteId = isHostBlack ? game.guest_id : game.host_id;
    
    const current_turn_id = blackId;

    return baseStart(game.id, {
      current_turn_id,
      game_state: {
        board: getInitialBoard(),
        black_lost: 0,
        white_lost: 0,
        black_player_id: blackId,
        white_player_id: whiteId,
        turn_count: 0
      }
    });
  };

  const [optimisticGame, setOptimisticGame] = useState(game);
  const [lastMoveDir, setLastMoveDir] = useState<{ q: number, r: number } | null>(null);

  // Sync with server game when it updates
  useEffect(() => {
    setOptimisticGame(game);
  }, [game]);

  const activeGame = optimisticGame || game;

  const isOutOfBounds = (q: number, r: number) => {
    return Math.abs(q) > 4 || Math.abs(r) > 4 || Math.abs(q + r) > 4;
  };

  const getValidMoves = (board: Record<string, PlayerToken>, tailQ: number, tailR: number, player: PlayerToken) => {
    const validMoves: { dirIndex: number }[] = [];
    if (board[`${tailQ},${tailR}`] !== player) return validMoves;

    for (let i = 0; i < DIRECTIONS.length; i++) {
      const dir = DIRECTIONS[i];
      let myMarbles = 0;
      let opponentMarbles = 0;
      let currQ = tailQ;
      let currR = tailR;

      while (!isOutOfBounds(currQ, currR) && board[`${currQ},${currR}`] === player && myMarbles < 3) {
        myMarbles++;
        currQ += dir.q;
        currR += dir.r;
      }

      if (!isOutOfBounds(currQ, currR) && board[`${currQ},${currR}`] === player) {
        continue;
      }

      while (!isOutOfBounds(currQ, currR) && board[`${currQ},${currR}`] && board[`${currQ},${currR}`] !== player) {
        opponentMarbles++;
        currQ += dir.q;
        currR += dir.r;
      }

      if (opponentMarbles >= myMarbles) {
        continue;
      }

      if (!isOutOfBounds(currQ, currR) && board[`${currQ},${currR}`] === player) {
        continue;
      }
      
      // Prevent suicide: if no opponent marbles, we cannot move into out of bounds
      if (opponentMarbles === 0 && isOutOfBounds(currQ, currR)) {
        continue;
      }

      validMoves.push({ dirIndex: i });
    }

    return validMoves;
  };

  const moveMarbles = useCallback(async (tailQ: number, tailR: number, dirIndex: number) => {
    if (!activeGame || activeGame.status !== 'playing' || !profile?.id) return;
    if (activeGame.current_turn_id !== profile.id || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const gameState = activeGame.game_state as AbaloneState;
      const board = { ...gameState.board };
      
      const isBlack = gameState.black_player_id === profile.id;
      const playerToken: PlayerToken = isBlack ? 1 : 2;

      const validMoves = getValidMoves(board, tailQ, tailR, playerToken);
      if (!validMoves.some(m => m.dirIndex === dirIndex)) {
        setIsUpdating(false);
        return;
      }

      const dir = DIRECTIONS[dirIndex];
      let myMarbles = 0;
      let opponentMarbles = 0;
      let currQ = tailQ;
      let currR = tailR;

      while (!isOutOfBounds(currQ, currR) && board[`${currQ},${currR}`] === playerToken && myMarbles < 3) {
        myMarbles++;
        currQ += dir.q;
        currR += dir.r;
      }

      const firstOpponentQ = currQ;
      const firstOpponentR = currR;

      while (!isOutOfBounds(currQ, currR) && board[`${currQ},${currR}`] && board[`${currQ},${currR}`] !== playerToken) {
        opponentMarbles++;
        currQ += dir.q;
        currR += dir.r;
      }

      const destinationQ = currQ;
      const destinationR = currR;
      let pushedOff = false;

      if (opponentMarbles > 0) {
        if (isOutOfBounds(destinationQ, destinationR)) {
          pushedOff = true;
          for (let i = opponentMarbles - 1; i > 0; i--) {
            const fromQ = firstOpponentQ + dir.q * (i - 1);
            const fromR = firstOpponentR + dir.r * (i - 1);
            const toQ = firstOpponentQ + dir.q * i;
            const toR = firstOpponentR + dir.r * i;
            board[`${toQ},${toR}`] = board[`${fromQ},${fromR}`];
          }
        } else {
          for (let i = opponentMarbles; i > 0; i--) {
            const fromQ = firstOpponentQ + dir.q * (i - 1);
            const fromR = firstOpponentR + dir.r * (i - 1);
            const toQ = firstOpponentQ + dir.q * i;
            const toR = firstOpponentR + dir.r * i;
            board[`${toQ},${toR}`] = board[`${fromQ},${fromR}`];
          }
        }
      }

      for (let i = myMarbles - 1; i >= 0; i--) {
        const fromQ = tailQ + dir.q * i;
        const fromR = tailR + dir.r * i;
        const toQ = tailQ + dir.q * (i + 1);
        const toR = tailR + dir.r * (i + 1);
        board[`${toQ},${toR}`] = board[`${fromQ},${fromR}`];
      }
      
      delete board[`${tailQ},${tailR}`];

      let newBlackLost = gameState.black_lost;
      let newWhiteLost = gameState.white_lost;

      if (pushedOff) {
        if (playerToken === 1) newWhiteLost++;
        else newBlackLost++;
      }

      const newTurnCount = (gameState.turn_count || 0) + 1;
      const partnerId = profile.id === activeGame.host_id ? activeGame.guest_id : activeGame.host_id;

      let isGameOver = false;
      let winnerId: string | null = null;

      if (newWhiteLost >= 3) {
        isGameOver = true;
        winnerId = gameState.black_player_id;
      } else if (newBlackLost >= 3) {
        isGameOver = true;
        winnerId = gameState.white_player_id;
      } else if (newTurnCount >= MAX_TURNS) {
        isGameOver = true;
        winnerId = null; 
      }

      const nextGameState = {
        ...gameState,
        board,
        black_lost: newBlackLost,
        white_lost: newWhiteLost,
        turn_count: newTurnCount
      };

      // 낙관적 UI 적용 (네트워크 요청 전 로컬 상태 즉시 변경)
      setOptimisticGame({
        ...activeGame,
        current_turn_id: isGameOver ? null : partnerId,
        status: isGameOver ? 'finished' : 'playing',
        winner_id: winnerId,
        game_state: nextGameState
      });
      setLastMoveDir(dir);

      if (isGameOver) {
        await baseEnd(activeGame.id, winnerId, nextGameState);
      } else {
        await baseUpdate(activeGame.id, nextGameState, partnerId);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [activeGame, profile, isUpdating, baseUpdate, baseEnd]);

  return {
    game: activeGame,
    loading: baseLoading,
    isMyTurn: activeGame?.current_turn_id === profile?.id,
    profileId: profile?.id,
    lastMoveDir,
    setReady,
    invitePartner,
    startMatch,
    moveMarbles,
    getValidMoves,
    endGame: baseEnd,
    leaveGame: baseLeave,
    claimTimeoutVictory: baseClaimTimeoutVictory,
    isOutOfBounds
  };
}
