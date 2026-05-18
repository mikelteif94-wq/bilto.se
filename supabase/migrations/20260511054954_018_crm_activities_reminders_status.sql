/*
  # CRM: aktiviteter, påminnelser, utökad status

  1. Ändringar i befintliga tabeller
    - `cars`
      - Ny kolumn `crm_status` (text) för CRM-specifik pipeline-status (het, fundera,
        aterkomma, missnoejd_bud, hitta_bil_forst, ringa_upp, sald, forlorad). Kvarstår
        vid sidan av den operativa `status`-kolumnen.
      - Ny kolumn `crm_status_updated_at` (timestamptz).

  2. Nya tabeller
    - `car_activities`
      - `id` (uuid)
      - `car_id` (uuid, FK -> cars, cascade)
      - `type` (text) - ett av: note, call, bid, status_change, lead_sent, reminder
      - `title` (text) - kort rubrik
      - `body` (text) - valfri utförligare text
      - `data` (jsonb) - valfri strukturerad data (t.ex. bud-belopp, mottagare)
      - `created_by` (uuid, FK -> auth.users)
      - `created_by_name` (text) - snapshot av admins namn
      - `created_at` (timestamptz)

    - `car_reminders`
      - `id` (uuid)
      - `car_id` (uuid, FK -> cars, cascade)
      - `remind_at` (timestamptz)
      - `title` (text)
      - `done` (boolean, default false)
      - `done_at` (timestamptz)
      - `created_by` (uuid)
      - `created_by_name` (text)
      - `created_at` (timestamptz)

  3. Säkerhet
    - RLS på båda nya tabellerna
    - Endast authenticated admins (finns i admin_users) får full läs/skriv-access
*/

ALTER TABLE cars ADD COLUMN IF NOT EXISTS crm_status text;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS crm_status_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS car_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_activities_car_id ON car_activities(car_id, created_at DESC);

ALTER TABLE car_activities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS car_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  title text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_reminders_car_id ON car_reminders(car_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_car_reminders_open ON car_reminders(remind_at) WHERE done = false;

ALTER TABLE car_reminders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_activities' AND policyname='Admins can select activities') THEN
    CREATE POLICY "Admins can select activities"
      ON car_activities FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_activities' AND policyname='Admins can insert activities') THEN
    CREATE POLICY "Admins can insert activities"
      ON car_activities FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_activities' AND policyname='Admins can update activities') THEN
    CREATE POLICY "Admins can update activities"
      ON car_activities FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_activities' AND policyname='Admins can delete activities') THEN
    CREATE POLICY "Admins can delete activities"
      ON car_activities FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_reminders' AND policyname='Admins can select reminders') THEN
    CREATE POLICY "Admins can select reminders"
      ON car_reminders FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_reminders' AND policyname='Admins can insert reminders') THEN
    CREATE POLICY "Admins can insert reminders"
      ON car_reminders FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_reminders' AND policyname='Admins can update reminders') THEN
    CREATE POLICY "Admins can update reminders"
      ON car_reminders FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_reminders' AND policyname='Admins can delete reminders') THEN
    CREATE POLICY "Admins can delete reminders"
      ON car_reminders FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
