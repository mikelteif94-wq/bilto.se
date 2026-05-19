/*
  # Lead Command Center - New Tables

  Adds the following tables needed for the Lead Command Center,
  Dealer Dispatch system, and enhanced CRM functionality:

  1. New columns on existing tables:
     - cars: assigned_to, assigned_to_name, next_activity_at, deadline_at, tags, lead_type
     - dealers: risk_score, win_count, lost_count, avg_response_minutes, conversion_rate, total_invoiced_kr

  2. New tables:
     - dealer_dispatches: tracks which dealers received a lead/car, their response status and timing
     - dispatch_rules: automatic matching rules (brand/region/budget → dealer list)
     - dealer_invoices: invoice and commission tracking per dealer
     - communication_templates: reusable SMS/email templates with variables

  3. Security: RLS enabled on all new tables
*/

-- ─── Extend cars table ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='assigned_to') THEN
    ALTER TABLE cars ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='assigned_to_name') THEN
    ALTER TABLE cars ADD COLUMN assigned_to_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='next_activity_at') THEN
    ALTER TABLE cars ADD COLUMN next_activity_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='deadline_at') THEN
    ALTER TABLE cars ADD COLUMN deadline_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='tags') THEN
    ALTER TABLE cars ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='lead_type') THEN
    -- sell, buy, trade_in, brokerage
    ALTER TABLE cars ADD COLUMN lead_type text NOT NULL DEFAULT 'sell';
  END IF;
END $$;

-- ─── Extend quote_requests table ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='assigned_to') THEN
    ALTER TABLE quote_requests ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='assigned_to_name') THEN
    ALTER TABLE quote_requests ADD COLUMN assigned_to_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='next_activity_at') THEN
    ALTER TABLE quote_requests ADD COLUMN next_activity_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='deadline_at') THEN
    ALTER TABLE quote_requests ADD COLUMN deadline_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='tags') THEN
    ALTER TABLE quote_requests ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- ─── Extend dealers table ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealers' AND column_name='risk_score') THEN
    -- 0-100, higher = more risk
    ALTER TABLE dealers ADD COLUMN risk_score integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealers' AND column_name='win_count') THEN
    ALTER TABLE dealers ADD COLUMN win_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealers' AND column_name='lost_count') THEN
    ALTER TABLE dealers ADD COLUMN lost_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealers' AND column_name='avg_response_minutes') THEN
    ALTER TABLE dealers ADD COLUMN avg_response_minutes integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealers' AND column_name='conversion_rate') THEN
    ALTER TABLE dealers ADD COLUMN conversion_rate numeric(5,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealers' AND column_name='total_invoiced_kr') THEN
    ALTER TABLE dealers ADD COLUMN total_invoiced_kr integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ─── dealer_dispatches ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealer_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- reference to either a car (sell lead) or quote_request (buy lead)
  car_id uuid REFERENCES cars(id) ON DELETE CASCADE,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  -- opened, read, replied, ignored, offered
  response_status text NOT NULL DEFAULT 'sent',
  opened_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  offered_at timestamptz,
  -- time dealer had to respond (hours)
  response_deadline_hours integer NOT NULL DEFAULT 24,
  deadline_at timestamptz,
  -- admin who dispatched
  dispatched_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispatched_by_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  -- ensure one dispatch per dealer per item
  CONSTRAINT dealer_dispatches_unique UNIQUE (car_id, quote_request_id, dealer_id)
);

ALTER TABLE dealer_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage dispatches"
  ON dealer_dispatches FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can insert dispatches"
  ON dealer_dispatches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update dispatches"
  ON dealer_dispatches FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Dealers can view their own dispatches"
  ON dealer_dispatches FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "Dealers can update their own dispatch status"
  ON dealer_dispatches FOR UPDATE
  TO authenticated
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS dealer_dispatches_car_id_idx ON dealer_dispatches(car_id);
CREATE INDEX IF NOT EXISTS dealer_dispatches_quote_request_id_idx ON dealer_dispatches(quote_request_id);
CREATE INDEX IF NOT EXISTS dealer_dispatches_dealer_id_idx ON dealer_dispatches(dealer_id);

