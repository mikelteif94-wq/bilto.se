/*
  # Leads-tabell för fångst från hero-formulär

  1. Ny tabell `leads`
    - `id` (uuid, pk)
    - `regnummer` (text) - bilens regnummer som kunden fyllt i
    - `telefon` (text) - kundens telefonnummer
    - `created_at` (timestamptz) - när leaden registrerades
    - `kontaktad` (boolean) - om teamet har ringt upp
    - `car_id` (uuid, nullable) - kopplas när kunden slutför formuläret

  2. Säkerhet
    - RLS aktiverat
    - Public/anon får INSERT (hero-formuläret är öppet)
    - Endast authenticated (admin) kan SELECT/UPDATE/DELETE
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regnummer text NOT NULL DEFAULT '',
  telefon text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  kontaktad boolean NOT NULL DEFAULT false,
  car_id uuid REFERENCES cars(id) ON DELETE SET NULL
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Anyone can create a lead'
  ) THEN
    CREATE POLICY "Anyone can create a lead"
      ON leads FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Authenticated can read leads'
  ) THEN
    CREATE POLICY "Authenticated can read leads"
      ON leads FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Authenticated can update leads'
  ) THEN
    CREATE POLICY "Authenticated can update leads"
      ON leads FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='Authenticated can delete leads'
  ) THEN
    CREATE POLICY "Authenticated can delete leads"
      ON leads FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
