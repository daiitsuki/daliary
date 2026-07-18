import { useState, useCallback, useEffect, useRef } from 'react';
import { useMultiplayerGame } from "../";
import { useCouple } from "../";

export type YachtCategory = 
  | 'aces' | 'deuces' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'choice' | 'fourOfAKind' | 'fullHouse' | 'smallStraight' | 'largeStraight' | 'yacht';

export type YachtScore = {
  [K in YachtCategory]?: number;
};

export interface YachtDiceState {
  player1_id: string; // 호스트
  player2_id: string; // 게스트
  player1_score: YachtScore;
  player2_score: YachtScore;
  dice: number[];
  kept: boolean[];
  rollsLeft: number;
  message?: string; // 주사위를 굴렸을 때 등의 상태 메시지
}

const INITIAL_DICE = [1, 1, 1, 1, 1];
const INITIAL_KEPT = [false, false, false, false, false];

export const YACHT_CATEGORIES: { id: YachtCategory; name: string; type: 'upper' | 'lower' }[] = [
  { id: 'aces', name: '에이스', type: 'upper' },
  { id: 'deuces', name: '듀얼', type: 'upper' },
  { id: 'threes', name: '트리플', type: 'upper' },
  { id: 'fours', name: '쿼드', type: 'upper' },
  { id: 'fives', name: '펜타', type: 'upper' },
  { id: 'sixes', name: '헥사', type: 'upper' },
  { id: 'choice', name: '초이스', type: 'lower' },
  { id: 'fourOfAKind', name: '포커', type: 'lower' },
  { id: 'fullHouse', name: '풀하우스', type: 'lower' },
  { id: 'smallStraight', name: '스몰스트레이트', type: 'lower' },
  { id: 'largeStraight', name: '라지 스트레이트', type: 'lower' },
  { id: 'yacht', name: '요트', type: 'lower' },
];

export const calculateCategoryScore = (dice: number[], category: YachtCategory): number => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dice.forEach(d => counts[d as keyof typeof counts]++);
  const sum = dice.reduce((a, b) => a + b, 0);

  switch (category) {
    case 'aces': return counts[1] * 1;
    case 'deuces': return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours': return counts[4] * 4;
    case 'fives': return counts[5] * 5;
    case 'sixes': return counts[6] * 6;
    case 'choice': return sum;
    case 'fourOfAKind':
      return Object.values(counts).some(c => c >= 4) ? sum : 0;
    case 'fullHouse':
      const has3 = Object.values(counts).includes(3);
      const has2 = Object.values(counts).includes(2);
      const has5 = Object.values(counts).includes(5);
      return (has3 && has2) || has5 ? sum : 0;
    case 'smallStraight':
      const uniqueSortedSmall = Array.from(new Set(dice)).sort((a, b) => a - b).join('');
      if (uniqueSortedSmall.includes('1234') || uniqueSortedSmall.includes('2345') || uniqueSortedSmall.includes('3456')) return 15;
      return 0;
    case 'largeStraight':
      const uniqueSortedLarge = Array.from(new Set(dice)).sort((a, b) => a - b).join('');
      if (uniqueSortedLarge === '12345' || uniqueSortedLarge === '23456') return 30;
      return 0;
    case 'yacht':
      return Object.values(counts).some(c => c === 5) ? 50 : 0;
    default:
      return 0;
  }
};

export const getUpperTotal = (score: YachtScore): number => {
  const upperKeys: YachtCategory[] = ['aces', 'deuces', 'threes', 'fours', 'fives', 'sixes'];
  return upperKeys.reduce((sum, key) => sum + (score[key] || 0), 0);
};

