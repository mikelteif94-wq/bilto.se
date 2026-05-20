/*
  # Grant EXECUTE on is_admin and get_is_admin to authenticated role

  The RLS policies on dealers, leads, and other tables call is_admin().
  Without EXECUTE permission, authenticated users get "permission denied for function is_admin"
  which causes all those RLS policies to fail with 403.
*/

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_is_admin() TO authenticated;
