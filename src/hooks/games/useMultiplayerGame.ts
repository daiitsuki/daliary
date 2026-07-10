import { useState, useEffect, useCallback } from 'react';
import { supabase } from "../../lib/supabase";
import { useCouple } from "../";
import { MultiplayerGame } from "../../types";

export function useMultiplayerGame(gameType: string) {
  const { couple, profile } = useCouple();
  const [game, setGame] = useState<MultiplayerGame | null>(null);
  const [loading, setLoading] = useState(true);

  // 항상 최신 방 1개를 가져옵니다 (finished 여부 상관없이)
  const fetchActiveGame = useCallback(async (showLoader = false) => {
    if (!couple?.id || !profile?.id) return;
    if (showLoader) setLoading(true);
    
    let { data } = await supabase
      .from('multiplayer_games')
      .select('*')
      .eq('couple_id', couple.id)
      .eq('game_type', gameType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      // 방이 없으면 파트너 ID를 찾아 즉시 생성 (영구 방 개념)
      let guestId = null;
      const { data: pData } = await supabase.from('profiles').select('id').eq('couple_id', couple.id).neq('id', profile.id).single();
      guestId = pData?.id || null;

      const { data: newGame, error: createError } = await supabase
        .from('multiplayer_games')
        .insert({
          couple_id: couple.id,
          game_type: gameType,
          host_id: profile.id, // 편의상 내 ID
          guest_id: guestId,   // 파트너 ID
          status: 'waiting',
          host_ready: false,
          guest_ready: false
        })
        .select()
        .maybeSingle();
      
      if (!createError && newGame) {
        data = newGame;
      } else {
        // 혹시 동시 생성되었다면 다시 조회
        const { data: retryData } = await supabase
          .from('multiplayer_games')
          .select('*')
          .eq('couple_id', couple.id)
          .eq('game_type', gameType)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        data = retryData;
      }
    }

    setGame(data as MultiplayerGame || null);
    setLoading(false);
  }, [couple?.id, profile?.id, gameType]);

  useEffect(() => {
    fetchActiveGame(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchActiveGame(false);
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
          event: '*',
          schema: 'public',
          table: 'multiplayer_games',
          filter: `couple_id=eq.${couple.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
             // 영구 방 개념이므로 삭제 시 다시 생성하도록 처리하거나 초기화
             fetchActiveGame(false);
          } else {
             const newData = payload.new as MultiplayerGame;
             if (newData.game_type === gameType) {
               setGame(newData);
             }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchActiveGame(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, gameType, fetchActiveGame]);

  const setReady = async (gameId: string, ready: boolean) => {
    if (!profile?.id || !game) return;
    const isHost = game.host_id === profile.id;
    
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
        status: 'playing',
        host_ready: false,
        guest_ready: false, // 게임 시작 시 준비 상태 초기화 (다음 판을 위해)
        winner_id: null
      })
      .eq('id', gameId);
  };

  const updateGameState = async (gameId: string, newState: any, currentTurnId?: string | null) => {
    const payload: any = { game_state: newState };
    if (currentTurnId !== undefined) {
      payload.current_turn_id = currentTurnId;
    }
    
    if (!profile) return;
    await supabase
      .from('multiplayer_games')
      .update(payload)
      .eq('id', gameId)
      .eq('current_turn_id', profile.id);
  };

  const endGame = async (gameId: string, winnerId: string | null, finalGameState?: any) => {
    const payload: any = {
      status: 'finished',
      winner_id: winnerId,
      current_turn_id: null
    };
    
    if (finalGameState) {
      payload.game_state = finalGameState;
    }

    if (!profile) return;
    
    let query = supabase.from('multiplayer_games').update(payload).eq('id', gameId);
    
    if (finalGameState) {
      query = query.eq('current_turn_id', profile.id);
    }
    
    await query;
  };

  // 영구 방이므로 leaveGame은 사용하지 않거나 껍데기만 남김
  const leaveGame = async (_gameId: string) => {
    // 아무것도 하지 않음
  };

  const sendInvitePush = async (title: string, content: string, url: string) => {
    if (!couple?.id || !profile?.id) return;
    
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
        type: 'game_reward',
        metadata: { url }
      });
    }
  };

  return {
    game,
    loading,
    setReady,
    startGame,
    updateGameState,
    endGame,
    leaveGame,
    sendInvitePush
  };
}

