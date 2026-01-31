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
