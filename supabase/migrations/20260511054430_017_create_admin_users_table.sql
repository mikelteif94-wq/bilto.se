/*
  # Skapa admin_users-tabell

  1. Ny tabell
    - `admin_users`
      - `id` (uuid, primary key, kopplad till auth.users.id)
      - `name` (text) - admin-användarens namn (t.ex. Mikael, Alex)
      - `email` (text, unique) - admin-användarens e-post
      - `role` (text, default 'admin')
      - `created_at` (timestamptz)

  2. Säkerhet
    - RLS aktiverat
    - Policy: authenticated användare får läsa sin egen rad (auth.uid() = id)
    - Policy: authenticated användare får läsa alla admin-rader om de själva finns i tabellen
      (för att admins ska kunna se varandra i UI)

  3. Notering
    - Själva auth-kontona och namn/email-rader skapas separat efter denna migration.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_users' AND policyname='Admins can read own row') THEN
    CREATE POLICY "Admins can read own row"
      ON admin_users FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_users' AND policyname='Admins can read all admin rows') THEN
    CREATE POLICY "Admins can read all admin rows"
      ON admin_users FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
