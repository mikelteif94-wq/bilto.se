/*
  # Logg för utskickade notiser

  1. Ny tabell
    - `notifications_log` — registrerar varje mejl vi skickar
      - `id` (uuid, primary key)
      - `typ` (text) — t.ex. `ny_bil_aktiv`, `ny_bil`, `handlare_godkand`
      - `mottagare_mejl` (text) — mottagarens mejladress
      - `skickat_at` (timestamptz, default now())
      - `status` (text, default 'sent') — `sent` | `failed`
      - `referens_id` (uuid, nullable) — valfri referens t.ex. car_id
      - `detaljer` (text, default '') — valfri extra info vid fel

  2. Säkerhet
    - RLS aktiveras.
    - Endast authenticated (admin) kan läsa loggen. Skrivning sker via
      edge functions med service_role som bypassar RLS.
*/

CREATE TABLE IF NOT EXISTS notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typ text NOT NULL DEFAULT '',
  mottagare_mejl text NOT NULL DEFAULT '',
  skickat_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  referens_id uuid,
  detaljer text NOT NULL DEFAULT ''
);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS notifications_log_typ_idx ON notifications_log(typ);
CREATE INDEX IF NOT EXISTS notifications_log_referens_id_idx ON notifications_log(referens_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='notifications_log' AND policyname='Admins can read notifications log'
  ) THEN
    CREATE POLICY "Admins can read notifications log"
      ON notifications_log FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
