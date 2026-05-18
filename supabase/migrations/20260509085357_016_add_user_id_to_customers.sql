/*
  # Link customers to Supabase auth users

  1. Changes
    - Add nullable `user_id` column to `customers` linking to `auth.users`
    - Index on `user_id` for fast lookup
    - New RLS policies so authenticated customers can see their own rows across
      `customers`, `cars`, `car_images`, and `bids` (read-only for bids)

  2. Security
    - All new policies restrict access to rows owned by the authenticated user
    - Existing anonymous token-based access via edge functions remains unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Customer can read own profile' AND tablename = 'customers'
  ) THEN
    CREATE POLICY "Customer can read own profile"
      ON customers FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Customer can read own cars' AND tablename = 'cars'
  ) THEN
    CREATE POLICY "Customer can read own cars"
      ON cars FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM customers
          WHERE customers.id = cars.customer_id
            AND customers.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Customer can read own car images' AND tablename = 'car_images'
  ) THEN
    CREATE POLICY "Customer can read own car images"
      ON car_images FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cars
          JOIN customers ON customers.id = cars.customer_id
          WHERE cars.id = car_images.car_id
            AND customers.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Customer can read own car bids' AND tablename = 'bids'
  ) THEN
    CREATE POLICY "Customer can read own car bids"
      ON bids FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cars
          JOIN customers ON customers.id = cars.customer_id
          WHERE cars.id = bids.car_id
            AND customers.user_id = auth.uid()
        )
      );
  END IF;
END $$;
