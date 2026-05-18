/*
  # Create car_offers table for presenting deal breakdowns to customers

  1. New Tables
    - `car_offers`
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid, FK to quote_requests)
      - `customer_email` (text) - for sending notification
      - `customer_name` (text) - customer display name
      - `car_description` (text) - e.g. "Volvo XC60 2022"
      - Pricing fields: original_price, negotiated_price
      - Interest rate fields: original/negotiated
      - Monthly cost fields: original/negotiated
      - Extras: winter tires, warranty, home delivery, other
      - Deal summary: total_savings, total_deal_price, deal_rating, admin_comment
      - Status tracking: draft/sent/viewed with timestamps

  2. Security
    - Enable RLS on `car_offers` table
    - Admin (authenticated, in admin_users) can CRUD all offers
    - Authenticated customers can view offers sent to their email
*/

CREATE TABLE IF NOT EXISTS car_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE SET NULL,
  customer_email text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  car_description text NOT NULL DEFAULT '',
  original_price integer NOT NULL DEFAULT 0,
  negotiated_price integer NOT NULL DEFAULT 0,
  original_interest_rate numeric(5,2) DEFAULT NULL,
  negotiated_interest_rate numeric(5,2) DEFAULT NULL,
  original_monthly_cost integer DEFAULT NULL,
  negotiated_monthly_cost integer DEFAULT NULL,
  winter_tires_included boolean NOT NULL DEFAULT false,
  winter_tires_value integer NOT NULL DEFAULT 0,
  warranty_included boolean NOT NULL DEFAULT false,
  warranty_years integer NOT NULL DEFAULT 0,
  warranty_value integer NOT NULL DEFAULT 0,
  home_delivery_included boolean NOT NULL DEFAULT false,
  home_delivery_value integer NOT NULL DEFAULT 0,
  other_savings_description text NOT NULL DEFAULT '',
  other_savings_value integer NOT NULL DEFAULT 0,
  total_savings integer NOT NULL DEFAULT 0,
  total_deal_price integer NOT NULL DEFAULT 0,
  deal_rating text NOT NULL DEFAULT 'good' CHECK (deal_rating IN ('good', 'great', 'excellent')),
  admin_comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed')),
  sent_at timestamptz DEFAULT NULL,
  viewed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE car_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select car_offers"
  ON car_offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admin can insert car_offers"
  ON car_offers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admin can update car_offers"
  ON car_offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admin can delete car_offers"
  ON car_offers FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Customer can view own offers"
  ON car_offers FOR SELECT
  TO authenticated
  USING (
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status IN ('sent', 'viewed')
  );
