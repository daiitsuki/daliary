import { useState, useEffect, useCallback } from 'react';
import { supabase } from "../../lib/supabase";
import { useCouple } from "../";
import { MultiplayerGame } from "../../types";

export function useMultiplayerGame(gameType: string) {
  const { couple, profile } = useCouple();
  const [game, setGame] = useState<MultiplayerGame | null>(null);
  const [loading, setLoading] = useState(true);

  // 현재 활성화된(진행 중이거나 대기 중인) 게임을 가져옵니다.
  const fetchActiveGame = useCallback(async (showLoader = false) => {
    if (!couple?.id) return;
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from('multiplayer_games')
      .select('*')
      .eq('couple_id', couple.id)
      .eq('game_type', gameType)
      .neq('status', 'finished')
      .maybeSingle(); // Partial Unique Index 덕분에 최대 1개만 존재함

    if (data) {
      setGame(data as MultiplayerGame);
    } else {
      setGame(null);
    }
    setLoading(false); // fetch가 끝나면 무조건 로딩 해제
  }, [couple?.id, gameType]);

  useEffect(() => {
    fetchActiveGame(true); // 초기 마운트 시에만 로더 표시

    // 백그라운드 탭에서 돌아왔을 때 상태 강제 동기화 (네트워크 끊김 복구)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchActiveGame(false); // 백그라운드 리패치는 로더 생략
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchActiveGame]);

  // Supabase Realtime 구독
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase.channel(`game_${gameType}_${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'multiplayer_games',
          filter: `couple_id=eq.${couple.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
             setGame(prev => {
               if (prev && prev.status === 'finished') return prev;
               return null;
             });
          } else {
             const newData = payload.new as MultiplayerGame;
             if (newData.game_type === gameType) {
               // finished 상태일지라도 모달을 띄워야 하므로 업데이트 해줌. (모달 닫을 때 DELETE 호출)
               setGame(newData);
             }
          }
        }
      )
      .subscribe((status) => {
        // 웹소켓이 재연결되었을 때 상태 불일치를 막기 위해 DB에서 최신 데이터 다시 fetch
        if (status === 'SUBSCRIBED') {
          fetchActiveGame(false); // 로더 생략
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, gameType, fetchActiveGame]);

  const createGame = async (initialState: any = {}) => {
    if (!couple?.id || !profile?.id) return null;
    if (game) return game;

    const { data, error } = await supabase
      .from('multiplayer_games')
      .insert({
        couple_id: couple.id,
        game_type: gameType,
        host_id: profile.id,
        game_state: initialState,
        status: 'waiting'
      })
      .select()
      .maybeSingle();

    if (error) {
      // 동시 생성 등의 이유로 충돌이 발생한 경우 (Unique Constraint 위배)
      console.warn("방 생성 충돌 감지. 이미 방이 존재할 수 있습니다.", error);
      fetchActiveGame(false); // 상대방이 만든 방을 불러옴
      return null;
    }

    if (data) setGame(data as MultiplayerGame);
    return data;
  };

  const joinGame = async (gameId: string) => {
    if (!profile?.id) return;
    await supabase
      .from('multiplayer_games')
      .update({ guest_id: profile.id })
      .eq('id', gameId)
      .is('guest_id', null);
  };

  const setReady = async (gameId: string, ready: boolean) => {
    if (!profile?.id) return;
    const isHost = game?.host_id === profile.id;
    await supabase
      .from('multiplayer_games')
      .update(isHost ? { host_ready: ready } : { guest_ready: ready })
      .eq('id', gameId);
  };

  const startGame = async (gameId: string, updatePayload: Partial<MultiplayerGame>) => {
    await supabase
      .from('multiplayer_games')
      .update({
        ...updatePayload,
        status: 'playing'
      })
      .eq('id', gameId);
  };

  const updateGameState = async (gameId: string, newState: any, currentTurnId?: string | null) => {
    // 단방향 렌더링 원칙: 낙관적 UI 업데이트를 하지 않고 DB만 갱신.
    // Realtime 채널이 UPDATE 이벤트를 받아서 상태를 변경하게 함으로써 애니메이션 꼬임 방지.
    const payload: any = { game_state: newState };
    if (currentTurnId !== undefined) {
      payload.current_turn_id = currentTurnId;
    }
    
    if (!profile) return;
    await supabase
      .from('multiplayer_games')
      .update(payload)
      .eq('id', gameId)
      .eq('current_turn_id', profile.id); // 서버 레벨에서 턴(Turn) 변조 검증
  };

  const endGame = async (gameId: string, winnerId: string | null, finalGameState?: any) => {
    const payload: any = {
      status: 'finished',
      winner_id: winnerId,
      current_turn_id: null // 턴 정보 명시적 초기화
    };
    
    if (finalGameState) {
      payload.game_state = finalGameState;
    }

    if (!profile) return;
    
    let query = supabase.from('multiplayer_games').update(payload).eq('id', gameId);
    
    // finalGameState가 있다는 것은 승리/무승부 시 보드를 갱신한다는 의미이므로 턴 검증
    if (finalGameState) {
      query = query.eq('current_turn_id', profile.id);
    }
    
    await query;
  };

  const leaveGame = async (gameId: string) => {
    if (!profile || !game) return;
    
    if (game.host_id === profile.id) {
      // 방장이 나가면 방 자체를 폭파
      await supabase
        .from('multiplayer_games')
        .delete()
        .eq('id', gameId);
      setGame(null);
    } else if (game.guest_id === profile.id) {
      // 참여자가 나가면 방은 유지하고 참여자 정보만 초기화
      await supabase
        .from('multiplayer_games')
        .update({ guest_id: null, guest_ready: false })
        .eq('id', gameId);
    }
  };

  const sendInvitePush = async (title: string, content: string, url: string) => {
    if (!couple?.id || !profile?.id) return;
    
    // 파트너의 user_id 조회
    const { data: partnerData } = await supabase
      .from('profiles')
      .select('id')
      .eq('couple_id', couple.id)
      .neq('id', profile.id)
      .single();

    if (partnerData?.id) {
      await supabase.from('notifications').insert({
        user_id: partnerData.id,
        couple_id: couple.id,
        title,
        content,
        type: 'game_reward', // 기존 푸시 로직 맵핑 (알림 수신 허용 여부를 위함)
        metadata: { url }
      });
    }
  };

  return {
    game,
    loading,
    createGame,
    joinGame,
    setReady,
    startGame,
    updateGameState,
    endGame,
    leaveGame,
    sendInvitePush
  };
}
