/*
  # Add optional condition comment and equipment list to cars

  1. Changes
    - Add `skick_kommentar` (text, default '') to `cars` — optional free-text where
      customers can describe their car's condition in more detail.
    - Add `utrustning` (jsonb, default '[]') to `cars` — list of equipment tags
      selected by the customer (e.g. "Dragkrok", "Skinnklädsel").

  2. Security
    - No RLS changes. The existing cars policies continue to apply.

  3. Important notes
    1. Both columns are optional and have safe defaults, so existing rows
       remain valid and clients that don't yet send the new fields still work.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'skick_kommentar'
  ) THEN
    ALTER TABLE cars ADD COLUMN skick_kommentar text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'utrustning'
  ) THEN
    ALTER TABLE cars ADD COLUMN utrustning jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;
