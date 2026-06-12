import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CatalogEntry {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
  fuel_types: string[] | null;
  body_type: string | null;
  rating_overall: number | null;
  expert_comment: string | null;
  is_active: boolean;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CatalogCar {
  make: string;
  model: string;
  image_url: string | null;
  fuel_types: string[] | null;
  body_type: string | null;
  rating_overall: number | null;
  expert_comment: string | null;
  is_active: boolean;
}

export function useCarImages() {
  const [carImages, setCarImages] = useState<Map<string, string>>(new Map());
  const [catalogCars, setCatalogCars] = useState<CatalogCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCarImages() {
      try {
        const { data, error } = await supabase
          .from('car_catalog')
          .select('make, model, image_url, cleaned_image_url, fuel_types, body_type, rating_overall, expert_comment, is_active')
          .eq('is_active', true)
          .limit(500);

        if (error) {
          console.error('Error fetching car images:', error);
          return;
        }

        const imageMap = new Map<string, string>();
        const entries = (data || []) as unknown as CatalogEntry[];

        // Expose all active catalog entries (with or without image) for search
        setCatalogCars(entries.map(e => ({
          make: e.make,
          model: e.model,
          image_url: e.image_url || e.cleaned_image_url,
          fuel_types: e.fuel_types,
          body_type: e.body_type,
          rating_overall: e.rating_overall,
          expert_comment: e.expert_comment,
          is_active: e.is_active,
        })));

        // Sort longest model names first so specific variants (e.g. "XC40 Recharge")
        // are inserted before their shorter aliases ("XC40") and won't be overwritten.
        const sorted = [...entries].sort((a, b) => b.model.length - a.model.length);

        sorted.forEach((car) => {
          const imageUrl = car.image_url || car.cleaned_image_url;
          if (imageUrl) {
            const brand = normalize(car.make);
            const model = normalize(car.model);
            const key = `${brand}-${model}`;
            imageMap.set(key, imageUrl);

            const simpleModel = model.split(' ')[0];
            const simpleKey = `${brand}-${simpleModel}`;
            if (!imageMap.has(simpleKey)) {
              imageMap.set(simpleKey, imageUrl);
            }
          }
        });

        setCarImages(imageMap);
      } catch (err) {
        console.error('Failed to fetch car images:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCarImages();
  }, []);

  const getCarImage = (brand: string, model: string): string | undefined => {
    const brandNorm = normalize(brand);
    const modelNorm = normalize(model);

    const exactKey = `${brandNorm}-${modelNorm}`;
    if (carImages.has(exactKey)) return carImages.get(exactKey);

    const simpleModel = modelNorm.split(' ')[0];
    const simpleKey = `${brandNorm}-${simpleModel}`;
    if (carImages.has(simpleKey)) return carImages.get(simpleKey);

    // Strip "e" prefix for electric variants (e.g. "e208" -> "208")
    const stripped = simpleModel.replace(/^e/, '');
    if (stripped !== simpleModel && stripped.length > 0) {
      const strippedKey = `${brandNorm}-${stripped}`;
      if (carImages.has(strippedKey)) return carImages.get(strippedKey);
    }

    for (const [key, url] of carImages.entries()) {
      if (key.startsWith(brandNorm + '-') && key.includes(simpleModel)) return url;
    }

    for (const [key, url] of carImages.entries()) {
      if (key.startsWith(brandNorm + '-')) return url;
    }

    return undefined;
  };

  return { carImages, catalogCars, getCarImage, loading };
}
