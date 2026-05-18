/*
  # Create car_catalog table

  1. New Tables
    - `car_catalog`
      - `id` (uuid, primary key)
      - `make` (text) - Car manufacturer name (e.g. "Volvo", "BMW")
      - `model` (text) - Car model name (e.g. "XC60", "3-serie")
      - `image_url` (text, nullable) - URL to car image
      - `cleaned_image_url` (text, nullable) - Cleaned/optimized image URL
      - `created_at` (timestamptz) - When the entry was created

  2. Security
    - Enable RLS on `car_catalog` table
    - Allow authenticated users to read car catalog data
    - Allow service role to insert/update (for admin seeding)

  3. Notes
    - This table stores reference car models used by the quiz recommendation engine
    - Public read access for quiz results display
*/

CREATE TABLE IF NOT EXISTS car_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  image_url text,
  cleaned_image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE car_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read car catalog"
  ON car_catalog
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon users can read car catalog"
  ON car_catalog
  FOR SELECT
  TO anon
  USING (true);
