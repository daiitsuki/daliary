import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';
import { CATEGORY_CONFIG } from '../components/calendar/constants';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('couple_id', couple.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Transform data based on viewer perspective
      const transformedData = (data || []).map((schedule: Schedule) => {
        // If it's a couple schedule, no transformation needed
        if (schedule.category === 'couple') return schedule;

        const isWriter = schedule.writer_id === user.id;
        let effectiveCategory = schedule.category;

        if (isWriter) {
          // I wrote it: 'me' is me, 'partner' is partner. No change.
          effectiveCategory = schedule.category;
        } else {
          // Partner wrote it:
          // Their 'me' is my 'partner'
          // Their 'partner' is 'me'
          effectiveCategory = schedule.category === 'me' ? 'partner' : 'me';
        }

        return {
          ...schedule,
          category: effectiveCategory,
          // Override color based on the interpreted category to ensure consistency
          color: CATEGORY_CONFIG[effectiveCategory as keyof typeof CATEGORY_CONFIG].color
        };
      });

      setSchedules(transformedData);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find original schedule to check ownership
    const originalSchedule = schedules.find(s => s.id === id);
    if (!originalSchedule) return;

    let finalUpdates = { ...updates };
    
    // If I am NOT the writer, I need to inverse-transform the category back to the writer's perspective
    if (originalSchedule.writer_id !== user.id && updates.category && updates.category !== 'couple') {
      const inverseCategory = updates.category === 'me' ? 'partner' : 'me';
      finalUpdates.category = inverseCategory;
      finalUpdates.color = CATEGORY_CONFIG[inverseCategory as keyof typeof CATEGORY_CONFIG].color;
    }

    const { error } = await supabase.from('schedules').update(finalUpdates).eq('id', id);
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