/*
  # Dealer Members (team accounts under same firm)

  ## Summary
  Allows a dealer firm to have multiple user accounts all linked to the same
  dealer record. The original dealer account keeps its user_id on the dealers
  table and is treated as the owner. Additional members are stored here.

  ## New Tables
  - `dealer_members`
    - `id` (uuid, pk)
    - `dealer_id` (uuid, FK → dealers.id CASCADE DELETE)
    - `user_id` (uuid, FK → auth.users.id CASCADE DELETE, unique – one row per user)
    - `fornamn` (text)
    - `efternamn` (text)
    - `mejl` (text)
    - `telefon` (text)
    - `roll` (text: 'owner' | 'member')
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Owners (dealer's user_id) can read and manage all members for their firm
  - Members can read members for their own firm
  - Only service-role (edge function) can insert/delete (invite flow)
    — We use a separate policy for authenticated users who are owners to also insert

  ## Notes
  1. Login flow: when user signs in, check dealers.user_id first (owner), then
     dealer_members.user_id (member). Both paths resolve to the same dealer record.
  2. The `roll` column is informational for the UI; actual permission gating is
     done by checking whether the logged-in user_id matches dealers.user_id (owner).
*/

CREATE TABLE IF NOT EXISTS dealer_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id  uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  fornamn    text NOT NULL DEFAULT '',
  efternamn  text NOT NULL DEFAULT '',
  mejl       text NOT NULL DEFAULT '',
  telefon    text NOT NULL DEFAULT '',
  roll       text NOT NULL DEFAULT 'member' CHECK (roll IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dealer_members ENABLE ROW LEVEL SECURITY;

-- Members can view all members that belong to the same dealer
CREATE POLICY "Dealer members can view own team"
  ON dealer_members FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
      UNION
      SELECT dealer_id FROM dealer_members WHERE user_id = auth.uid()
    )
  );

-- Owners can insert new members for their dealer
CREATE POLICY "Owner can add members"
  ON dealer_members FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- Owners can delete members from their dealer
CREATE POLICY "Owner can remove members"
  ON dealer_members FOR DELETE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookup by user_id (login flow)
CREATE INDEX IF NOT EXISTS dealer_members_user_id_idx ON dealer_members(user_id);
-- Index for fast lookup by dealer_id
CREATE INDEX IF NOT EXISTS dealer_members_dealer_id_idx ON dealer_members(dealer_id);
