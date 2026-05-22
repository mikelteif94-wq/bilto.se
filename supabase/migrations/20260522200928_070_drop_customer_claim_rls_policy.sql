/*
  # Drop customer claim RLS policy

  The customer-to-user linking now happens via the link-customer-account
  edge function using service role, so the RLS UPDATE policy added in
  migration 069 is no longer needed and can be removed.
*/

DROP POLICY IF EXISTS "Customer can claim own row on signup" ON customers;
