/*
  # Allow ANY visitor to submit a dealer application

  1. Background
    - Dealers reported "Vi kunde inte spara din ansökan just nu" when
      trying to submit the application form
    - Existing INSERT policies were split between roles (anon /
      authenticated) and edge cases (e.g. expired/invalid sessions where
      the JWT role is neither anon nor authenticated, custom roles, etc.)
      occasionally fell outside both policies and got blocked by RLS

  2. Changes
    - Add an INSERT policy on `dealers` for the `public` role so that
      ANY visitor (anon, authenticated, service role) can submit an
      unsigned application
    - The policy still enforces that the row is unsigned
      (user_id IS NULL AND godkand = false) so it cannot be used to
      bypass approval or hijack an existing dealer

  3. Security
    - RLS remains enabled on dealers
    - Only unsigned applications can be created via this policy
    - Existing read/update/admin policies are unchanged
    - Approval still requires admin action
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'dealers'
      AND policyname = 'Public can submit dealer application'
  ) THEN
    CREATE POLICY "Public can submit dealer application"
      ON dealers
      FOR INSERT
      TO public
      WITH CHECK (user_id IS NULL AND godkand = false);
  END IF;
END $$;
