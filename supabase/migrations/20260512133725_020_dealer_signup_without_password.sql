/*
  # Tillåt handlaransökan utan auth-konto

  1. Ändringar
    - Ny RLS-policy på `dealers` som låter oinloggade (anon) skicka in
      en ansökan (insert) förutsatt att `user_id` är NULL och `godkand` är false.
    - Ändrar policyn "Dealers can register themselves" till att även tillåta
      user_id = NULL (anon-flöde hanteras separat).

  2. Säkerhet
    - Anon-flödet kan endast skapa rader med user_id NULL och godkand false.
    - Efter admin godkännande skapar edge-funktion auth-användare och
      uppdaterar user_id via service role.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dealers' AND policyname='Anonymous can submit dealer application') THEN
    DROP POLICY "Anonymous can submit dealer application" ON dealers;
  END IF;

  CREATE POLICY "Anonymous can submit dealer application"
    ON dealers FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL AND godkand = false);
END $$;
