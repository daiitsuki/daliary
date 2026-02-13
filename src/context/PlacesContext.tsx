import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { KOREA_REGIONS } from '../constants/regions';
import { useCouple } from '../hooks/useCouple';

export interface VisitWithPlace {
  id: string;
  visited_at: string;
  image_url: string | null;
  region: string;
  sub_region: string | null;
  places: { name: string; address: string; } | null;
  visit_comments?: { count: number }[];
}

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: 'wishlist' | 'visited';
}

interface PlacesContextType {
  visits: VisitWithPlace[];
  wishlist: Place[];
  stats: Record<string, number>;
  subRegionStats: Record<string, Record<string, number>>;
  loading: boolean;
  refresh: () => Promise<void>;
  deleteWishlistPlace: (id: string) => Promise<boolean>;
  updateVisit: (visitId: string, data: { visited_at: string; image_url: string | null }) => Promise<boolean>;
  deleteVisit: (visitId: string) => Promise<boolean>;
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { couple, loading: coupleLoading } = useCouple();
  const queryClient = useQueryClient();

  const { data: placesData, isLoading: loading, refetch } = useQuery({
    queryKey: ['places_data', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return { visits: [], wishlist: [], stats: {}, subRegionStats: {} };

      const counts: Record<string, number> = {};
      const subCounts: Record<string, Record<string, number>> = {};
      KOREA_REGIONS.forEach(r => {
        counts[r] = 0;
        subCounts[r] = {};
      });

      const [visitsRes, wishlistRes] = await Promise.all([
        supabase.from('visits').select('*, places!inner(name, address, couple_id), visit_comments(count)').eq('places.couple_id', couple.id).order('visited_at', { ascending: false }),
        supabase.from('places').select('id, name, address, lat, lng, status, created_at').eq('couple_id', couple.id).eq('status', 'wishlist').order('created_at', { ascending: false })
      ]);

      const visits = (visitsRes.data || []) as any[];
      const wishlist = (wishlistRes.data || []) as Place[];

      visits.forEach(v => {
        if (v.region && counts.hasOwnProperty(v.region)) {
          counts[v.region]++;
          
          if (v.sub_region) {
            if (!subCounts[v.region][v.sub_region]) {
              subCounts[v.region][v.sub_region] = 0;
            }
            subCounts[v.region][v.sub_region]++;
          }
        }
      });

      return { visits, wishlist, stats: counts, subRegionStats: subCounts };
    },
    enabled: !!couple?.id && !coupleLoading,
  });

  const deleteWishlistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places_data', couple?.id] });
    },
  });

  const updateVisitMutation = useMutation({
    mutationFn: async ({ visitId, data }: { visitId: string, data: any }) => {
      const { error } = await supabase
        .from('visits')
        .update(data)
        .eq('id', visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places_data', couple?.id] });
    },
  });

  const deleteVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places_data', couple?.id] });
    },
  });

  const visits = placesData?.visits || [];
  const wishlist = placesData?.wishlist || [];
  const stats = placesData?.stats || {};
  const subRegionStats = placesData?.subRegionStats || {};

  return (
    <PlacesContext.Provider value={{ 
      visits, wishlist, stats, subRegionStats, loading, 
      refresh: async () => { await refetch(); },
      deleteWishlistPlace: async (id) => {
        try {
          await deleteWishlistMutation.mutateAsync(id);
          return true;
        } catch { return false; }
      },
      updateVisit: async (visitId, data) => {
        try {
          await updateVisitMutation.mutateAsync({ visitId, data });
          return true;
        } catch { return false; }
      },
      deleteVisit: async (visitId) => {
        try {
          await deleteVisitMutation.mutateAsync(visitId);
          return true;
        } catch { return false; }
      }
    }}>
      {children}
    </PlacesContext.Provider>
  );
};

export const usePlaces = () => {
  const context = useContext(PlacesContext);
  if (context === undefined) {
    throw new Error('usePlaces must be used within a PlacesProvider');
  }
  return context;
};
