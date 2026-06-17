-- Allow users to read their own quote requests matched by email (for magic-link users before user_id is set)
DROP POLICY IF EXISTS "Users can read own quote requests" ON quote_requests;

CREATE POLICY "Users can read own quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(auth.jwt() ->> 'email')
    OR EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  );
