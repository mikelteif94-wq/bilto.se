import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminBadges {
  newCars: number;
  newQuotes: number;
  pendingDealers: number;
}

export function useAdminBadges(): AdminBadges {
  const [badges, setBadges] = useState<AdminBadges>({ newCars: 0, newQuotes: 0, pendingDealers: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [cars, quotes, dealers] = await Promise.all([
        supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'ny'),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', false),
      ]);
      if (!cancelled) {
        setBadges({
          newCars: cars.count ?? 0,
          newQuotes: quotes.count ?? 0,
          pendingDealers: dealers.count ?? 0,
        });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return badges;
}
