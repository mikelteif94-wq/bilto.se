/*
  # Add email column to leads table

  ## Change
  - Adds optional `email` column (text, NOT NULL DEFAULT '') to the `leads` table
  - Allows storing customer email for confirmation emails on quick lead forms
  - Existing rows default to empty string (no breaking changes)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE leads ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;
