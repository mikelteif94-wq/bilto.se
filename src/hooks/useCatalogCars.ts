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
  // Prefer Swedish columns, fall back to English originals
  price_new_from: number | null;
  price_new_till: number | null;
  price_used_from: number | null;
  monthly_cost_new_min: number | null;
  monthly_cost_used_min: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  drivetrain_type: string | null;
  is_active: boolean;
  slug: string | null;
  // Swedish columns
  drivmedel: string | null;
  drivlina: string | null;
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
            drivetrain_type, is_active, slug,
            pris_ny_fran, pris_ny_till, pris_begagnat,
            manadskostnad_ny, manadskostnad_begagnad,
            drivmedel, drivlina, fuel_types
          `)
          .eq('is_active', true)
          .order('make', { ascending: true })
          .order('model', { ascending: true })
          .limit(600);

        if (error) {
          console.error('useCatalogCars error:', error);
          return;
        }

        const merged = (data || []).map((c: Record<string, unknown>) => ({
          ...c,
          // Swedish columns override English if they have data
          price_new_from: (c.pris_ny_fran as number | null) ?? (c.price_new_from as number | null),
          price_new_till: (c.pris_ny_till as number | null) ?? null,
          price_used_from: (c.pris_begagnat as number | null) ?? (c.price_used_from as number | null),
          monthly_cost_new_min: (c.manadskostnad_ny as number | null) ?? (c.monthly_cost_new_min as number | null),
          monthly_cost_used_min: (c.manadskostnad_begagnad as number | null) ?? (c.monthly_cost_used_min as number | null),
        }));

        setCars(merged.filter((c) => c.image_url || c.cleaned_image_url) as CatalogCarFull[]);
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
