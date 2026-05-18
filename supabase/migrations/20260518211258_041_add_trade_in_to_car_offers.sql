/*
  # Add trade-in fields to car_offers

  Adds three optional columns to the car_offers table so that admin can
  include the customer's trade-in in an offer:

  - trade_in_included  (boolean, default false) — whether trade-in is part of the deal
  - trade_in_reg       (text)                   — registration number of the trade-in car
  - trade_in_value     (integer)                — estimated value used in the savings calc
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_offers' AND column_name = 'trade_in_included'
  ) THEN
    ALTER TABLE car_offers ADD COLUMN trade_in_included boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_offers' AND column_name = 'trade_in_reg'
  ) THEN
    ALTER TABLE car_offers ADD COLUMN trade_in_reg text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_offers' AND column_name = 'trade_in_value'
  ) THEN
    ALTER TABLE car_offers ADD COLUMN trade_in_value integer DEFAULT 0;
  END IF;
END $$;
