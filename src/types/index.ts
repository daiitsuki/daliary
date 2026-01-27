export interface Profile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  couple_id: string | null;
  updated_at?: string;
}

export interface Couple {
  id: string;
  anniversary_date: string | null;
  invite_code: string | null;
  created_at?: string;
}
