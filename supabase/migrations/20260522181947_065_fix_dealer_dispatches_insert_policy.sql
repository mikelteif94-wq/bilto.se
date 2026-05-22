/*
  # Fix dealer_dispatches INSERT policy to use is_admin()

  The existing INSERT policy ran a direct subquery against admin_users,
  which triggered admin_users RLS, which called is_admin(), which queried
  admin_users again — causing infinite recursion that silently blocked inserts.

  Replace the INSERT policy to use the SECURITY DEFINER is_admin() function
  directly, which breaks the recursion.
*/

DROP POLICY IF EXISTS "Admins can insert dispatches" ON dealer_dispatches;

CREATE POLICY "Admins can insert dispatches"
  ON dealer_dispatches
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Also fix SELECT policy for the same reason
DROP POLICY IF EXISTS "Admins can manage dispatches" ON dealer_dispatches;

CREATE POLICY "Admins can manage dispatches"
  ON dealer_dispatches
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Also fix UPDATE policy
DROP POLICY IF EXISTS "Admins can update dispatches" ON dealer_dispatches;

CREATE POLICY "Admins can update dispatches"
  ON dealer_dispatches
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
