/*
  # Tillåt inloggade användare att lämna in handlaransökningar

  1. Bakgrund
    - Tidigare tillät endast `anon`-rollen att skapa handlaransökningar utan inloggning
    - Inloggade användare (t.ex. en kund som redan har konto) blockerades av RLS
      när de försökte fylla i handlarformuläret eftersom existerande policy
      "Dealers can register themselves" kräver auth.uid() = user_id

  2. Ändringar
    - Lägg till en INSERT-policy för rollen `authenticated` som tillåter
      inlämning av en ansökan med user_id = null och godkand = false
    - Detta speglar den befintliga anonyma policyn men för inloggade besökare
    - Ansökan markeras alltid som ej godkänd och kopplas till user_id manuellt
      av admin när handlaren godkänns

  3. Säkerhet
    - RLS är fortsatt aktivt på dealers-tabellen
    - Endast osignerade ansökningar (user_id null, godkand false) får skapas
    - Befintliga policys för läsning, uppdatering och admin-åtkomst är oförändrade
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dealers'
      AND policyname = 'Authenticated can submit dealer application'
  ) THEN
    CREATE POLICY "Authenticated can submit dealer application"
      ON dealers
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id IS NULL AND godkand = false);
  END IF;
END $$;
