import { useEffect, useRef, useState } from 'react';

export interface VehicleData {
  marke: string;
  modell: string;
  fullname: string;
  variant: string;
  ar: number | null;
  bransle: string;
  farg: string;
  fordonstyp: string;
  miltal: number | null;
}

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; data: VehicleData }
  | { status: 'not_found' }
  | { status: 'error' };

const REG_REGEX = /^[A-Z]{3}\d{2}[A-Z0-9]$/;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function useVehicleLookup(regnummer: string): LookupState {
  const [state, setState] = useState<LookupState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const normalized = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!REG_REGEX.test(normalized)) {
      setState({ status: 'idle' });
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading' });

    fetch(`${SUPABASE_URL}/functions/v1/lookup-vehicle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ regnummer: normalized }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        if (controller.signal.aborted) return;
        if (json.found === false) {
          setState({ status: 'not_found' });
        } else if (json.error) {
          setState({ status: 'error' });
        } else {
          setState({ status: 'found', data: json as VehicleData });
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => {
      controller.abort();
    };
  }, [regnummer]);

  return state;
}
