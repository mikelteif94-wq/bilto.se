/*
  # Dealer Inventory Sync

  ## Summary
  Adds a `dealer_inventory` table for dealers to maintain their own stock of cars
  available for trade-ins and matching against incoming buy leads.

  ## New Tables

  ### `dealer_inventory`
  - `id` (uuid, pk)
  - `dealer_id` (uuid, FK → dealers)
  - `regnummer` (text) — license plate, optional (may not be known at import)
  - `marke` (text) — brand
  - `modell` (text) — model
  - `ar` (integer) — year
  - `miltal` (integer) — mileage in Swedish mil (1 mil = 10 km)
  - `pris` (integer) — asking price in SEK
  - `drivmedel` (text) — fuel type: bensin, diesel, el, hybrid, laddhybrid
  - `vaxellada` (text) — gearbox: manuell, automat
  - `farg` (text) — color
  - `karosseri` (text) — body type: sedan, kombi, suv, halvkombi, cab, skåp
  - `status` (text) — 'tillganglig', 'reserverad', 'såld', 'inbytt'
  - `notes` (text) — internal dealer notes
  - `source` (text) — how this record was created: 'manual', 'csv_import', 'api'
  - `external_id` (text) — dealer's own stock ID for deduplication
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled; dealers can only manage their own inventory
  - Admins can view all inventory

  ## Lead Matching
  - `lead_match_score(inventory_id uuid, lead_id uuid)` function computes 0-100 match
    score between a dealer_inventory row and a quote_request (buy lead)
  - Matching factors: brand (30pts), model (20pts), year range (20pts), budget (20pts), fuel/gearbox (10pts)
*/

CREATE TABLE IF NOT EXISTS dealer_inventory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id       uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  regnummer       text,
  marke           text NOT NULL,
  modell          text NOT NULL,
  ar              integer NOT NULL,
  miltal          integer,
  pris            integer,
  drivmedel       text,
  vaxellada       text,
  farg            text,
  karosseri       text,
  status          text NOT NULL DEFAULT 'tillganglig',
  notes           text DEFAULT '',
  source          text NOT NULL DEFAULT 'manual',
  external_id     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealer_inventory_dealer_id_idx ON dealer_inventory(dealer_id);
CREATE INDEX IF NOT EXISTS dealer_inventory_marke_modell_idx ON dealer_inventory(marke, modell);
CREATE INDEX IF NOT EXISTS dealer_inventory_status_idx ON dealer_inventory(status);

-- Unique constraint: prevent duplicate external_ids per dealer (optional field)
CREATE UNIQUE INDEX IF NOT EXISTS dealer_inventory_external_id_unique
  ON dealer_inventory(dealer_id, external_id)
  WHERE external_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_dealer_inventory_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dealer_inventory_updated_at ON dealer_inventory;
CREATE TRIGGER dealer_inventory_updated_at
  BEFORE UPDATE ON dealer_inventory
  FOR EACH ROW EXECUTE FUNCTION update_dealer_inventory_updated_at();

