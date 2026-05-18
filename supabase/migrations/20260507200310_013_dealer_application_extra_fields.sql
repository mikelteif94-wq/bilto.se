/*
  # Utökade fält för handlaransökan

  1. Ändrade tabeller
    - `dealers`
      - Lägger till `fornamn` (text) - kontaktpersonens förnamn
      - Lägger till `efternamn` (text) - kontaktpersonens efternamn
      - Lägger till `faktura_epost` (text) - faktura e-postadress
      - Lägger till `moderbolag` (text) - namn på moderbolag
      - Lägger till `adresser` (jsonb) - lista med anläggningsadresser
      - Lägger till `organisationsnummer` (jsonb) - lista med ytterligare orgnr

  2. Säkerhet
    - Befintliga RLS-policies gäller fortsatt; inga nya policies behövs
    - Alla nya kolumner har säkra defaultvärden (tom sträng / tom array)

  3. Viktigt
    - Migrationen är bakåtkompatibel och förstör ingen data
    - De nya kolumnerna är valfria och har defaultvärden
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealers' AND column_name = 'fornamn'
  ) THEN
    ALTER TABLE dealers ADD COLUMN fornamn text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealers' AND column_name = 'efternamn'
  ) THEN
    ALTER TABLE dealers ADD COLUMN efternamn text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealers' AND column_name = 'faktura_epost'
  ) THEN
    ALTER TABLE dealers ADD COLUMN faktura_epost text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealers' AND column_name = 'moderbolag'
  ) THEN
    ALTER TABLE dealers ADD COLUMN moderbolag text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealers' AND column_name = 'adresser'
  ) THEN
    ALTER TABLE dealers ADD COLUMN adresser jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealers' AND column_name = 'organisationsnummer'
  ) THEN
    ALTER TABLE dealers ADD COLUMN organisationsnummer jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;
