/*
  # Add hidden_from_dealers flag to cars

  1. Changes
    - Adds boolean column `hidden_from_dealers` to `cars` (default false)
    - Lets admin hide a car from the dealer marketplace without deleting it
    - Existing RLS already restricts dealers to active, non-brokerage cars; we add filter in app
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'hidden_from_dealers'
  ) THEN
    ALTER TABLE cars ADD COLUMN hidden_from_dealers boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS cars_hidden_from_dealers_idx ON cars (hidden_from_dealers);
