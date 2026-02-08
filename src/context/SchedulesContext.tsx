import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';
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

interface SchedulesContextType {
  schedules: Schedule[];
  loading: boolean;
  addSchedule: (schedule: ScheduleInput) => Promise<void>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SchedulesContext = createContext<SchedulesContextType | undefined>(undefined);

export const SchedulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { couple } = useCouple();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false); // 캐싱 여부 확인

  const fetchSchedules = useCallback(async (showLoading = true) => {
    if (!couple?.id) return;
    if (showLoading) setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('couple_id', couple.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map((schedule: Schedule) => {
        if (schedule.category === 'couple') return schedule;

        const isWriter = schedule.writer_id === user.id;
        let effectiveCategory = schedule.category;

        if (isWriter) {
          effectiveCategory = schedule.category;
        } else {
          effectiveCategory = schedule.category === 'me' ? 'partner' : 'me';
        }

        return {
          ...schedule,
          category: effectiveCategory,
          color: CATEGORY_CONFIG[effectiveCategory as keyof typeof CATEGORY_CONFIG].color
        };
      });

      setSchedules(transformedData);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [couple?.id]);

  useEffect(() => {
    if (couple?.id && !hasLoaded) {
      fetchSchedules();
    }
  }, [couple?.id, hasLoaded, fetchSchedules]);

  const addSchedule = async (schedule: ScheduleInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !couple?.id) return;

    const { error } = await supabase.from('schedules').insert({
      ...schedule,
      couple_id: couple.id,
      writer_id: user.id
    });

    if (error) throw error;
    await fetchSchedules(false); // 백그라운드 갱신
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const originalSchedule = schedules.find(s => s.id === id);
    if (!originalSchedule) return;

    let finalUpdates = { ...updates };
    
    if (originalSchedule.writer_id !== user.id && updates.category && updates.category !== 'couple') {
      const inverseCategory = updates.category === 'me' ? 'partner' : 'me';
      finalUpdates.category = inverseCategory;
      finalUpdates.color = CATEGORY_CONFIG[inverseCategory as keyof typeof CATEGORY_CONFIG].color;
    }

    const { error } = await supabase.from('schedules').update(finalUpdates).eq('id', id);
    if (error) throw error;
    await fetchSchedules(false); // 백그라운드 갱신
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
    await fetchSchedules(false); // 백그라운드 갱신
  };

  return (
    <SchedulesContext.Provider value={{
      schedules,
      loading,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      refresh: () => fetchSchedules(true)
    }}>
      {children}
    </SchedulesContext.Provider>
  );
};

export const useSchedulesContext = () => {
  const context = useContext(SchedulesContext);
  if (context === undefined) {
    throw new Error('useSchedulesContext must be used within a SchedulesProvider');
  }
  return context;
};
