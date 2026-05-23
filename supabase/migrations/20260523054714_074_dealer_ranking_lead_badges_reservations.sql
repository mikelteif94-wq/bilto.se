/*
  # Dealer Ranking, Lead Quality Badges & Lead Reservations

  ## Summary
  Implements the Growth Engine foundation:
  1. Dealer scoring & tier system (Guld/Silver/Brons/Ny)
  2. Quality badges on cars and quote_requests
  3. Lead reservations table (30 min exclusivity window)
  4. Automatic score recalculation trigger

  ## Changes
  - dealers: bilto_score, tier, response_score, hitrate_score, activity_score, payment_score, score_updated_at
  - cars: quality_badges (text[])
  - quote_requests: quality_badges (text[])
  - New table: lead_reservations
  - New function: calculate_dealer_score(uuid)
  - Triggers on dealers and dealer_invoices
*/

-- ── 1. Dealer scoring columns ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'bilto_score') THEN
    ALTER TABLE dealers ADD COLUMN bilto_score integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'tier') THEN
    ALTER TABLE dealers ADD COLUMN tier text NOT NULL DEFAULT 'ny';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'response_score') THEN
    ALTER TABLE dealers ADD COLUMN response_score integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'hitrate_score') THEN
    ALTER TABLE dealers ADD COLUMN hitrate_score integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'activity_score') THEN
    ALTER TABLE dealers ADD COLUMN activity_score integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'payment_score') THEN
    ALTER TABLE dealers ADD COLUMN payment_score integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'score_updated_at') THEN
    ALTER TABLE dealers ADD COLUMN score_updated_at timestamptz;
  END IF;
END $$;

-- ── 2. Quality badges ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'quality_badges') THEN
    ALTER TABLE cars ADD COLUMN quality_badges text[] NOT NULL DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_requests' AND column_name = 'quality_badges') THEN
    ALTER TABLE quote_requests ADD COLUMN quality_badges text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- ── 3. Lead reservations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  car_id uuid REFERENCES cars(id) ON DELETE CASCADE,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  extended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_reservations_target_check CHECK (
    (car_id IS NOT NULL AND quote_request_id IS NULL) OR
    (car_id IS NULL AND quote_request_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS lead_reservations_car_idx ON lead_reservations (car_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS lead_reservations_quote_idx ON lead_reservations (quote_request_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS lead_reservations_dealer_idx ON lead_reservations (dealer_id);
CREATE INDEX IF NOT EXISTS lead_reservations_expires_idx ON lead_reservations (expires_at);

ALTER TABLE lead_reservations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reservations' AND policyname = 'Dealers can view reservations') THEN
    CREATE POLICY "Dealers can view reservations"
      ON lead_reservations FOR SELECT
      TO authenticated
      USING (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reservations' AND policyname = 'Dealers can insert own reservations') THEN
    CREATE POLICY "Dealers can insert own reservations"
      ON lead_reservations FOR INSERT
      TO authenticated
      WITH CHECK (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reservations' AND policyname = 'Dealers can update own reservations') THEN
    CREATE POLICY "Dealers can update own reservations"
      ON lead_reservations FOR UPDATE
      TO authenticated
      USING (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 4. Score calculation function ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_dealer_score(p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_response numeric;
  v_win_count integer;
  v_lost_count integer;
  v_bid_count_30d integer;
  v_paid_invoices integer;
  v_overdue_invoices integer;
  v_response_score integer;
  v_hitrate_score integer;
  v_activity_score integer;
  v_payment_score integer;
  v_total integer;
  v_tier text;
BEGIN
  SELECT COALESCE(avg_response_minutes, 999),
         COALESCE(win_count, 0),
         COALESCE(lost_count, 0)
  INTO v_avg_response, v_win_count, v_lost_count
  FROM dealers WHERE id = p_dealer_id;

  -- Response score (0-25)
  v_response_score := CASE
    WHEN v_avg_response < 30  THEN 25
    WHEN v_avg_response < 60  THEN 20
    WHEN v_avg_response < 120 THEN 15
    WHEN v_avg_response < 240 THEN 10
    WHEN v_avg_response < 480 THEN 5
    ELSE 0
  END;

  -- Hit-rate score (0-25)
  v_hitrate_score := CASE
    WHEN (v_win_count + v_lost_count) = 0 THEN 0
    ELSE LEAST(25, ROUND(25.0 * v_win_count / (v_win_count + v_lost_count))::integer)
  END;

  -- Activity score (0-25): bids in last 30 days, capped at 25
  SELECT COUNT(*) INTO v_bid_count_30d
  FROM bids
  WHERE dealer_id = p_dealer_id
    AND created_at > now() - interval '30 days';
  v_activity_score := LEAST(25, v_bid_count_30d * 2);

  -- Payment score (0-25)
  SELECT
    COUNT(*) FILTER (WHERE status = 'paid'),
    COUNT(*) FILTER (WHERE status = 'overdue')
  INTO v_paid_invoices, v_overdue_invoices
  FROM dealer_invoices
  WHERE dealer_id = p_dealer_id AND status != 'cancelled';

  v_payment_score := CASE
    WHEN v_overdue_invoices > 0 THEN GREATEST(0, 15 - v_overdue_invoices * 5)
    WHEN v_paid_invoices = 0    THEN 10
    ELSE 25
  END;

  v_total := v_response_score + v_hitrate_score + v_activity_score + v_payment_score;

  v_tier := CASE
    WHEN v_total >= 70 THEN 'guld'
    WHEN v_total >= 45 THEN 'silver'
    WHEN v_total >= 20 THEN 'brons'
    ELSE 'ny'
  END;

  UPDATE dealers SET
    bilto_score    = v_total,
    tier           = v_tier,
    response_score = v_response_score,
    hitrate_score  = v_hitrate_score,
    activity_score = v_activity_score,
    payment_score  = v_payment_score,
    score_updated_at = now()
  WHERE id = p_dealer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_dealer_score(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_dealer_score(uuid) TO authenticated;

-- Trigger: recalculate on dealer stat changes
CREATE OR REPLACE FUNCTION trigger_recalc_dealer_score()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM calculate_dealer_score(NEW.id);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dealers_score_recalc') THEN
    CREATE TRIGGER dealers_score_recalc
      AFTER UPDATE OF win_count, lost_count, avg_response_minutes, conversion_rate
      ON dealers FOR EACH ROW
      EXECUTE FUNCTION trigger_recalc_dealer_score();
  END IF;
END $$;

-- Trigger: recalculate when invoice paid/overdue
CREATE OR REPLACE FUNCTION trigger_invoice_score_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('paid', 'overdue') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM calculate_dealer_score(NEW.dealer_id);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'invoices_score_recalc') THEN
    CREATE TRIGGER invoices_score_recalc
      AFTER UPDATE OF status ON dealer_invoices
      FOR EACH ROW
      EXECUTE FUNCTION trigger_invoice_score_update();
  END IF;
END $$;

-- Backfill scores for existing approved dealers
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM dealers WHERE godkand = true LOOP
    PERFORM calculate_dealer_score(r.id);
  END LOOP;
END $$;
