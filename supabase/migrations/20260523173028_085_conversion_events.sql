/*
  # Conversion Events Table

  Tracks the key funnel steps for the buy flow:
    drawer_opened   — user opened BuyDrawer
    form_submitted  — user completed and submitted the form
    portal_clicked  — user clicked "Följ mitt ärende" on the done screen

  ## Columns
  - event        : which funnel step
  - session_id   : random UUID generated client-side per browser session
  - track        : found / searching / trade
  - car          : car name if any (nullable)
  - quote_request_id : linked quote_request if form was submitted (nullable)
  - source       : where on the page the drawer was opened from
  - created_at

  ## Security
  - RLS enabled, anon INSERT only (no reads from client)
  - Reads are restricted to service_role (admin queries only)
*/

CREATE TABLE IF NOT EXISTS conversion_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event             text NOT NULL,
  session_id        uuid NOT NULL,
  track             text DEFAULT '',
  car               text DEFAULT '',
  quote_request_id  uuid REFERENCES quote_requests(id) ON DELETE SET NULL,
  source            text DEFAULT '',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- Anon and authenticated can INSERT (funnel tracking from browser)
CREATE POLICY "Anyone can insert conversion events"
  ON conversion_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service_role can read (admin analytics)
-- No SELECT policy for anon/authenticated means they cannot read

CREATE INDEX IF NOT EXISTS conversion_events_event_idx ON conversion_events(event);
CREATE INDEX IF NOT EXISTS conversion_events_session_idx ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS conversion_events_created_idx ON conversion_events(created_at);
