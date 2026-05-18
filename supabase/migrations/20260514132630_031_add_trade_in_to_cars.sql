/*
  # Add trade-in interest to cars

  1. Schema changes
    - `cars.trade_in_interest` (boolean, default false): Marks the car as
      having a trade-in lead — i.e. the seller is interested in buying
      another car as part of the deal.
    - `cars.trade_in_wants` (text, default ''): Free-text description of
      what the customer is looking to trade up/over to.

  2. Notes
    - Both fields are additive and have safe defaults; no data loss.
    - Used in admin manual create flow and visible in admin car detail.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'trade_in_interest'
  ) THEN
    ALTER TABLE cars ADD COLUMN trade_in_interest boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'trade_in_wants'
  ) THEN
    ALTER TABLE cars ADD COLUMN trade_in_wants text NOT NULL DEFAULT '';
  END IF;
END $$;
