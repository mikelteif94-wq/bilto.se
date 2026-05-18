/*
  # Lägg till förmedlingsspår (brokerage)

  1. Ändringar i cars
    - `sales_type` text default 'auction' – 'auction' eller 'brokerage'
    - `direct_bid_estimate` int – estimerat direkt-bud (snabbsälj)
    - `brokerage_estimate_low` int – lägre gräns förväntat förmedlingspris
    - `brokerage_estimate_high` int – övre gräns förväntat förmedlingspris

  2. Ny tabell brokerage_offers
    - Handlare tävlar med förväntat pris + arvode + tid
    - Kund ser netto till kund och kan acceptera

  3. Säkerhet
    - RLS aktiverat
    - Handlare ser/skapar/uppdaterar sina egna erbjudanden
    - Admin (service role) ser allt
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'sales_type'
  ) THEN
    ALTER TABLE cars ADD COLUMN sales_type text NOT NULL DEFAULT 'auction';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'direct_bid_estimate'
  ) THEN
    ALTER TABLE cars ADD COLUMN direct_bid_estimate int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'brokerage_estimate_low'
  ) THEN
    ALTER TABLE cars ADD COLUMN brokerage_estimate_low int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'brokerage_estimate_high'
  ) THEN
    ALTER TABLE cars ADD COLUMN brokerage_estimate_high int;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS brokerage_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  expected_sale_price int NOT NULL,
  commission_kr int NOT NULL,
  estimated_days int NOT NULL,
  kommentar text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brokerage_offers_car_id_idx ON brokerage_offers(car_id);
CREATE INDEX IF NOT EXISTS brokerage_offers_dealer_id_idx ON brokerage_offers(dealer_id);

ALTER TABLE brokerage_offers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brokerage_offers' AND policyname = 'Dealers can view own offers'
  ) THEN
    CREATE POLICY "Dealers can view own offers"
      ON brokerage_offers FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM dealers
          WHERE dealers.id = brokerage_offers.dealer_id
          AND dealers.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brokerage_offers' AND policyname = 'Dealers can view offers on brokerage cars'
  ) THEN
    CREATE POLICY "Dealers can view offers on brokerage cars"
      ON brokerage_offers FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cars
          WHERE cars.id = brokerage_offers.car_id
          AND cars.sales_type = 'brokerage'
        )
        AND EXISTS (
          SELECT 1 FROM dealers
          WHERE dealers.user_id = auth.uid()
          AND dealers.godkand = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brokerage_offers' AND policyname = 'Dealers can insert own offers'
  ) THEN
    CREATE POLICY "Dealers can insert own offers"
      ON brokerage_offers FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM dealers
          WHERE dealers.id = brokerage_offers.dealer_id
          AND dealers.user_id = auth.uid()
          AND dealers.godkand = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brokerage_offers' AND policyname = 'Dealers can update own offers'
  ) THEN
    CREATE POLICY "Dealers can update own offers"
      ON brokerage_offers FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM dealers
          WHERE dealers.id = brokerage_offers.dealer_id
          AND dealers.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM dealers
          WHERE dealers.id = brokerage_offers.dealer_id
          AND dealers.user_id = auth.uid()
        )
      );
  END IF;
END $$;
