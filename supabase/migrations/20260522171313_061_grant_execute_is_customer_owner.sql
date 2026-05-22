/*
  # Grant EXECUTE on is_customer_owner to authenticated and anon

  The is_customer_owner() function is used in an RLS policy on the cars table
  ("Customer can read own cars"). It was missing EXECUTE grants for the
  authenticated and anon roles, causing PostgreSQL to throw a permission error
  when evaluating that policy. Since RLS policies for all roles are evaluated
  together, this caused the entire SELECT on cars to fail for admin users,
  returning 0 rows despite valid admin credentials.

  Fix: grant EXECUTE to authenticated and anon (matching the pattern used by
  is_admin and get_is_admin).
*/

GRANT EXECUTE ON FUNCTION is_customer_owner(uuid) TO authenticated, anon;
