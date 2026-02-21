export interface Profile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  couple_id: string | null;
  updated_at?: string;
  last_active_at?: string;
}

export interface Couple {
  id: string;
  anniversary_date: string | null;
  invite_code: string | null;
  created_at?: string;
}

export interface VisitComment {
  id: string;
  visit_id: string;
  writer_id: string;
  content: string;
  created_at: string;
  writer?: Profile; // Joined data
}

export interface Trip {
  id: string;
  couple_id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface TripPlan {
  id: string;
  trip_id: string;
  day_number: number;
  category: string;
  start_time: string | null;
  end_time: string | null;
  memo: string | null;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface CoupleItem {
  couple_id: string;
  item_type: string;
  quantity: number;
  updated_at: string;
}
