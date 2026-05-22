/*
  # Grant EXECUTE on is_winning_dealer_for_customer to authenticated and anon

  The is_winning_dealer_for_customer() function is used in an RLS policy on the
  customers table ("Winning dealer can read customer contact"). It was missing
  EXECUTE grants for authenticated and anon roles, causing a permission error
  when evaluating that RLS policy — which in turn blocked all SELECT queries on
  customers for authenticated users, including admins fetching cars with
  customers(*) joins.

  Fix: grant EXECUTE to authenticated and anon (same pattern as is_customer_owner).
*/

GRANT EXECUTE ON FUNCTION is_winning_dealer_for_customer(uuid) TO authenticated, anon;
