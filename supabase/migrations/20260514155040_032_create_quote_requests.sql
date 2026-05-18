/*
  # Skapa quote_requests-tabell f\u00f6r f\u00f6rhandlings- och inbytestj\u00e4nst

  1. Ny tabell `quote_requests`
    Lagrar f\u00f6rfr\u00e5gningar fr\u00e5n det publika trestegs-formul\u00e4ret d\u00e4r kunden v\u00e4ljer att
    f\u00e5 hj\u00e4lp att hitta bil, f\u00f6rhandla en bil de hittat, eller byta in sin bil.

    Kolumner:
      - id (uuid)
      - created_at (timestamptz)
      - search_option (text): 'searching' | 'found' | 'trade'
      - regnummer (text)
      - miltal (int)
      - buying_stage (text)
      - budget (text)
      - payment_type (text)
      - monthly_payment (text)
      - car_model (text)
      - fuel_type (text)
      - link_or_seller (text): annonsl\u00e4nk eller s\u00e4ljarens kontakt
      - target_car (text): vad kunden vill byta till
      - additional_requests (text)
      - firstname (text)
      - lastname (text)
      - email (text)
      - phone (text)
      - preferred_time (text)
      - status (text): 'new' | 'contacted' | 'won' | 'lost'
      - handled_by (uuid)
      - notes (text)

  2. S\u00e4kerhet
    - RLS aktiverat
    - Anon och authenticated f\u00e5r INSERT (publikt formul\u00e4r)
    - Endast authenticated f\u00e5r SELECT/UPDATE/DELETE (admin)
*/

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  search_option text NOT NULL DEFAULT 'searching',
  regnummer text NOT NULL DEFAULT '',
  miltal integer NOT NULL DEFAULT 0,
  buying_stage text NOT NULL DEFAULT '',
  budget text NOT NULL DEFAULT '',
  payment_type text NOT NULL DEFAULT '',
  monthly_payment text NOT NULL DEFAULT '',
  car_model text NOT NULL DEFAULT '',
  fuel_type text NOT NULL DEFAULT '',
  link_or_seller text NOT NULL DEFAULT '',
  target_car text NOT NULL DEFAULT '',
  additional_requests text NOT NULL DEFAULT '',
  firstname text NOT NULL DEFAULT '',
  lastname text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  preferred_time text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  handled_by uuid,
  notes text NOT NULL DEFAULT ''
);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='Anyone can create a quote request'
  ) THEN
    CREATE POLICY "Anyone can create a quote request"
      ON quote_requests FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='Authenticated can read quote requests'
  ) THEN
    CREATE POLICY "Authenticated can read quote requests"
      ON quote_requests FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='Authenticated can update quote requests'
  ) THEN
    CREATE POLICY "Authenticated can update quote requests"
      ON quote_requests FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='quote_requests' AND policyname='Authenticated can delete quote requests'
  ) THEN
    CREATE POLICY "Authenticated can delete quote requests"
      ON quote_requests FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS quote_requests_created_at_idx ON quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests(status);
