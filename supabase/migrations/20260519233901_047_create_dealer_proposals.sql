/*
  # Create dealer_proposals table

  ## Purpose
  Stores structured trade-in deal proposals created by admins on behalf of dealers.
  Each proposal is linked to a customer's car (being traded in) and a dealer.
  All summary/comparison values are computed on the frontend from stored fields.

  ## New Table: dealer_proposals
  ### Columns
  1. Core relations: car_id (FK cars), dealer_id (FK dealers), dealer_name
  2. Inbytespris: inbytespris (what dealer offers for customer's car, kr)
  3. Customer context: kund_nuvarande_manad, kund_nuvarande_ranta, kund_lanerest
  4. Deal type metadata: dealtyp (lagre_manadskostnad | battre_bil_samma_kostnad | premium_byte | snabb_affar)
  5. Offered car: offered_car_id, erbjuden_marke/modell/ar/miltal/skick/dack, erbjuden_bild_urls
  6. Financing: manadskostnad, loptid_manader, ranta
  7. Extras: garanti_ar, vinterdack_inkl, personligt_meddelande
  8. Status: draft | sent | viewed, sent_at, viewed_at

  ## Security
  - RLS enabled, admin full access via admin_users.id = auth.uid()
  - Anon can read proposals for a car (customer portal access via car access_token)
  - Anon can mark proposal as viewed (restricted update)
*/

CREATE TABLE IF NOT EXISTS dealer_proposals (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id                 uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  dealer_id              uuid REFERENCES dealers(id) ON DELETE SET NULL,
  dealer_name            text NOT NULL DEFAULT '',

  inbytespris            integer NOT NULL DEFAULT 0,

  kund_nuvarande_manad   integer NOT NULL DEFAULT 0,
  kund_nuvarande_ranta   numeric(5,2) NOT NULL DEFAULT 0,
  kund_lanerest          integer NOT NULL DEFAULT 0,

  dealtyp                text NOT NULL DEFAULT 'lagre_manadskostnad',

  offered_car_id         uuid REFERENCES cars(id) ON DELETE SET NULL,
  erbjuden_marke         text NOT NULL DEFAULT '',
  erbjuden_modell        text NOT NULL DEFAULT '',
  erbjuden_ar            integer,
  erbjuden_miltal        integer,
  erbjuden_skick         text NOT NULL DEFAULT '',
  erbjuden_dack          text NOT NULL DEFAULT '',
  erbjuden_bild_urls     text[] NOT NULL DEFAULT '{}',

  manadskostnad          integer NOT NULL DEFAULT 0,
  loptid_manader         integer NOT NULL DEFAULT 36,
  ranta                  numeric(5,2) NOT NULL DEFAULT 0,

  garanti_ar             integer NOT NULL DEFAULT 0,
  vinterdack_inkl        boolean NOT NULL DEFAULT false,
  personligt_meddelande  text NOT NULL DEFAULT '',

  status                 text NOT NULL DEFAULT 'draft',
  sent_at                timestamptz,
  viewed_at              timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dealer_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read dealer proposals"
  ON dealer_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  );

CREATE POLICY "Admin can insert dealer proposals"
  ON dealer_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  );

CREATE POLICY "Admin can update dealer proposals"
  ON dealer_proposals FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

CREATE POLICY "Admin can delete dealer proposals"
  ON dealer_proposals FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  );

-- Anon customers can read proposals for their car (portal uses car access_token client-side)
CREATE POLICY "Anon can read proposals for car"
  ON dealer_proposals FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = dealer_proposals.car_id
        AND cars.access_token IS NOT NULL
        AND cars.access_token <> ''
    )
  );

-- Anon can mark proposal as viewed
CREATE POLICY "Anon can mark proposal viewed"
  ON dealer_proposals FOR UPDATE
  TO anon
  USING (
    status = 'sent'
    AND EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = dealer_proposals.car_id
        AND cars.access_token IS NOT NULL
        AND cars.access_token <> ''
    )
  )
  WITH CHECK (status = 'viewed');

CREATE INDEX IF NOT EXISTS dealer_proposals_car_id_idx ON dealer_proposals(car_id);
CREATE INDEX IF NOT EXISTS dealer_proposals_dealer_id_idx ON dealer_proposals(dealer_id);

CREATE OR REPLACE FUNCTION update_dealer_proposals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dealer_proposals_updated_at
  BEFORE UPDATE ON dealer_proposals
  FOR EACH ROW EXECUTE FUNCTION update_dealer_proposals_updated_at();
