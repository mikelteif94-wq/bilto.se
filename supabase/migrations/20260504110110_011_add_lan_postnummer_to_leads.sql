/*
  # Lägg till län och postnummer på leads

  1. Ändringar
    - Lägger till `lan` (text) på `leads` för att spara kundens län från hero-formuläret
    - Lägger till `postnummer` (text) på `leads` för att spara kundens postnummer
    - Båda kolumnerna är nullable med tomsträng som default för bakåtkompatibilitet

  2. Säkerhet
    - Inga ändringar i RLS-policies. Befintliga policies täcker de nya kolumnerna.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'lan'
  ) THEN
    ALTER TABLE leads ADD COLUMN lan text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'postnummer'
  ) THEN
    ALTER TABLE leads ADD COLUMN postnummer text NOT NULL DEFAULT '';
  END IF;
END $$;
