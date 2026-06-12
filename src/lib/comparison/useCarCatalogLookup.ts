import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ComparisonCar } from './types';

type DbRow = {
  make: string;
  model: string;
  slug: string;
  betyg_totalt: string | null;
  betyg_korning: string | null;
  betyg_komfort: string | null;
  betyg_praktiskt: string | null;
  betyg_varde: string | null;
  pris_ny_fran: string | null;
  pris_ny_till: string | null;
  pris_begagnat: string | null;
  manadskostnad_begagnad: number | null;
  manadskostnad_beg_min: string | null;
  manadskostnad_beg_max: string | null;
  kaross: string | null;
  drivmedel: string | null;
  drivlina_kort: string | null;
  drivetrain_type: string | null;
  bagage_liter: number | null;
  generation_fran_ar: number | null;
  generation_till_ar: number | null;
  expert_text: string | null;
  meta_description: string | null;
  styrkor: string[] | null;
  svagheter: string[] | null;
  passar_for: string[] | null;
  segment: string | null;
  image_url: string | null;
  cleaned_image_url: string | null;
  is_active: boolean;
  ncap_stars?: never;
  seats: number | null;
};

function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : parseFloat(v) || 0;
}

function mapBodyType(kaross: string | null): ComparisonCar['specs']['body_type'] {
  const map: Record<string, ComparisonCar['specs']['body_type']> = {
    suv: 'suv', sedan: 'sedan', kombi: 'kombi', coupe: 'coupe',
    halvkombi: 'hatchback', hatchback: 'hatchback', cab: 'cab',
    cabriolet: 'cab', mpv: 'mpv',
  };
  return map[(kaross ?? '').toLowerCase()] ?? 'suv';
}

function mapFuelTypes(drivmedel: string | null): ComparisonCar['specs']['fuel_types'] {
  const s = (drivmedel ?? '').toLowerCase();
  const types: ComparisonCar['specs']['fuel_types'] = [];
  if (s.includes('bensin') && !s.includes('laddhybrid') && !s.includes('mildhybrid')) types.push('bensin');
  else if (s.includes('bensin')) types.push('bensin');
  if (s.includes('diesel')) types.push('diesel');
  if (s.includes('mildhybrid')) types.push('mildhybrid');
  if (s.includes('laddhybrid')) types.push('laddhybrid');
  else if (s.includes('hybrid') && !s.includes('mildhybrid')) types.push('hybrid');
  if (s.includes('el') && !s.includes('laddhybrid') && !s.includes('bensin') && !s.includes('diesel')) types.push('el');
  return types.length > 0 ? types : ['bensin'];
}

function mapDrivetrain(drivetrain_type: string | null, drivlina: string | null): ComparisonCar['specs']['drivetrain'] {
  const dt = (drivetrain_type ?? '').toLowerCase();
  const s = (drivlina ?? '').toLowerCase();
  const combined = dt || s;
  const hasFwd = combined.includes('tv') || combined.includes('fram') || combined.includes('fwd');
  const hasAwd = combined.includes('fyr') || combined.includes('awd');
  const hasRwd = combined.includes('bak') || combined.includes('rwd');
  if (hasAwd && hasFwd) return ['fwd', 'awd'];
  if (hasAwd) return ['awd'];
  if (hasRwd) return ['rwd'];
  if (hasFwd) return ['fwd'];
  return ['fwd'];
}

function mapSegment(seg: string | null): ComparisonCar['segment'] {
  const map: Record<string, ComparisonCar['segment']> = {
    compact: 'compact', midsize: 'midsize', fullsize: 'fullsize',
    premium: 'premium', luxury: 'luxury', sports: 'sports',
  };
  return map[(seg ?? '').toLowerCase()] ?? 'midsize';
}

function buildGeneration(fromYear: number | null, toYear: number | null): string | undefined {
  if (!fromYear && !toYear) return undefined;
  if (fromYear && !toYear) return `${fromYear}-present`;
  if (fromYear && toYear) return `${fromYear}–${toYear}`;
  return undefined;
}

export function dbRowToComparisonCar(row: DbRow): ComparisonCar {
  return {
    id: `${row.make.toLowerCase().replace(/\s+/g, '_')}_${row.model.toLowerCase().replace(/[\s-]+/g, '_')}`,
    brand_id: row.make.toLowerCase().replace(/\s+/g, '_'),
    brand_display: row.make,
    model_display: row.model,
    generation: buildGeneration(row.generation_fran_ar, row.generation_till_ar),
    slug: row.slug,
    image_url: row.cleaned_image_url ?? row.image_url ?? undefined,
    ratings: {
      overall: toNumber(row.betyg_totalt),
      driving: toNumber(row.betyg_korning),
      comfort: toNumber(row.betyg_komfort),
      practicality: toNumber(row.betyg_praktiskt),
      value: toNumber(row.betyg_varde),
    },
    pricing: {
      new_from_sek: toNumber(row.pris_ny_fran) || undefined,
      new_to_sek: toNumber(row.pris_ny_till) || undefined,
      used_from_sek: toNumber(row.pris_begagnat) || undefined,
      monthly_used: row.manadskostnad_begagnad ?? undefined,
      monthly_used_min: toNumber(row.manadskostnad_beg_min) || undefined,
      monthly_used_max: toNumber(row.manadskostnad_beg_max) || undefined,
    },
    specs: {
      body_type: mapBodyType(row.kaross),
      fuel_types: mapFuelTypes(row.drivmedel),
      drivetrain: mapDrivetrain(row.drivetrain_type, row.drivlina_kort),
      seats: row.seats ?? 5,
      trunk_liters: row.bagage_liter ?? undefined,
    },
    safety: {
      euro_ncap_stars: undefined,
    },
    pros: row.styrkor ?? [],
    cons: row.svagheter ?? [],
    fits: row.passar_for && row.passar_for.length > 0 ? row.passar_for : undefined,
    meta_description: row.expert_text ?? row.meta_description ?? undefined,
    segment: mapSegment(row.segment),
    competitors: [],
    is_active: row.is_active,
    updated_at: new Date().toISOString().slice(0, 10),
  };
}

export function useCarCatalogLookup(make: string, model: string): {
  data: ComparisonCar | null;
  loading: boolean;
} {
  const [data, setData] = useState<ComparisonCar | null>(null);
  const [loading, setLoading] = useState(!!(make && model));

  useEffect(() => {
    if (!make || !model) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setData(null);
    setLoading(true);

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    const run = async () => {
      try {
        const { data: row, error } = await supabase
          .from('car_catalog')
          .select('make, model, slug, betyg_totalt, betyg_korning, betyg_komfort, betyg_praktiskt, betyg_varde, pris_ny_fran, pris_ny_till, pris_begagnat, manadskostnad_begagnad, manadskostnad_beg_min, manadskostnad_beg_max, kaross, drivmedel, drivlina_kort, drivetrain_type, bagage_liter, generation_fran_ar, generation_till_ar, expert_text, meta_description, styrkor, svagheter, passar_for, segment, image_url, cleaned_image_url, is_active, seats')
          .ilike('make', make)
          .ilike('model', model)
          .maybeSingle();

        if (cancelled) return;
        if (row && !error) {
          setData(dbRowToComparisonCar(row as DbRow));
        }
      } catch {
        // ignore
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [make, model]);

  return { data, loading };
}
