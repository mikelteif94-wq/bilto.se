/*
  # Add startbud (starting bid) to cars

  1. Schema changes
    - `cars.startbud` (integer, nullable): The starting bid amount (in SEK)
      that admin sets for an auction. Visible to dealers when placing bids.

  2. Notes
    - Nullable: not all cars need a starting bid (legacy and brokerage flows).
    - No data loss; purely additive column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'startbud'
  ) THEN
    ALTER TABLE cars ADD COLUMN startbud integer;
  END IF;
END $$;
