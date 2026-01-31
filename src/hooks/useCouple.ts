import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleContext } from '../context/CoupleContext';

export const useCouple = () => {
  const context = useCoupleContext();
  const [isCoupleFormed, setIsCoupleFormed] = useState(false);

  const checkCoupleStatus = useCallback(async () => {
    if (!context.couple?.id) {
      setIsCoupleFormed(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', context.couple.id);

      if (error) throw error;
      
      // If count is 2 or more, the couple is formed
      setIsCoupleFormed((count || 0) >= 2);
    } catch (err) {
      console.error('Error checking couple status:', err);
      setIsCoupleFormed(false);
    }
  }, [context.couple?.id]);

  useEffect(() => {
    checkCoupleStatus();
  }, [checkCoupleStatus]);

  return {
    ...context,
    isCoupleFormed
  };
};
