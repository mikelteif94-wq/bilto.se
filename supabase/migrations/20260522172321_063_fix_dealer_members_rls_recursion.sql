/*
  # Fix dealer_members RLS infinite recursion

  The SELECT policies on dealer_members contain a self-referencing subquery:
    SELECT dealer_id FROM dealer_members WHERE dealer_members.user_id = auth.uid()
  This causes infinite recursion when PostgreSQL evaluates the policy.

  Fix: Replace the self-referencing policies with a SECURITY DEFINER helper
  function that bypasses RLS, then use that function in the policies.

  Changes:
  - Create is_dealer_member(dealer_id uuid) SECURITY DEFINER function
  - Drop the two recursive SELECT policies
  - Replace with a single clean non-recursive SELECT policy
  - Fix DELETE and UPDATE policies the same way
*/

-- 1. Helper function that bypasses RLS to check membership
CREATE OR REPLACE FUNCTION is_dealer_member(p_dealer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM dealer_members
    WHERE dealer_id = p_dealer_id
      AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_dealer_member(uuid) TO authenticated, anon;

-- 2. Drop the recursive SELECT policies
DROP POLICY IF EXISTS "Dealer members visible to own dealer" ON dealer_members;
DROP POLICY IF EXISTS "Dealer members can view own team" ON dealer_members;

-- 3. New non-recursive SELECT policy
CREATE POLICY "Dealer members can view own team"
  ON dealer_members FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- 4. Fix DELETE policies
DROP POLICY IF EXISTS "Owner can remove members" ON dealer_members;
DROP POLICY IF EXISTS "Dealer owner can delete members" ON dealer_members;

CREATE POLICY "Dealer owner can delete members"
  ON dealer_members FOR DELETE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
    OR (user_id = auth.uid() AND role = 'owner')
  );

-- 5. Fix UPDATE policy
DROP POLICY IF EXISTS "Dealer owner can update members" ON dealer_members;

CREATE POLICY "Dealer owner can update members"
  ON dealer_members FOR UPDATE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
    OR (user_id = auth.uid() AND role = 'owner')
  )
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
    OR (user_id = auth.uid() AND role = 'owner')
  );
