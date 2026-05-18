/*
  # Quote suggestions and customer access tokens

  1. Modified Tables
    - `quote_requests`
      - `access_token` (text, unique) - Token for customer portal access link
      - `access_token_created_at` (timestamptz) - When the token was generated

  2. New Tables
    - `quote_suggestions`
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid FK) - Links to the original quote request
      - `car_description` (text) - e.g. "Volvo XC60 2023"
      - `car_image_url` (text) - Image URL of the suggested car
      - `price` (integer) - Suggested price
      - `monthly_cost` (integer, nullable) - Monthly cost if financed
      - `link` (text) - Link to the car ad
      - `admin_comment` (text) - Admin's note about why this car is a good fit
      - `status` (text) - 'draft' | 'sent' | 'viewed'
      - `sent_at` (timestamptz, nullable) - When it was sent
      - `created_at` (timestamptz) - Creation time

  3. Security
    - RLS enabled on `quote_suggestions`
    - Admin can CRUD all suggestions
    - No public SELECT - customer access is via edge function using access_token
*/

-- Add access token to quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN access_token text UNIQUE DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'access_token_created_at'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN access_token_created_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Create quote_suggestions table
CREATE TABLE IF NOT EXISTS quote_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id),
  car_description text NOT NULL DEFAULT '',
  car_image_url text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  monthly_cost integer DEFAULT NULL,
  link text NOT NULL DEFAULT '',
  admin_comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_suggestions ENABLE ROW LEVEL SECURITY;

-- Admin policies for quote_suggestions
CREATE POLICY "Admins can view all quote suggestions"
  ON quote_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a WHERE a.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert quote suggestions"
  ON quote_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users a WHERE a.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update quote suggestions"
  ON quote_suggestions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a WHERE a.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users a WHERE a.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete quote suggestions"
  ON quote_suggestions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a WHERE a.id = auth.uid()
    )
  );

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_quote_suggestions_quote_request_id ON quote_suggestions(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_access_token ON quote_requests(access_token) WHERE access_token IS NOT NULL;
