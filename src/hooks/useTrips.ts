import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCouple } from './useCouple';
import { Trip, TripPlan } from '../types';

export const useTrips = () => {
  const { couple } = useCouple();
  const queryClient = useQueryClient();

  const { 
    data, 
    isLoading: isTripsLoading
  } = useInfiniteQuery({
    queryKey: ['trips_data', couple?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!couple?.id) return [];
      const pageSize = 20;
      const { data, error } = await supabase
        .from('trips')
        .select('id, couple_id, title, start_date, end_date, created_at, updated_at')
        .eq('couple_id', couple.id)
        .order('start_date', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);
      
      if (error) throw error;
      return data as Trip[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: !!couple?.id,
  });

  const trips = data?.pages.flat() || [];

  const createTrip = useMutation({
    mutationFn: async (newTrip: Omit<Trip, 'id' | 'couple_id' | 'created_at' | 'updated_at'>) => {
      if (!couple?.id) throw new Error('Couple not found');
      const { data, error } = await supabase
        .from('trips')
        .insert({ ...newTrip, couple_id: couple.id })
        .select()
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips_data', couple?.id] });
    },
  });

  const updateTrip = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips_data', couple?.id] });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips_data', couple?.id] });
    },
  });

  return {
    trips,
    isTripsLoading,
    createTrip,
    updateTrip,
    deleteTrip,
  };
};

export const useTripPlans = (tripId?: string) => {
  const queryClient = useQueryClient();

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['trip_plans_data', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('trip_plans')
        .select('id, trip_id, day_number, category, start_time, end_time, memo, place_name, address, lat, lng, order_index, created_at, updated_at')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as TripPlan[];
    },
    enabled: !!tripId,
  });

  const createPlan = useMutation({
    mutationFn: async (newPlan: Omit<TripPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('trip_plans')
        .insert(newPlan)
        .select()
        .single();
      
      if (error) throw error;
      return data as TripPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_plans_data', tripId] });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TripPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('trip_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TripPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_plans_data', tripId] });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trip_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_plans_data', tripId] });
    },
  });

  return {
    plans,
    isPlansLoading,
    createPlan,
    updatePlan,
    deletePlan,
  };
};
