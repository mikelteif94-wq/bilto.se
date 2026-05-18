/*
  # Token-utgångstid och åtkomstlogg för customer-car

  1. Ändringar
    - Lägger till `access_token_expires_at` (timestamptz) på cars med default
      `created_at + interval '180 days'` för befintliga rader så att inga aktiva
      länkar bryts.
    - Lägger till `access_token_revoked_at` (timestamptz) för manuell återkallning.
    - Skapar `customer_token_access_log` som loggar varje GET via customer-car
      edge function (referens_id = car_id).
    - RLS aktiverat. Endast admin (admin_users) kan läsa loggen. Edge functions
      skriver via service_role och bypassar RLS.

  2. Säkerhet
    - Inga befintliga data ändras; nya kolumner är nullable.
    - Alla policies kräver att användaren är admin för read/write.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'access_token_expires_at'
  ) THEN
    ALTER TABLE cars ADD COLUMN access_token_expires_at timestamptz;
    UPDATE cars
      SET access_token_expires_at = created_at + interval '180 days'
      WHERE access_token IS NOT NULL AND access_token_expires_at IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'access_token_revoked_at'
  ) THEN
    ALTER TABLE cars ADD COLUMN access_token_revoked_at timestamptz;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS customer_token_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES cars(id) ON DELETE CASCADE,
  ip text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_token_access_log_car_id
  ON customer_token_access_log(car_id);

ALTER TABLE customer_token_access_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customer_token_access_log' AND policyname='Admins can read token access log') THEN
    CREATE POLICY "Admins can read token access log"
      ON customer_token_access_log FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
