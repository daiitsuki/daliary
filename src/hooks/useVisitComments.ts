import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { VisitComment } from "../types";
import { useCouple } from "./useCouple";

export const useVisitComments = (visitId: string | undefined) => {
  const { profile } = useCouple();
  const queryClient = useQueryClient();

  const {
    data: comments = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["visit_comments", visitId],
    queryFn: async () => {
      if (!visitId) return [];
      const { data, error } = await supabase
        .from("visit_comments")
        .select("*, writer:writer_id(*)")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as VisitComment[];
    },
    enabled: !!visitId,
    staleTime: 1000 * 60 * 5,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!visitId || !profile) throw new Error("Missing visitId or profile");
      const { data, error } = await supabase
        .from("visit_comments")
        .insert({
          visit_id: visitId,
          writer_id: profile.id,
          content,
        })
        .select("*, writer:writer_id(*)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newComment) => {
      // 1. Update individual comment cache
      queryClient.setQueryData(["visit_comments", visitId], (old: any) => [
        ...(old || []),
        newComment,
      ]);

      // 2. Update memory_feed cache manually (comment_count & preview)
      queryClient.setQueryData(["memory_feed"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((v: any) => {
              if (v.id === visitId) {
                const updatedComments = [...(comments || []), newComment];
                return {
                  ...v,
                  comment_count: v.comment_count + 1,
                  preview_comments: updatedComments.slice(-2).map((c: any) => ({
                    id: c.id,
                    content: c.content,
                    writer: {
                      nickname: c.writer?.nickname || profile?.nickname,
                    },
                  })),
                };
              }
              return v;
            }),
          })),
        };
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("visit_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return commentId;
    },
    onSuccess: (deletedId) => {
      // 1. Update individual comment cache
      queryClient.setQueryData(["visit_comments", visitId], (old: any) =>
        (old || []).filter((c: any) => c.id !== deletedId),
      );

      // 2. Update memory_feed cache manually
      queryClient.setQueryData(["memory_feed"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((v: any) => {
              if (v.id === visitId) {
                const remainingComments = comments.filter(
                  (c) => c.id !== deletedId,
                );
                return {
                  ...v,
                  comment_count: Math.max(0, v.comment_count - 1),
                  preview_comments: remainingComments
                    .slice(-2)
                    .map((c: any) => ({
                      id: c.id,
                      content: c.content,
                      writer: { nickname: c.writer?.nickname },
                    })),
                };
              }
              return v;
            }),
          })),
        };
      });
    },
  });

  const addComment = async (content: string) => {
    try {
      await addCommentMutation.mutateAsync(content);
      return true;
    } catch (err) {
      console.error("Error adding comment:", err);
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      return true;
    } catch (err) {
      console.error("Error deleting comment:", err);
      return false;
    }
  };

  return {
    comments,
    loading:
      loading ||
      addCommentMutation.isPending ||
      deleteCommentMutation.isPending,
    addComment,
    deleteComment,
    refreshComments: refetch,
  };
};
