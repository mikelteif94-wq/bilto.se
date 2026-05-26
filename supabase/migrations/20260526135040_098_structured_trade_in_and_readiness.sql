/*
  # Structured trade-in fields and deal-readiness on cars

  ## Changes
  - Add structured trade-in columns to `cars` table:
    - `trade_target_brand`  (text)  – märke kunden söker
    - `trade_target_model`  (text)  – modell kunden söker
    - `trade_target_free`   (text)  – fritext "vet inte / önskemål"
    - `trade_target_budget` (integer) – maxbudget i kr
    - `trade_target_fuel`   (text)  – drivmedel
    - `trade_target_payment`(text)  – betalningssätt (cash/finance)
  - Add `deal_readiness` (text) – when the customer is ready to close:
    values: 'ready_now' | 'within_month' | 'just_looking'

  ## Notes
  - All columns are nullable with empty defaults
  - No RLS change needed (existing policies on `cars` cover these columns)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='trade_target_brand') THEN
    ALTER TABLE cars ADD COLUMN trade_target_brand text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='trade_target_model') THEN
    ALTER TABLE cars ADD COLUMN trade_target_model text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='trade_target_free') THEN
    ALTER TABLE cars ADD COLUMN trade_target_free text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='trade_target_budget') THEN
    ALTER TABLE cars ADD COLUMN trade_target_budget integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='trade_target_fuel') THEN
    ALTER TABLE cars ADD COLUMN trade_target_fuel text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='trade_target_payment') THEN
    ALTER TABLE cars ADD COLUMN trade_target_payment text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='deal_readiness') THEN
    ALTER TABLE cars ADD COLUMN deal_readiness text DEFAULT '';
  END IF;
END $$;
