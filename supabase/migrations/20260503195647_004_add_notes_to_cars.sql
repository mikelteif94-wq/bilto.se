/*
  # Add notes column and update policies for admin

  1. Changes
    - Add `notes` column to `cars` table (text, default '') for internal notes

  2. Security
    - Allow authenticated users to update cars (admin can change status and notes)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'notes'
  ) THEN
    ALTER TABLE cars ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cars'
      AND policyname = 'Allow authenticated to update cars'
  ) THEN
    CREATE POLICY "Allow authenticated to update cars"
      ON cars
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
