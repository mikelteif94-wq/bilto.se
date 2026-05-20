/*
  # Fix is_admin() infinite recursion

  The is_admin() function queries admin_users, but admin_users RLS
  calls is_admin() — causing infinite recursion and blocking login.

  Fix: recreate is_admin() as SECURITY DEFINER so it bypasses RLS.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$;
