CREATE TABLE IF NOT EXISTS consultation_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  syfte text NOT NULL DEFAULT '',
  namn text NOT NULL,
  telefon text NOT NULL,
  email text NOT NULL DEFAULT '',
  meddelande text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text NOT NULL DEFAULT ''
);

ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_consultation_bookings" ON consultation_bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_consultation_bookings" ON consultation_bookings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "admin_update_consultation_bookings" ON consultation_bookings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
