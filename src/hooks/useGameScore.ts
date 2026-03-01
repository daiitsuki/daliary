import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useCouple } from "./useCouple";

export type GameType = "2048" | "watermelon" | "brick_breaker";

export interface GameScore {
  user_id: string;
  couple_id: string;
  game_type: GameType;
  high_score: number;
  last_reward_date: string | null;
}

export function useGameScore(gameType: GameType) {
  const { profile, couple } = useCouple();
  const queryClient = useQueryClient();

  const { data: scores, isLoading } = useQuery({
    queryKey: ["game_scores", gameType, couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from("game_scores")
        .select("*")
        .eq("couple_id", couple.id)
        .eq("game_type", gameType);

      if (error) throw error;
      return data as GameScore[];
    },
    enabled: !!couple?.id,
  });

  const recordResult = useMutation({
    mutationFn: async ({
      score,
      reachedTarget,
    }: {
      score: number;
      reachedTarget: boolean;
    }) => {
      const { data, error } = await supabase.rpc("record_game_result", {
        p_game_type: gameType,
        p_score: score,
        p_reached_target: reachedTarget,
      });

      if (error) throw error;
      return data as { reward_given: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game_scores", gameType] });
      queryClient.invalidateQueries({ queryKey: ["all_game_scores"] });
      queryClient.invalidateQueries({ queryKey: ["couple_points"] });
    },
  });

  // 본인의 점수만 편의상 별도로 추출
  const myScore = scores?.find(s => s.user_id === profile?.id) || null;

  return {
    scores,
    myScore,
    isLoading,
    recordResult,
  };
}

/**
 * 모든 게임의 점수와 보상 상태를 한 번의 요청으로 가져오는 훅 (대시보드용)
 */
export function useAllGameScores() {
  const { profile, couple } = useCouple();

  const { data: allScores, isLoading, refetch } = useQuery({
    queryKey: ["all_game_scores", couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from("game_scores")
        .select("*")
        .eq("couple_id", couple.id);

      if (error) throw error;
      return data as GameScore[];
    },
    enabled: !!couple?.id,
    staleTime: 1000 * 60 * 5,
  });

  const myScores = allScores?.filter(s => s.user_id === profile?.id) || [];

  return {
    allScores,
    myScores,
    isLoading,
    refetch,
    getScoreByType: (type: string) => myScores.find(s => s.game_type === type) || null
  };
}
