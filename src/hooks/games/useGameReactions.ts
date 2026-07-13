import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../core/useCouple';

export type ReactionIconName = 'ThumbsUp' | 'Heart' | 'Smile' | 'Frown' | 'Flame' | 'Surprise';

export interface ReactionEvent {
  id: string; // Unique ID for the animation
  iconName: ReactionIconName;
  senderId: string;
  xOffset: number; // Random horizontal offset for animation
}

export const useGameReactions = (gameId: string | undefined) => {
  const { profile } = useCouple();
  const currentUserId = profile?.id;
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!gameId || !currentUserId) return;

    // Create a unique broadcast channel for this game
    const reactionChannel = supabase.channel(`game_reactions_${gameId}`, {
      config: {
        broadcast: {
          ack: false,
        },
      },
    });

    setChannel(reactionChannel);

    reactionChannel
      .on('broadcast', { event: 'reaction' }, (payload) => {
        // payload.payload contains the actual data sent
        const data = payload.payload as { iconName: ReactionIconName; senderId: string };
        
        // Add new reaction to the list
        const newReaction: ReactionEvent = {
          id: Math.random().toString(36).substring(7),
          iconName: data.iconName,
          senderId: data.senderId,
          xOffset: Math.floor(Math.random() * 40) - 20, // -20 to 20
        };

        setReactions((prev) => [...prev, newReaction]);

        // Remove reaction after 2 seconds (animation duration)
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
        }, 2000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reactionChannel);
    };
  }, [gameId, currentUserId]);

  const lastReactionTime = useRef<number>(0);

  const sendReaction = useCallback(
    (iconName: ReactionIconName) => {
      if (!channel || !currentUserId) return;

      const now = Date.now();
      if (now - lastReactionTime.current < 700) {
        // Cooldown of 700ms to prevent spamming
        return;
      }
      lastReactionTime.current = now;

      // Broadcast to others
      channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { iconName, senderId: currentUserId },
      });

      // Also show it to myself immediately
      const newReaction: ReactionEvent = {
        id: Math.random().toString(36).substring(7),
        iconName,
        senderId: currentUserId,
        xOffset: Math.floor(Math.random() * 40) - 20,
      };

      setReactions((prev) => [...prev, newReaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2000);
    },
    [channel, currentUserId]
  );

  return {
    reactions,
    sendReaction,
    currentUserId,
  };
};
