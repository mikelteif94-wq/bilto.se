/*
  # Enrich car_catalog with specs, ratings and admin metadata

  ## Summary
  Adds optional enrichment columns to car_catalog so that catalog-only cars
  (those not in the TypeScript comparison dataset) can be given correct
  fuel types, body type, rating, expert comment and active/duplicate flags
  via the new admin catalog UI.

  ## New Columns
  - `fuel_types` (text[]) — array: 'bensin','diesel','hybrid','laddhybrid','el'
  - `body_type` (text) — 'sedan','kombi','suv','coupe','hatchback','cab','mpv','pickup'
  - `segment` (text) — 'budget','compact','midsize','fullsize','premium','luxury','sports'
  - `rating_overall` (numeric 3,1) — 0–10 overall rating
  - `expert_comment` (text) — short note shown to users
  - `seats` (integer) — number of seats
  - `is_active` (boolean, default true) — set false to hide duplicates
  - `updated_at` (timestamptz) — last enrichment timestamp

  ## Security
  - Adds admin UPDATE policy so admins can enrich catalog entries
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'fuel_types') THEN
    ALTER TABLE car_catalog ADD COLUMN fuel_types text[] DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'body_type') THEN
    ALTER TABLE car_catalog ADD COLUMN body_type text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'segment') THEN
    ALTER TABLE car_catalog ADD COLUMN segment text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'rating_overall') THEN
    ALTER TABLE car_catalog ADD COLUMN rating_overall numeric(3,1) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'expert_comment') THEN
    ALTER TABLE car_catalog ADD COLUMN expert_comment text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'seats') THEN
    ALTER TABLE car_catalog ADD COLUMN seats integer DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'is_active') THEN
    ALTER TABLE car_catalog ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'updated_at') THEN
    ALTER TABLE car_catalog ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Check constraints for valid enum values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'car_catalog' AND constraint_name = 'car_catalog_body_type_check') THEN
    ALTER TABLE car_catalog ADD CONSTRAINT car_catalog_body_type_check
      CHECK (body_type IS NULL OR body_type IN ('sedan','kombi','suv','coupe','hatchback','cab','mpv','pickup'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'car_catalog' AND constraint_name = 'car_catalog_segment_check') THEN
    ALTER TABLE car_catalog ADD CONSTRAINT car_catalog_segment_check
      CHECK (segment IS NULL OR segment IN ('budget','compact','midsize','fullsize','premium','luxury','sports'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'car_catalog' AND constraint_name = 'car_catalog_rating_check') THEN
    ALTER TABLE car_catalog ADD CONSTRAINT car_catalog_rating_check
      CHECK (rating_overall IS NULL OR (rating_overall >= 0 AND rating_overall <= 10));
  END IF;
END $$;

-- Admin UPDATE policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'car_catalog' AND policyname = 'Admins can update catalog entries') THEN
    CREATE POLICY "Admins can update catalog entries"
      ON car_catalog FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
