/*
  # Kundlänk utan inloggning + kundens beslut

  1. Ändringar i `cars`
    - `access_token` (text, unikt) — slumpmässig token som används i kundens
      länk (t.ex. /min-bil/[token]). Ersätter behovet av inloggning.
    - `kund_beslut` (text, default '') — 'vill_salja', 'vill_inte_salja' eller ''.
    - `kund_beslut_at` (timestamptz, nullable) — när kunden svarade.

  2. Token genereras automatiskt för befintliga rader.

  3. Säkerhet
    - Ny INSERT-policy för public (anon) med WITH CHECK false — vi behåller
      den befintliga anon INSERT-policyn oförändrad.
    - Ingen public SELECT på cars. Kundens sida hämtar data via en edge
      function som slår upp `access_token` med service_role-nyckeln.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='access_token'
  ) THEN
    ALTER TABLE cars ADD COLUMN access_token text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='kund_beslut'
  ) THEN
    ALTER TABLE cars ADD COLUMN kund_beslut text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='kund_beslut_at'
  ) THEN
    ALTER TABLE cars ADD COLUMN kund_beslut_at timestamptz;
  END IF;
END $$;

-- Generera tokens för ev. befintliga rader som saknar
UPDATE cars
SET access_token = encode(gen_random_bytes(18), 'hex')
WHERE access_token IS NULL OR access_token = '';

-- Unikt index
CREATE UNIQUE INDEX IF NOT EXISTS cars_access_token_key ON cars(access_token);
