/*
  # Add missing columns to quote_requests

  1. Modified Tables
    - `quote_requests`
      - `link_or_seller` (text): URL to car listing or seller contact info (used in "found" funnel)
      - `target_car` (text): description of desired car to trade into (used in "trade" funnel)

  2. Notes
    - These columns are required by the QuoteForm for the "found a car" and "trade-in" flows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'link_or_seller'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN link_or_seller text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'target_car'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN target_car text NOT NULL DEFAULT '';
  END IF;
END $$;
