import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CatalogCarFull {
  id: string;
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
  fuel_types: string[] | null;
  body_type: string | null;
  segment: string | null;
  rating_overall: number | null;
  rating_driving: number | null;
  rating_comfort: number | null;
  rating_practicality: number | null;
  rating_value: number | null;
  expert_comment: string | null;
  seats: number | null;
  baggage_liters: number | null;
  price_new_from: number | null;
  price_used_from: number | null;
  monthly_cost_new_min: number | null;
  monthly_cost_used_min: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  drivetrain_type: string | null;
  is_active: boolean;
  slug: string | null;
}

export function useCatalogCars() {
  const [cars, setCars] = useState<CatalogCarFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('car_catalog')
          .select(`
            id, make, model,
            image_url, cleaned_image_url,
            fuel_types, body_type, segment,
            rating_overall, rating_driving, rating_comfort, rating_practicality, rating_value,
            expert_comment, seats,
            baggage_liters,
            price_new_from, price_used_from,
            monthly_cost_new_min, monthly_cost_used_min,
            strengths, weaknesses,
            drivetrain_type, is_active, slug
          `)
          .eq('is_active', true)
          .order('make', { ascending: true })
          .order('model', { ascending: true })
          .limit(600);

        if (error) {
          console.error('useCatalogCars error:', error);
          return;
        }

        setCars((data || []).filter((c: { image_url: string | null; cleaned_image_url: string | null }) => c.image_url || c.cleaned_image_url) as unknown as CatalogCarFull[]);
      } catch (err) {
        console.error('useCatalogCars failed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { cars, loading };
}
