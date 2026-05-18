/*
  # Storage policies for car-images bucket

  1. Policies
    - Allow anyone to upload images to the car-images bucket (public submissions)
    - Allow anyone to read images from the car-images bucket (public listing)

  2. Notes
    - The car-images bucket is public so reads work via public URLs as well,
      but policies are still required for object-level access.
*/

CREATE POLICY "Allow public to upload car images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "Allow public to read car images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'car-images');
