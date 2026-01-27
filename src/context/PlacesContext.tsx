import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { KOREA_REGIONS } from '../hooks/useVisitVerification';
import { useCouple } from '../hooks/useCouple';

export interface VisitWithPlace {
  id: string;
  visited_at: string;
  image_url: string | null;
  comment: string | null;
  region: string;
  places: { name: string; address: string; } | null;
}

export interface DiaryWithRegion {
  id: string;
  content: string;
  mood: string | null;
  image_url: string | null;
  created_at: string;
  region: string;
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
  diaries: DiaryWithRegion[];
  wishlist: Place[];
  stats: Record<string, number>;
  loading: boolean;
  refresh: () => Promise<void>;
  deleteWishlistPlace: (id: string) => Promise<boolean>;
  updateVisit: (visitId: string, data: { visited_at: string; comment: string | null; image_url: string | null }) => Promise<boolean>;
  deleteVisit: (visitId: string) => Promise<boolean>;
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { couple } = useCouple();
  const [visits, setVisits] = useState<VisitWithPlace[]>([]);
  const [diaries, setDiaries] = useState<DiaryWithRegion[]>([]);
  const [wishlist, setWishlist] = useState<Place[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!couple?.id) return;

    try {
      setLoading(true);
      const counts: Record<string, number> = {};
      KOREA_REGIONS.forEach(r => counts[r] = 0);
      
      const [visitsRes, diariesRes, wishlistRes] = await Promise.allSettled([
        supabase.from('visits').select('*, places!inner(name, address, couple_id)').eq('places.couple_id', couple.id).order('visited_at', { ascending: false }),
        supabase.from('diaries').select('*').eq('couple_id', couple.id).not('region', 'is', null).order('created_at', { ascending: false }),
        supabase.from('places').select('*').eq('couple_id', couple.id).eq('status', 'wishlist').order('created_at', { ascending: false })
      ]);

      if (visitsRes.status === 'fulfilled' && visitsRes.value.data) {
        setVisits(visitsRes.value.data as any);
        visitsRes.value.data.forEach(v => {
          if (v.region && counts.hasOwnProperty(v.region)) counts[v.region]++;
        });
      }
      if (diariesRes.status === 'fulfilled' && diariesRes.value.data) setDiaries(diariesRes.value.data);
      if (wishlistRes.status === 'fulfilled' && wishlistRes.value.data) setWishlist(wishlistRes.value.data);

      setStats(counts);
    } catch (err) {
      console.error('Error fetching places data:', err);
    } finally {
      setLoading(false);
    }
  }, [couple?.id]);

  const deleteWishlistPlace = async (id: string) => {
    try {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) throw error;
      setWishlist(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateVisit = async (visitId: string, data: { visited_at: string; comment: string | null; image_url: string | null }) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update(data)
        .eq('id', visitId);
      
      if (error) throw error;
      await fetchData(); // 전역 데이터 갱신
      return true;
    } catch (err) {
      console.error('Error updating visit:', err);
      return false;
    }
  };

  const deleteVisit = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);
      
      if (error) throw error;
      await fetchData(); // 전역 데이터 갱신
      return true;
    } catch (err) {
      console.error('Error deleting visit:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PlacesContext.Provider value={{ 
      visits, diaries, wishlist, stats, loading, 
      refresh: fetchData, deleteWishlistPlace, updateVisit, deleteVisit 
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
