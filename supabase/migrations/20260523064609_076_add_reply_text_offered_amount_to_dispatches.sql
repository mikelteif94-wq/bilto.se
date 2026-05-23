/*
  # Add reply_text and offered_amount to dealer_dispatches

  ## Changes
  - `dealer_dispatches.reply_text` (text, nullable) — dealer's reply message
  - `dealer_dispatches.offered_amount` (numeric, nullable) — dealer's offered price in SEK
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_dispatches' AND column_name = 'reply_text'
  ) THEN
    ALTER TABLE dealer_dispatches ADD COLUMN reply_text text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_dispatches' AND column_name = 'offered_amount'
  ) THEN
    ALTER TABLE dealer_dispatches ADD COLUMN offered_amount numeric;
  END IF;
END $$;
