-- Add user_id to quote_requests so authenticated customers can see their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT NULL;
  END IF;
END $$;

-- Add source column to distinguish quiz/equity vs manual form submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'source'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN source text NOT NULL DEFAULT 'form';
  END IF;
END $$;

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(email) WHERE email <> '';

-- Allow authenticated users to read their own quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quote_requests' AND policyname = 'Users can read own quote requests'
  ) THEN
    CREATE POLICY "Users can read own quote requests"
      ON quote_requests FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
      );
  END IF;
END $$;

-- Drop old overly broad select policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quote_requests' AND policyname = 'Authenticated can read quote requests'
  ) THEN
    DROP POLICY "Authenticated can read quote requests" ON quote_requests;
  END IF;
END $$;
