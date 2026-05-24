/*
  # Add missing columns to car_catalog

  Adds 7 new columns to complete the full 39-field spec:

  ## New columns
  - `price_used_min` (integer) — cheapest used price (pris_begagnat_spann_min)
  - `price_used_max` (integer) — most expensive typical used price (pris_begagnat_spann_max)
  - `price_cheapest` (integer) — absolute cheapest available (pris_billigast)
  - `rating_scale` (text) — e.g. "1-5" or "1-10" (betyg_skala)
  - `generation_name` (text) — generation label, e.g. "Gen 2 (2020–2024)"
  - `generation_from_year` (integer) — start year of current generation
  - `generation_to_year` (integer) — end year (null = current)
  - `cta` (jsonb) — flexible call-to-action data per car
  - `persona_family` (text) — persona text: family suitability
  - `persona_driving` (text) — persona text: driving dynamics
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'price_used_min') THEN
    ALTER TABLE car_catalog ADD COLUMN price_used_min integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'price_used_max') THEN
    ALTER TABLE car_catalog ADD COLUMN price_used_max integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'price_cheapest') THEN
    ALTER TABLE car_catalog ADD COLUMN price_cheapest integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'rating_scale') THEN
    ALTER TABLE car_catalog ADD COLUMN rating_scale text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'generation_name') THEN
    ALTER TABLE car_catalog ADD COLUMN generation_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'generation_from_year') THEN
    ALTER TABLE car_catalog ADD COLUMN generation_from_year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'generation_to_year') THEN
    ALTER TABLE car_catalog ADD COLUMN generation_to_year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'cta') THEN
    ALTER TABLE car_catalog ADD COLUMN cta jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'persona_family') THEN
    ALTER TABLE car_catalog ADD COLUMN persona_family text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'persona_driving') THEN
    ALTER TABLE car_catalog ADD COLUMN persona_driving text;
  END IF;
END $$;