-- ─── dispatch_rules ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispatch_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  -- conditions (all optional, null = match any)
  match_brands text[],          -- ['BMW', 'Mercedes']
  match_lead_types text[],      -- ['buy', 'sell', 'trade_in']
  match_regions text[],         -- ['Stockholm', 'Göteborg']
  budget_min integer,           -- SEK
  budget_max integer,
  -- target dealers
  dealer_ids uuid[] NOT NULL DEFAULT '{}',
  response_deadline_hours integer NOT NULL DEFAULT 24,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dispatch_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage dispatch rules"
  ON dispatch_rules FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert dispatch rules"
  ON dispatch_rules FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update dispatch rules"
  ON dispatch_rules FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete dispatch rules"
  ON dispatch_rules FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ─── dealer_invoices ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealer_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  car_id uuid REFERENCES cars(id) ON DELETE SET NULL,
  -- pending, invoiced, paid, overdue, cancelled
  status text NOT NULL DEFAULT 'pending',
  amount_kr integer NOT NULL DEFAULT 0,
  -- commission, platform_fee, other
  invoice_type text NOT NULL DEFAULT 'commission',
  description text NOT NULL DEFAULT '',
  invoice_number text,
  invoice_date date,
  due_date date,
  paid_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dealer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoices"
  ON dealer_invoices FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert invoices"
  ON dealer_invoices FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update invoices"
  ON dealer_invoices FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Dealers can view own invoices"
  ON dealer_invoices FOR SELECT
  TO authenticated
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS dealer_invoices_dealer_id_idx ON dealer_invoices(dealer_id);
CREATE INDEX IF NOT EXISTS dealer_invoices_status_idx ON dealer_invoices(status);

-- ─── communication_templates ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  -- sms, email, push
  channel text NOT NULL DEFAULT 'email',
  -- customer, dealer, admin
  recipient_type text NOT NULL DEFAULT 'customer',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  -- available variables documented as array, e.g. ['{kundnamn}', '{bilmodell}']
  variables text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON communication_templates FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert templates"
  ON communication_templates FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update templates"
  ON communication_templates FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete templates"
  ON communication_templates FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ─── Seed default communication templates ─────────────────────────────────────
INSERT INTO communication_templates (name, channel, recipient_type, subject, body, variables)
VALUES
  ('Säljbud inkom', 'email', 'customer',
   'Nytt bud på din {bilmodell}',
   'Hej {kundnamn}!\n\nVi har fått ett bud på {belopp} kr för din {bilmodell}.\n\nLogga in för att se budet och ta beslut:\n{länk}\n\nMed vänlig hälsning,\nBilto-teamet',
   ARRAY['{kundnamn}', '{bilmodell}', '{belopp}', '{länk}']),

  ('Du har vunnit auktionen', 'email', 'dealer',
   'Grattis – du vann auktionen på {bilmodell}',
   'Hej {handlarnamn}!\n\nDitt bud på {belopp} kr har vunnit auktionen för {bilmodell} ({regnummer}).\n\nVi återkommer med nästa steg.\n\nMed vänlig hälsning,\nBilto-teamet',
   ARRAY['{handlarnamn}', '{bilmodell}', '{regnummer}', '{belopp}']),

  ('Komplettera bilder', 'email', 'customer',
   'Vi behöver fler bilder på din {bilmodell}',
   'Hej {kundnamn}!\n\nFör att kunna visa din {bilmodell} för handlare behöver vi fler bilder.\n\nLadda upp via länken:\n{länk}\n\nMed vänlig hälsning,\nBilto-teamet',
   ARRAY['{kundnamn}', '{bilmodell}', '{länk}']),

  ('Vi hittade en bil', 'email', 'customer',
   'Vi har hittat din bil – {bilmodell}',
   'Hej {kundnamn}!\n\nVi har hittat en {bilmodell} som matchar dina önskemål!\n\nSe erbjudandet här:\n{länk}\n\nMed vänlig hälsning,\nBilto-teamet',
   ARRAY['{kundnamn}', '{bilmodell}', '{länk}']),

  ('Nytt lead – agera nu', 'sms', 'dealer',
   '',
   'Bilto: Nytt lead – {bilmodell} sökes, budget {budget} kr. Svara inom {deadline}h. Se: {länk}',
   ARRAY['{bilmodell}', '{budget}', '{deadline}', '{länk}']),

  ('Du blev överbjuden', 'sms', 'dealer',
   '',
   'Bilto: Du blev överbjuden på {bilmodell} ({regnummer}). Nuvarande bud: {belopp} kr. Lägg nytt bud: {länk}',
   ARRAY['{bilmodell}', '{regnummer}', '{belopp}', '{länk}'])
ON CONFLICT DO NOTHING;
