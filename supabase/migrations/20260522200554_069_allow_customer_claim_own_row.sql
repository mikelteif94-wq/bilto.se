/*
  # Allow customers to claim their own row on signup

  ## Problem
  When a guest submits a car, a customers row is created with user_id = null.
  When they later create an account, the code runs:
    UPDATE customers SET user_id = {newUserId} WHERE mejl = email AND user_id IS NULL
  
  This UPDATE was silently blocked by RLS because the only UPDATE policy on
  customers required admin access. The user_id was never set, so the dashboard
  query (SELECT * FROM customers WHERE user_id = auth.uid()) found nothing,
  and "inga bilar" was shown.

  ## Fix
  Add a restrictive UPDATE policy that lets an authenticated user set their
  own user_id on a customer row IF:
  - The row's mejl matches their auth email (auth.jwt()->>'email')
  - The row's user_id is currently NULL (unclaimed)
  - The new user_id being written equals their own auth.uid()

  This prevents any user from hijacking another user's customer row.
*/

CREATE POLICY "Customer can claim own row on signup"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    user_id IS NULL
    AND lower(mejl) = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND lower(mejl) = lower(auth.jwt() ->> 'email')
  );