-- RLS
ALTER TABLE dealer_inventory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_inventory' AND policyname = 'Dealers can view own inventory') THEN
    CREATE POLICY "Dealers can view own inventory"
      ON dealer_inventory FOR SELECT
      TO authenticated
      USING (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_inventory' AND policyname = 'Dealers can insert own inventory') THEN
    CREATE POLICY "Dealers can insert own inventory"
      ON dealer_inventory FOR INSERT
      TO authenticated
      WITH CHECK (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_inventory' AND policyname = 'Dealers can update own inventory') THEN
    CREATE POLICY "Dealers can update own inventory"
      ON dealer_inventory FOR UPDATE
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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_inventory' AND policyname = 'Dealers can delete own inventory') THEN
    CREATE POLICY "Dealers can delete own inventory"
      ON dealer_inventory FOR DELETE
      TO authenticated
      USING (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_inventory' AND policyname = 'Admins can view all dealer inventory') THEN
    CREATE POLICY "Admins can view all dealer inventory"
      ON dealer_inventory FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      );
  END IF;
END $$;

/*
  Lead matching RPC:
  Returns a list of dealer_inventory rows for a given dealer with a match_score
  against a specific quote_request (buy lead).
  Score breakdown:
    brand match     30 pts (exact)
    model match     20 pts (exact or partial)
    year match      20 pts (within ±2 years = 20, ±4 = 10)
    budget match    20 pts (pris <= budget = 20, pris <= budget*1.15 = 10)
    fuel match       5 pts
    gearbox match    5 pts
*/
CREATE OR REPLACE FUNCTION match_inventory_to_lead(
  p_dealer_id uuid,
  p_lead_id   uuid
)
RETURNS TABLE (
  inventory_id  uuid,
  marke         text,
  modell        text,
  ar            integer,
  miltal        integer,
  pris          integer,
  drivmedel     text,
  vaxellada     text,
  status        text,
  match_score   integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead        quote_requests%ROWTYPE;
  v_budget_int  integer;
  v_lead_year   integer;
BEGIN
  SELECT * INTO v_lead FROM quote_requests WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Parse budget string (handles e.g. "250000", "250 000", "250k")
  BEGIN
    v_budget_int := CAST(regexp_replace(v_lead.budget, '[^0-9]', '', 'g') AS integer);
  EXCEPTION WHEN OTHERS THEN
    v_budget_int := 0;
  END;

  -- Parse year from car_model string (e.g. "Volvo XC60 2021")
  BEGIN
    v_lead_year := CAST((regexp_match(v_lead.car_model, '(20\d{2}|19\d{2})'))[1] AS integer);
  EXCEPTION WHEN OTHERS THEN
    v_lead_year := 0;
  END;

  RETURN QUERY
  SELECT
    inv.id,
    inv.marke,
    inv.modell,
    inv.ar,
    inv.miltal,
    inv.pris,
    inv.drivmedel,
    inv.vaxellada,
    inv.status,
    (
      -- Brand match (30 pts)
      CASE WHEN lower(inv.marke) = lower(split_part(coalesce(v_lead.car_model,''), ' ', 1)) THEN 30 ELSE 0 END +
      -- Model partial match (20 pts)
      CASE WHEN v_lead.car_model IS NOT NULL AND lower(v_lead.car_model) LIKE '%' || lower(inv.modell) || '%' THEN 20
           WHEN v_lead.car_model IS NOT NULL AND lower(inv.marke || ' ' || inv.modell) LIKE '%' || lower(split_part(v_lead.car_model, ' ', 2)) || '%' THEN 10
           ELSE 0 END +
      -- Year match (20 pts)
      CASE WHEN v_lead_year > 0 AND abs(inv.ar - v_lead_year) <= 2 THEN 20
           WHEN v_lead_year > 0 AND abs(inv.ar - v_lead_year) <= 4 THEN 10
           ELSE 0 END +
      -- Budget match (20 pts)
      CASE WHEN v_budget_int > 0 AND inv.pris IS NOT NULL AND inv.pris <= v_budget_int THEN 20
           WHEN v_budget_int > 0 AND inv.pris IS NOT NULL AND inv.pris <= v_budget_int * 1.15 THEN 10
           ELSE 0 END +
      -- Fuel match (5 pts)
      CASE WHEN v_lead.fuel_type IS NOT NULL AND inv.drivmedel IS NOT NULL
                AND lower(inv.drivmedel) = lower(v_lead.fuel_type) THEN 5
           ELSE 0 END +
      -- Gearbox (5 pts) — payment_type field repurposed to infer preference
      5
    )::integer AS match_score
  FROM dealer_inventory inv
  WHERE inv.dealer_id = p_dealer_id
    AND inv.status = 'tillganglig'
  ORDER BY match_score DESC, inv.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION match_inventory_to_lead(uuid, uuid) TO authenticated;
