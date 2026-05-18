/*
  # Värderingsförfrågningar mellan admins + förlorad-anledning

  1. Ändringar
    - `cars`: ny kolumn `crm_lost_reason` (text) för anledningen när status sätts
      till 'forlorad'.

  2. Ny tabell
    - `valuation_requests` - en admin kan be en annan admin värdera en bil
      - `id` (uuid)
      - `car_id` (uuid, FK -> cars, cascade)
      - `from_user_id` (uuid, FK -> auth.users)
      - `from_user_name` (text) snapshot
      - `to_user_id` (uuid, FK -> auth.users)
      - `to_user_name` (text) snapshot
      - `message` (text) - varför vill den be den andra värdera
      - `status` (text) - 'open', 'answered', 'cancelled'
      - `response_value` (integer) - kronor värderingen
      - `response_expected_sale` (integer) - förväntat utpris
      - `response_comment` (text)
      - `responded_at` (timestamptz)
      - `created_at` (timestamptz)

  3. Säkerhet
    - RLS aktiverat, policies begränsar till admins (via admin_users-tabellen)
*/

ALTER TABLE cars ADD COLUMN IF NOT EXISTS crm_lost_reason text;

CREATE TABLE IF NOT EXISTS valuation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_user_name text NOT NULL DEFAULT '',
  to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  response_value integer,
  response_expected_sale integer,
  response_comment text NOT NULL DEFAULT '',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valuation_requests_car ON valuation_requests(car_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_valuation_requests_to_open ON valuation_requests(to_user_id) WHERE status = 'open';

ALTER TABLE valuation_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='valuation_requests' AND policyname='Admins can select valuation requests') THEN
    CREATE POLICY "Admins can select valuation requests"
      ON valuation_requests FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='valuation_requests' AND policyname='Admins can insert valuation requests') THEN
    CREATE POLICY "Admins can insert valuation requests"
      ON valuation_requests FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='valuation_requests' AND policyname='Admins can update valuation requests') THEN
    CREATE POLICY "Admins can update valuation requests"
      ON valuation_requests FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='valuation_requests' AND policyname='Admins can delete valuation requests') THEN
    CREATE POLICY "Admins can delete valuation requests"
      ON valuation_requests FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
