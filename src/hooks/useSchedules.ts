import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';

export interface Schedule {
  id: string;
  created_at: string;
  couple_id: string;
  writer_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  color: string;
  category: 'me' | 'partner' | 'couple';
}

export type ScheduleInput = Omit<Schedule, 'id' | 'created_at' | 'couple_id' | 'writer_id'>;

export const useSchedules = () => {
  const { couple } = useCouple();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!couple?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('couple_id', couple.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [couple?.id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (schedule: Omit<Schedule, 'id' | 'created_at' | 'couple_id' | 'writer_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !couple?.id) return;

    const { error } = await supabase.from('schedules').insert({
      ...schedule,
      couple_id: couple.id,
      writer_id: user.id
    });

    if (error) throw error;
    fetchSchedules();
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const { error } = await supabase.from('schedules').update(updates).eq('id', id);
    if (error) throw error;
    fetchSchedules();
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
    fetchSchedules();
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    refresh: fetchSchedules
  };
};