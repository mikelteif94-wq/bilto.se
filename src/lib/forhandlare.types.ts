export interface Forhandlare {
  id: string;
  slug: string;
  name: string;
  certifiering: 'Trainee' | 'Certifierad' | 'Senior' | 'Elite' | 'Master';
  bio: string | null;
  specialties: string[];
  languages: string[];
  city: string | null;
  avatar_url: string | null;
  fee_kr: number;
  rating: number;
  review_count: number;
  deal_count: number;
  avg_saving_kr: number;
  response_time_hours: number;
  is_active: boolean;
  created_at: string;
}
