import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCouple } from '../hooks/useCouple';

export interface TimetableBlock {
  id: string;
  created_at: string;
  updated_at: string;
  couple_id: string;
  writer_id: string;
  title: string;
  day_of_week: number; // 0=일, 1=월, ..., 6=토
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  place_name: string | null;
  place_address: string | null;
  color: string;
  memo: string | null;
}

export type TimetableBlockInput = Omit<TimetableBlock, 'id' | 'created_at' | 'updated_at' | 'couple_id' | 'writer_id'>;

interface TimetableContextType {
  myBlocks: TimetableBlock[];
  partnerBlocks: TimetableBlock[];
  loading: boolean;
  addBlock: (block: TimetableBlockInput) => Promise<void>;
  updateBlock: (id: string, updates: Partial<TimetableBlockInput>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  deleteAllBlocks: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { couple, profile, loading: coupleLoading } = useCouple();
  const queryClient = useQueryClient();

  const { data: allBlocks = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['timetable_blocks', couple?.id],
    queryFn: async () => {
      if (!couple?.id || !profile?.id) return [];

      const { data, error } = await supabase
        .from('timetable_blocks')
        .select('id, created_at, updated_at, couple_id, writer_id, title, day_of_week, start_time, end_time, place_name, place_address, color, memo')
        .eq('couple_id', couple.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as TimetableBlock[];
    },
    enabled: !!couple?.id && !!profile?.id && !coupleLoading,
  });

  const myBlocks = allBlocks.filter(b => b.writer_id === profile?.id);
  const partnerBlocks = allBlocks.filter(b => b.writer_id !== profile?.id);

  const addMutation = useMutation({
    mutationFn: async (block: TimetableBlockInput) => {
      if (!profile?.id || !couple?.id) return;
      const { error } = await supabase.from('timetable_blocks').insert({
        ...block,
        couple_id: couple.id,
        writer_id: profile.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable_blocks', couple?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TimetableBlockInput> }) => {
      // 클라이언트 측 소유권 검증: 본인 블록이 아니면 실행 차단
      const target = allBlocks.find(b => b.id === id);
      if (!target) throw new Error('수정할 시간표 블록을 찾을 수 없습니다.');
      if (target.writer_id !== profile?.id) throw new Error('본인의 시간표만 수정할 수 있습니다.');

      const { error } = await supabase
        .from('timetable_blocks')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable_blocks', couple?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('timetable_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable_blocks', couple?.id] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from('timetable_blocks')
        .delete()
        .eq('writer_id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable_blocks', couple?.id] });
    },
  });

  return (
    <TimetableContext.Provider value={{
      myBlocks,
      partnerBlocks,
      loading,
      addBlock: (block) => addMutation.mutateAsync(block),
      updateBlock: (id, updates) => updateMutation.mutateAsync({ id, updates }),
      deleteBlock: (id) => deleteMutation.mutateAsync(id),
      deleteAllBlocks: () => deleteAllMutation.mutateAsync(),
      refresh: async () => { await refetch(); },
    }}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetableContext = () => {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error('useTimetableContext must be used within a TimetableProvider');
  }
  return context;
};
