import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface StaffUser {
  id: string;
  user_id: string;
  fornamn: string;
  efternamn: string;
  mejl: string;
  telefon: string | null;
  role: 'salesperson' | 'valuator' | 'teamlead' | 'delivery_coordinator';
  is_active: boolean;
}

export function useStaffAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setStaffUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('staff_users')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (cancelled) return;
      if (err) { setError('Kunde inte hämta personalprofil.'); setLoading(false); return; }
      setStaffUser(data);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('bilto_portal');
  };

  return { session, staffUser, loading, error, signOut };
}
