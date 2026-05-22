import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminBadges {
  newCars: number;
  pendingDealers: number;
  hittatBil: number;
  letarBil: number;
  inbyte: number;
  salj: number;
}

export function useAdminBadges(): AdminBadges {
  const [badges, setBadges] = useState<AdminBadges>({
    newCars: 0,
    pendingDealers: 0,
    hittatBil: 0,
    letarBil: 0,
    inbyte: 0,
    salj: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [cars, dealers, hittat, letar, inbyteRes, saljRes] = await Promise.all([
        supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'ny'),
        supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', false),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new').eq('search_option', 'found'),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new').eq('search_option', 'searching'),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new').eq('search_option', 'trade'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('kontaktad', false),
      ]);
      if (!cancelled) {
        setBadges({
          newCars: cars.count ?? 0,
          pendingDealers: dealers.count ?? 0,
          hittatBil: hittat.count ?? 0,
          letarBil: letar.count ?? 0,
          inbyte: inbyteRes.count ?? 0,
          salj: saljRes.count ?? 0,
        });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return badges;
}
