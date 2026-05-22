import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminBadges {
  totalLeads: number;
  pendingDealers: number;
}

export function useAdminBadges(): AdminBadges {
  const [badges, setBadges] = useState<AdminBadges>({ totalLeads: 0, pendingDealers: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [sellLeads, buyLeads, dealers] = await Promise.all([
        // Cars that haven't been sold/lost yet
        supabase.from('cars').select('id', { count: 'exact', head: true })
          .not('status', 'in', '("sold","lost","paused")'),
        // Quote requests not yet handled
        supabase.from('quote_requests').select('id', { count: 'exact', head: true })
          .not('status', 'in', '("won","lost","converted")'),
        supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', false),
      ]);
      if (!cancelled) {
        setBadges({
          totalLeads: (sellLeads.count ?? 0) + (buyLeads.count ?? 0),
          pendingDealers: dealers.count ?? 0,
        });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return badges;
}
