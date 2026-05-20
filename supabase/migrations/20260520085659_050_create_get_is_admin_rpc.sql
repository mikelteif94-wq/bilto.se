/*
  # Add get_is_admin() RPC function

  ## Purpose
  Provides a SECURITY DEFINER RPC function that frontend clients can call
  to check if the currently authenticated user is an admin, bypassing RLS
  on the admin_users table (which causes 403 errors on direct client queries).

  ## Changes
  - Creates `get_is_admin()` function with SECURITY DEFINER so it runs as
    the function owner (bypassing RLS) and safely returns true/false
*/

CREATE OR REPLACE FUNCTION get_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$;
