/*
  # Add RLS policies for public access

  1. Policies
    - Allow anyone to read cars (public listing for dealers)
    - Allow anyone to read customers info (for display)
    - Allow anyone to read car images (for display)
    - Allow anyone to insert into customers table (self-registration)
    - Allow anyone to insert into cars table (self-listing)
    - Allow anyone to insert into car_images table (image upload)

  Note: These are permissive policies allowing public listing and submission.
  In production, you would want to add authentication and restrict access.
*/

-- Allow public read access to cars
CREATE POLICY "Allow public to read cars"
  ON cars
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public read access to customers
CREATE POLICY "Allow public to read customers"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public read access to car_images
CREATE POLICY "Allow public to read car_images"
  ON car_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public insert into customers (for sellers)
CREATE POLICY "Allow public to insert customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public insert into cars (for sellers)
CREATE POLICY "Allow public to insert cars"
  ON cars
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public insert into car_images (for image uploads)
CREATE POLICY "Allow public to insert car_images"
  ON car_images
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);