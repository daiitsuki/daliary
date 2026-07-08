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
  last_notified_level?: number;
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

export interface DrawingAnswer {
  id: string;
  couple_id: string;
  writer_id: string;
  question_date: string;
  question_text: string;
  image_url: string;
  created_at: string;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface MultiplayerGame {
  id: string;
  couple_id: string;
  game_type: string;
  host_id: string;
  guest_id: string | null;
  host_ready: boolean;
  guest_ready: boolean;
  status: GameStatus;
  game_state: any; // Type narrowed down in specific game implementations
  current_turn_id: string | null;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}
