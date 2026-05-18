/*
  # Lägg till handlare (dealers), bud (bids) och auktionsfält

  1. Nya tabeller
    - `dealers` — bilhandlare som kan lägga bud
      - `id` (uuid, primary key)
      - `foretagsnamn` (text) — företagets namn
      - `orgnr` (text) — organisationsnummer
      - `kontaktperson` (text)
      - `telefon` (text)
      - `mejl` (text)
      - `godkand` (bool, default false) — admin måste godkänna handlaren innan den kan lägga bud
      - `user_id` (uuid, unique) — kopplad till `auth.users.id`
      - `created_at` (timestamptz, default now())

    - `bids` — bud lagda av handlare på bilar
      - `id` (uuid, primary key)
      - `car_id` (uuid, foreign key -> cars)
      - `dealer_id` (uuid, foreign key -> dealers)
      - `belopp` (int) — budbelopp i kr
      - `kommentar` (text, default '', valfri)
      - `status` (text, default 'aktivt') — 'aktivt' | 'vinnande' | 'forlorat' | 'indraget'
      - `created_at` (timestamptz, default now())

  2. Ändringar på befintliga tabeller
    - `cars`: lagt till `auktion_slut` (timestamptz) och `vinnande_bud_id` (uuid)

  3. Säkerhet (RLS)
    - Båda nya tabellerna har RLS aktiverat.
    - `dealers`:
      1. En handlare kan läsa och uppdatera sin egen rad.
      2. Nya handlare kan registrera sig (insert) med sitt eget user_id.
      3. Godkända handlare är inte publika; endast admin (authenticated) ser alla via befintliga admin-flöden.
    - `bids`:
      1. Handlare kan SELECT endast sina egna bud (via dealer_id kopplat till user_id).
      2. Handlare kan INSERT bud för sin egen dealer, endast om dealer.godkand = true.
      3. Handlare kan inte uppdatera eller ta bort bud själva (admin hanterar detta).
    - `cars`:
      1. Lägger till en SELECT-policy som tillåter alla authenticated att läsa aktiva bilar
         (status IN ('ny','aktiv')) så handlare kan se pågående auktioner.

  4. Notering
    - Inga data raderas. Alla nya kolumner är nullable eller har defaults.
*/

CREATE TABLE IF NOT EXISTS dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  foretagsnamn text NOT NULL DEFAULT '',
  orgnr text NOT NULL DEFAULT '',
  kontaktperson text NOT NULL DEFAULT '',
  telefon text NOT NULL DEFAULT '',
  mejl text NOT NULL DEFAULT '',
  godkand boolean NOT NULL DEFAULT false,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  belopp integer NOT NULL DEFAULT 0,
  kommentar text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aktivt',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bids_car_id_idx ON bids(car_id);
CREATE INDEX IF NOT EXISTS bids_dealer_id_idx ON bids(dealer_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'auktion_slut'
  ) THEN
    ALTER TABLE cars ADD COLUMN auktion_slut timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'vinnande_bud_id'
  ) THEN
    ALTER TABLE cars ADD COLUMN vinnande_bud_id uuid REFERENCES bids(id) ON DELETE SET NULL;
  END IF;
END $$;

-- DEALERS RLS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dealers' AND policyname='Dealers can view own profile') THEN
    CREATE POLICY "Dealers can view own profile"
      ON dealers FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dealers' AND policyname='Dealers can register themselves') THEN
    CREATE POLICY "Dealers can register themselves"
      ON dealers FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id AND godkand = false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dealers' AND policyname='Dealers can update own profile') THEN
    CREATE POLICY "Dealers can update own profile"
      ON dealers FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id AND godkand = (SELECT godkand FROM dealers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- BIDS RLS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bids' AND policyname='Dealers can view own bids') THEN
    CREATE POLICY "Dealers can view own bids"
      ON bids FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM dealers d
          WHERE d.id = bids.dealer_id AND d.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bids' AND policyname='Approved dealers can place bids') THEN
    CREATE POLICY "Approved dealers can place bids"
      ON bids FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM dealers d
          WHERE d.id = bids.dealer_id
            AND d.user_id = auth.uid()
            AND d.godkand = true
        )
        AND EXISTS (
          SELECT 1 FROM cars c
          WHERE c.id = bids.car_id
            AND c.status IN ('ny','aktiv')
            AND (c.auktion_slut IS NULL OR c.auktion_slut > now())
        )
      );
  END IF;
END $$;

-- CARS: tillåt godkända handlare att läsa aktiva bilar
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cars' AND policyname='Approved dealers can view active cars') THEN
    CREATE POLICY "Approved dealers can view active cars"
      ON cars FOR SELECT
      TO authenticated
      USING (
        status IN ('ny','aktiv')
        AND EXISTS (
          SELECT 1 FROM dealers d
          WHERE d.user_id = auth.uid() AND d.godkand = true
        )
      );
  END IF;
END $$;
