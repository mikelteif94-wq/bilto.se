/*
  # Add deal_readiness to quote_requests

  ## Changes
  - Add `deal_readiness` (text) to `quote_requests`
    Values: 'ready_now' | 'within_month' | 'just_looking' | ''

  This mirrors the same field on `cars` so admin has consistent
  readiness tracking across both sell and buy/trade flows.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'deal_readiness'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN deal_readiness text DEFAULT '';
  END IF;
END $$;
