import { useMemo } from 'react';
import type { CatalogCarFull } from './useCatalogCars';

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

export function useCarImages(cars: CatalogCarFull[] = []) {
  const carImages = useMemo(() => {
    const imageMap = new Map<string, string>();
    const sorted = [...cars].sort((a, b) => b.model.length - a.model.length);

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

    return imageMap;
  }, [cars]);

  const getCarImage = (brand: string, model: string): string | undefined => {
    const brandNorm = normalize(brand);
    const modelNorm = normalize(model);

    if (!modelNorm) return undefined;

    const exactKey = `${brandNorm}-${modelNorm}`;
    if (carImages.has(exactKey)) return carImages.get(exactKey);

    const simpleModel = modelNorm.split(' ')[0];
    const simpleKey = `${brandNorm}-${simpleModel}`;
    if (carImages.has(simpleKey)) return carImages.get(simpleKey);

    const stripped = simpleModel.replace(/^e/, '');
    if (stripped !== simpleModel && stripped.length > 0) {
      const strippedKey = `${brandNorm}-${stripped}`;
      if (carImages.has(strippedKey)) return carImages.get(strippedKey);
    }

    for (const [key, url] of carImages.entries()) {
      if (key.startsWith(brandNorm + '-') && key.includes(simpleModel)) return url;
    }

    return undefined;
  };

  return { carImages, getCarImage };
}