export const getTotalScore = (score: YachtScore): number => {
  const upperTotal = getUpperTotal(score);
  const bonus = upperTotal >= 63 ? 35 : 0;
  const lowerKeys: YachtCategory[] = ['choice', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yacht'];
  const lowerTotal = lowerKeys.reduce((sum, key) => sum + (score[key] || 0), 0);
  return upperTotal + bonus + lowerTotal;
};

export function useYachtDice() {
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
  } = useMultiplayerGame('yacht_dice');

  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticRollsLeft, setOptimisticRollsLeft] = useState<number | null>(null);
  const [optimisticKept, setOptimisticKept] = useState<boolean[] | null>(null);
  const [optimisticDice, setOptimisticDice] = useState<number[] | null>(null);
  
  const keepUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (keepUpdateTimeoutRef.current) clearTimeout(keepUpdateTimeoutRef.current);
    };
  }, []);

  const turnId = game?.current_turn_id;
  const stateRollsLeft = (game?.game_state as YachtDiceState)?.rollsLeft;

  useEffect(() => {
    setOptimisticRollsLeft(null);
    setOptimisticKept(null);
    setOptimisticDice(null);
  }, [turnId, stateRollsLeft]);

  const currentRollsLeft = optimisticRollsLeft !== null ? optimisticRollsLeft : (game?.game_state as YachtDiceState)?.rollsLeft;
  const currentKept = optimisticKept !== null ? optimisticKept : (game?.game_state as YachtDiceState)?.kept;
  const currentDice = optimisticDice !== null ? optimisticDice : (game?.game_state as YachtDiceState)?.dice;

  const invitePartner = (myName: string = '상대방') => {
    return sendInvitePush(
      '🎲 요트다이스 대결 초대',
      `${myName}이 요트다이스 대결을 요청했어요! 지금 바로 입장해보세요.`,
      '/games?game=yacht-dice'
    );
  };

  const startMatch = () => {
    if (!game || !game.host_id || !game.guest_id) return;
    
    // 호스트 선공
    const current_turn_id = game.host_id;

    return baseStart(game.id, {
      current_turn_id,
      game_state: {
        player1_id: game.host_id,
        player2_id: game.guest_id,
        player1_score: {},
        player2_score: {},
        dice: INITIAL_DICE,
        kept: INITIAL_KEPT,
        rollsLeft: 3,
        message: '게임을 시작합니다! 주사위를 굴려주세요.'
      }
    });
  };

  const rollDice = useCallback(async () => {
    if (!game || game.status !== 'playing' || !profile?.id) return;
    if (game.current_turn_id !== profile.id || isUpdating) return;
    
    const gameState = game.game_state as YachtDiceState;
    const effectiveRolls = optimisticRollsLeft !== null ? optimisticRollsLeft : gameState.rollsLeft;
    if (effectiveRolls <= 0) return;

    const currentKeptArr = optimisticKept !== null ? optimisticKept : gameState.kept;

    setIsUpdating(true);
    setOptimisticRollsLeft(effectiveRolls - 1);
    
    if (keepUpdateTimeoutRef.current) {
      clearTimeout(keepUpdateTimeoutRef.current);
      keepUpdateTimeoutRef.current = null;
    }

    try {
      const newDice = gameState.dice.map((d, i) => 
        currentKeptArr[i] ? d : Math.floor(Math.random() * 6) + 1
      );
      setOptimisticDice(newDice);

      await baseUpdate(game.id, {
        ...gameState,
        kept: currentKeptArr,
        dice: newDice,
        rollsLeft: effectiveRolls - 1,
        message: `주사위를 굴렸습니다. (남은 횟수: ${effectiveRolls - 1})`
      }, profile.id); // 턴 유지
    } catch {
      setOptimisticRollsLeft(null);
    } finally {
      setIsUpdating(false);
    }
  }, [game, profile, isUpdating, optimisticRollsLeft, optimisticKept, baseUpdate]);

  const toggleKeep = useCallback(async (index: number) => {
    if (!game || game.status !== 'playing' || !profile?.id) return;
    if (game.current_turn_id !== profile.id) return; // 빠른 터치를 위해 isUpdating 대기 해제
    
    const gameState = game.game_state as YachtDiceState;
    const effectiveRolls = optimisticRollsLeft !== null ? optimisticRollsLeft : gameState.rollsLeft;
    if (effectiveRolls === 3 || effectiveRolls === 0) return;

    const currentKeptArr = optimisticKept !== null ? optimisticKept : gameState.kept;
    const newKept = [...currentKeptArr];
    newKept[index] = !newKept[index];
    
    setOptimisticKept(newKept); // 즉각적인 UI 반영

    if (keepUpdateTimeoutRef.current) {
      clearTimeout(keepUpdateTimeoutRef.current);
    }

    keepUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        await baseUpdate(game.id, {
          ...(game.game_state as YachtDiceState),
          kept: newKept
        }, profile.id); // 턴 유지
      } catch {
        // 에러 시 무시 (다음 동기화 때 복구됨)
      }
    }, 400); // 400ms 디바운스 처리로 서버 부하 방지
  }, [game, profile, optimisticRollsLeft, optimisticKept, baseUpdate]);

  const recordScore = useCallback(async (category: YachtCategory, nextPlayerName: string = '상대방') => {
    if (!game || game.status !== 'playing' || !profile?.id) return;
    if (game.current_turn_id !== profile.id || isUpdating) return;
    
    const gameState = game.game_state as YachtDiceState;
    // 한 번도 안 굴린 상태에서는 점수 기록 불가능
    if (gameState.rollsLeft === 3) return;

    const isPlayer1 = profile.id === gameState.player1_id;
    const currentScoreObj = isPlayer1 ? gameState.player1_score : gameState.player2_score;
    
    // 이미 기록된 카테고리면 무시
    if (currentScoreObj[category] !== undefined) return;

    if (keepUpdateTimeoutRef.current) {
      clearTimeout(keepUpdateTimeoutRef.current);
      keepUpdateTimeoutRef.current = null;
    }

    setIsUpdating(true);
    try {
      const score = calculateCategoryScore(gameState.dice, category);
      
      const newScoreObj = { ...currentScoreObj, [category]: score };
      
      const nextGameState: YachtDiceState = {
        ...gameState,
        player1_score: isPlayer1 ? newScoreObj : gameState.player1_score,
        player2_score: !isPlayer1 ? newScoreObj : gameState.player2_score,
        dice: INITIAL_DICE,
        kept: INITIAL_KEPT,
        rollsLeft: 3,
        message: `${nextPlayerName}님의 턴입니다.`
      };

      const p1Len = Object.keys(nextGameState.player1_score).length;
      const p2Len = Object.keys(nextGameState.player2_score).length;

      // 게임 종료 체크 (각각 12개 항목 모두 채움)
      if (p1Len === 12 && p2Len === 12) {
        const p1Total = getTotalScore(nextGameState.player1_score);
        const p2Total = getTotalScore(nextGameState.player2_score);
        
        let winnerId = null;
        if (p1Total > p2Total) winnerId = nextGameState.player1_id;
        else if (p2Total > p1Total) winnerId = nextGameState.player2_id;

        nextGameState.message = '게임이 종료되었습니다!';
        await baseEnd(game.id, winnerId, nextGameState);
      } else {
        // 턴 넘기기
        const nextTurnId = profile.id === game.host_id ? game.guest_id : game.host_id;
        await baseUpdate(game.id, nextGameState, nextTurnId);
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
    currentRollsLeft,
    currentKept,
    currentDice,
    setReady,
    invitePartner,
    startMatch,
    rollDice,
    toggleKeep,
    recordScore,
    endGame: baseEnd,
    leaveGame: baseLeave,
    claimTimeoutVictory: baseClaimTimeoutVictory
  };
}
