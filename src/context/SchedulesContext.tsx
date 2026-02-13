import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { couple, profile, loading: coupleLoading } = useCouple();
  const queryClient = useQueryClient();

  const { data: rawSchedules = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['schedules', couple?.id],
    queryFn: async () => {
      if (!couple?.id || !profile?.id) return [];
      
      const { data, error } = await supabase
        .from('schedules')
        .select('id, created_at, couple_id, writer_id, title, description, start_date, end_date, color, category')
        .eq('couple_id', couple.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!couple?.id && !!profile?.id && !coupleLoading,
  });

  const schedules = (rawSchedules || []).map((schedule: any) => {
    if (schedule.category === 'couple') return schedule;

    const isWriter = schedule.writer_id === profile?.id;
    let effectiveCategory = schedule.category;

    if (!isWriter) {
      effectiveCategory = schedule.category === 'me' ? 'partner' : 'me';
    }

    return {
      ...schedule,
      category: effectiveCategory,
      color: CATEGORY_CONFIG[effectiveCategory as keyof typeof CATEGORY_CONFIG].color
    };
  }) as Schedule[];

  const addMutation = useMutation({
    mutationFn: async (schedule: ScheduleInput) => {
      if (!profile?.id || !couple?.id) return;
      const { error } = await supabase.from('schedules').insert({
        ...schedule,
        couple_id: couple.id,
        writer_id: profile.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', couple?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Schedule> }) => {
      if (!profile?.id) return;

      const originalSchedule = schedules.find(s => s.id === id);
      if (!originalSchedule) return;

      let finalUpdates = { ...updates };
      
      if (originalSchedule.writer_id !== profile.id && updates.category && updates.category !== 'couple') {
        const inverseCategory = updates.category === 'me' ? 'partner' : 'me';
        finalUpdates.category = inverseCategory;
        finalUpdates.color = CATEGORY_CONFIG[inverseCategory as keyof typeof CATEGORY_CONFIG].color;
      }

      const { error: updateError } = await supabase.from('schedules').update(finalUpdates).eq('id', id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', couple?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('schedules').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', couple?.id] });
    },
  });

  return (
    <SchedulesContext.Provider value={{
      schedules,
      loading,
      addSchedule: (s) => addMutation.mutateAsync(s),
      updateSchedule: (id, updates) => updateMutation.mutateAsync({ id, updates }),
      deleteSchedule: (id) => deleteMutation.mutateAsync(id),
      refresh: async () => { await refetch(); }
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
