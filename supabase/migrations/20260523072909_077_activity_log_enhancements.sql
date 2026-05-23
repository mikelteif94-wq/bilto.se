/*
  # Activity Log Enhancements

  ## Summary
  Extends the activity/timeline system to support the full lead lifecycle across both
  car listings (sell flow) and quote requests (buy/trade flow).

  ## Changes

  ### 1. Extended car_activities
  - Adds `source` column (admin / system / dealer / customer)
  - Adds `actor_type` column  
  - Adds `actor_id` column (uuid of actor)

  ### 2. New table: quote_request_activities
  Mirrors car_activities but scoped to quote_requests. Same activity types:
  note, call, status_change, lead_sent, reminder, dispatch, dispatch_opened,
  dispatch_replied, bid_placed, portal_viewed, customer_decision, nudge,
  auto_dispatch, system

  ### 3. New table: quote_request_reminders
  Mirrors car_reminders for quote requests.

  ## Security
  - RLS enabled on all new tables (admins + service role)
*/

-- ─── Extend car_activities with richer metadata ───────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_activities' AND column_name = 'source'
  ) THEN
    ALTER TABLE car_activities ADD COLUMN source text DEFAULT 'admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_activities' AND column_name = 'actor_type'
  ) THEN
    ALTER TABLE car_activities ADD COLUMN actor_type text DEFAULT 'admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_activities' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE car_activities ADD COLUMN actor_id uuid;
  END IF;
END $$;

-- ─── quote_request_activities ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_request_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  type             text NOT NULL DEFAULT 'note',
  title            text NOT NULL DEFAULT '',
  body             text,
  data             jsonb DEFAULT '{}'::jsonb,
  source           text DEFAULT 'admin',
  actor_type       text DEFAULT 'admin',
  actor_id         uuid,
  created_by       uuid,
  created_by_name  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_request_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_qra_quote_request_id
  ON quote_request_activities(quote_request_id, created_at DESC);

CREATE POLICY "Admins can select quote_request_activities"
  ON quote_request_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid())
  );

CREATE POLICY "Admins can insert quote_request_activities"
  ON quote_request_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid())
  );

CREATE POLICY "Admins can update quote_request_activities"
  ON quote_request_activities
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "Admins can delete quote_request_activities"
  ON quote_request_activities
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "Service role can manage quote_request_activities"
  ON quote_request_activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── quote_request_reminders ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_request_reminders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  remind_at        timestamptz NOT NULL,
  title            text NOT NULL DEFAULT 'Påminnelse',
  done             boolean NOT NULL DEFAULT false,
  done_at          timestamptz,
  created_by       uuid,
  created_by_name  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_request_reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_qrr_quote_request_id
  ON quote_request_reminders(quote_request_id, remind_at);

CREATE INDEX IF NOT EXISTS idx_qrr_remind_at
  ON quote_request_reminders(remind_at)
  WHERE done = false;

CREATE POLICY "Admins can select quote_request_reminders"
  ON quote_request_reminders
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "Admins can insert quote_request_reminders"
  ON quote_request_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "Admins can update quote_request_reminders"
  ON quote_request_reminders
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "Service role can manage quote_request_reminders"
  ON quote_request_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
