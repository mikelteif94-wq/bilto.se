export interface CarRatings {
  overall: number;
  driving: number;
  comfort: number;
  practicality: number;
  value: number;
}

export interface CarPricing {
  new_from_sek?: number;
  new_to_sek?: number;
  used_from_sek?: number;
  monthly_used?: number;
  monthly_used_min?: number;
  monthly_used_max?: number;
}

export interface CarSpecs {
  body_type: 'sedan' | 'kombi' | 'suv' | 'coupe' | 'hatchback' | 'cab' | 'mpv';
  fuel_types: ('bensin' | 'diesel' | 'hybrid' | 'laddhybrid' | 'el')[];
  drivetrain: ('fwd' | 'rwd' | 'awd')[];
  seats: number;
  trunk_liters?: number;
  trunk_liters_max?: number;
}

export interface CarSafety {
  euro_ncap_stars?: number;
  euro_ncap_year?: number;
}

export interface ComparisonCar {
  id: string;
  brand_id: string;
  brand_display: string;
  model_display: string;
  generation?: string;
  image_url?: string;
  ratings: CarRatings;
  pricing: CarPricing;
  specs: CarSpecs;
  safety: CarSafety;
  pros: string[];
  cons: string[];
  slug: string;
  meta_description?: string;
  segment: 'compact' | 'midsize' | 'fullsize' | 'premium' | 'luxury' | 'sports';
  competitors: string[];
  is_active: boolean;
  updated_at: string;
}
