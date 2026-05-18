/*
  # Add storage policies for catalog images and admin insert policy

  1. Changes
    - Create storage bucket `catalog-images` for car catalog reference images
    - Add storage policies for `catalog-images` bucket (public read, authenticated upload)
    - Add INSERT policy on `car_catalog` for authenticated admin users
    - Add UPDATE policy on `car_catalog` for authenticated admin users

  2. Security
    - Only authenticated users can upload to catalog-images
    - Anyone (including anon) can read catalog images (needed for quiz display)
    - INSERT/UPDATE on car_catalog restricted to authenticated users (admin)

  3. Notes
    - This enables the admin bulk upload page to write images and update catalog records
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read catalog images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'catalog-images');

CREATE POLICY "Authenticated users can upload catalog images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catalog-images');

CREATE POLICY "Authenticated users can update catalog images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'catalog-images');

CREATE POLICY "Admin can insert car catalog entries"
  ON car_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can update car catalog entries"
  ON car_catalog
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
