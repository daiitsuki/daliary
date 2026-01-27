import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useCouple } from "./useCouple";

export interface DiaryEntry {
  id: string;
  content: string;
  mood: string | null;
  created_at: string;
  writer_id: string;
  profiles: {
    nickname: string;
    avatar_url: string | null;
  };
}

export const useDiaries = () => {
  const { couple } = useCouple();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiaries = useCallback(async () => {
    if (!couple?.id) return;

    try {
      const { data, error } = await supabase
        .from("diaries")
        .select(
          `
          *,
          profiles:writer_id (nickname, avatar_url)
        `,
        )
        .eq("couple_id", couple.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setDiaries(data as any);
      }
    } catch (err) {
      console.error("Error fetching diaries:", err);
    } finally {
      setLoading(false);
    }
  }, [couple?.id]);

  useEffect(() => {
    fetchDiaries();

    if (!couple?.id) return;

    const channel = supabase
      .channel("timeline-realtime-v2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diaries",
          filter: `couple_id=eq.${couple.id}`,
        },
        () => fetchDiaries(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchDiaries]);

  const deleteDiary = async (id: string) => {
    try {
      const { error } = await supabase.from("diaries").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error deleting diary:", err);
      return false;
    }
  };

  const updateDiary = async (id: string, content: string, mood: string | null) => {
    try {
      const { error } = await supabase
        .from("diaries")
        .update({ content, mood, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error updating diary:", err);
      return false;
    }
  };

  return { diaries, loading, refresh: fetchDiaries, deleteDiary, updateDiary };
};
