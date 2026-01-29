import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { VisitComment } from '../types';
import { useCouple } from './useCouple';

export const useVisitComments = (visitId: string | undefined) => {
  const { profile } = useCouple();
  const [comments, setComments] = useState<VisitComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!visitId) return;

    try {
      const { data, error } = await supabase
        .from('visit_comments')
        .select('*, writer:writer_id(*)')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data as VisitComment[]);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [visitId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!visitId || !profile) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('visit_comments')
        .insert({
          visit_id: visitId,
          writer_id: profile.id,
          content
        });

      if (error) throw error;
      await fetchComments();
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('visit_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { comments, loading, addComment, deleteComment, refreshComments: fetchComments };
};
