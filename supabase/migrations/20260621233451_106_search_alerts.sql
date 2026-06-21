CREATE TABLE IF NOT EXISTS search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  label text,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz
);

ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_search_alerts" ON search_alerts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admin_select_search_alerts" ON search_alerts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
