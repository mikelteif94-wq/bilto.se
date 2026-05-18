/*
  # Admin-åtkomst till handlare

  1. Ändringar
    - Lägger till policies så att authenticated användare (admin) kan läsa
      och uppdatera alla rader i `dealers`. Detta följer samma permissiva
      mönster som redan finns för `cars` och `customers` i admin-panelen.

  2. Säkerhet
    - Policies är begränsade till `authenticated` (inte `anon`).
    - Existerande självservice-policies för handlare behålls oförändrade.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dealers' AND policyname='Admins can read all dealers') THEN
    CREATE POLICY "Admins can read all dealers"
      ON dealers FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dealers' AND policyname='Admins can update all dealers') THEN
    CREATE POLICY "Admins can update all dealers"
      ON dealers FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
