/*
  # Enhance dealer_invoices for automatic commission tracking

  ## Summary
  Extends the dealer_invoices table to support automatic commission invoice generation
  when a dealer wins an auction. Adds fields for VAT, commission type, description,
  invoice number, and invoice date. Also creates a sequence counter for auto-generating
  invoice numbers in the format BLT-YYYY-NNNNN.

  ## Changes to dealer_invoices
  - `commission_type` (text): 'standard' (3 000 kr) or 'trade_in' (6 000 kr)
  - `vat_kr` (integer): VAT amount in SEK (25%)
  - `total_kr` (integer): Total including VAT
  - `invoice_number` (text): e.g. BLT-2026-00001
  - `invoice_date` (date): Date invoice was generated
  - `description` (text): Human-readable description

  ## New table: invoice_number_seq
  - Single-row counter for sequential invoice numbers
  - service_role only (used by edge functions + RPC)

  ## New function: next_invoice_number()
  - Atomically increments counter and returns formatted invoice number
*/

-- Add missing columns to dealer_invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_invoices' AND column_name = 'commission_type'
  ) THEN
    ALTER TABLE dealer_invoices ADD COLUMN commission_type text NOT NULL DEFAULT 'standard';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_invoices' AND column_name = 'vat_kr'
  ) THEN
    ALTER TABLE dealer_invoices ADD COLUMN vat_kr integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_invoices' AND column_name = 'total_kr'
  ) THEN
    ALTER TABLE dealer_invoices ADD COLUMN total_kr integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE dealer_invoices ADD COLUMN invoice_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_invoices' AND column_name = 'invoice_date'
  ) THEN
    ALTER TABLE dealer_invoices ADD COLUMN invoice_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealer_invoices' AND column_name = 'description'
  ) THEN
    ALTER TABLE dealer_invoices ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Backfill vat and total for existing rows
UPDATE dealer_invoices
SET
  vat_kr = ROUND(belopp * 0.25),
  total_kr = belopp + ROUND(belopp * 0.25)
WHERE total_kr = 0 AND belopp > 0;

-- Invoice number sequence table (service_role access only — called via SECURITY DEFINER RPC)
CREATE TABLE IF NOT EXISTS invoice_number_seq (
  id integer PRIMARY KEY DEFAULT 1,
  last_number integer NOT NULL DEFAULT 0,
  CHECK (id = 1)
);

INSERT INTO invoice_number_seq (id, last_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE invoice_number_seq ENABLE ROW LEVEL SECURITY;

-- Admins can view the current sequence value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoice_number_seq' AND policyname = 'Admins can select invoice sequence'
  ) THEN
    CREATE POLICY "Admins can select invoice sequence"
      ON invoice_number_seq
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      );
  END IF;
END $$;

-- Function: atomically claim next invoice number → 'BLT-YYYY-NNNNN'
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
  v_year text;
BEGIN
  UPDATE invoice_number_seq
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO v_next;

  v_year := to_char(NOW(), 'YYYY');
  RETURN 'BLT-' || v_year || '-' || LPAD(v_next::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_invoice_number() TO service_role;
GRANT EXECUTE ON FUNCTION next_invoice_number() TO authenticated;

-- Also add RLS policies to dealer_invoices if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dealer_invoices' AND policyname = 'Dealers can view own invoices'
  ) THEN
    CREATE POLICY "Dealers can view own invoices"
      ON dealer_invoices
      FOR SELECT
      TO authenticated
      USING (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
          UNION
          SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dealer_invoices' AND policyname = 'Admins can manage all invoices'
  ) THEN
    CREATE POLICY "Admins can manage all invoices"
      ON dealer_invoices
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dealer_invoices' AND policyname = 'Admins can insert invoices'
  ) THEN
    CREATE POLICY "Admins can insert invoices"
      ON dealer_invoices
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dealer_invoices' AND policyname = 'Admins can update invoices'
  ) THEN
    CREATE POLICY "Admins can update invoices"
      ON dealer_invoices
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
      );
  END IF;
END $$;
