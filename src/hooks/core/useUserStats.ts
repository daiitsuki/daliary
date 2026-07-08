import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export interface UserStats {
  attendances: number;
  answers: number;
  visits: number;
  comments: number;
  likes: number;
  total_points: number;
}

export const useUserStats = (userId?: string) => {
  return useQuery<UserStats>({
    queryKey: ["user_stats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");

      const { data, error } = await supabase.rpc("get_user_stats", {
        p_user_id: userId,
      });

      if (error) throw error;
      return data as UserStats;
    },
    enabled: !!userId,
  });
};
