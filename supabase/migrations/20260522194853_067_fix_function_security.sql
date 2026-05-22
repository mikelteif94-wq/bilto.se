/*
  # Fix function security issues

  ## Issues addressed

  1. Function Search Path Mutable
     - get_is_admin() and notify_new_bid_fn() lack SET search_path = public
     - A mutable search_path lets an attacker shadow objects via schema manipulation

  2. Public Can Execute SECURITY DEFINER Functions
     - anon role should not be able to call get_is_admin, is_customer_owner,
       is_dealer_member, is_winning_dealer_for_customer, or notify_new_bid_fn
     - These functions are only meaningful for authenticated users or internal triggers

  3. Signed-In Users Can Execute SECURITY DEFINER Functions
     - is_admin() should not be directly callable via RPC by authenticated users
       (it is only used internally by RLS policies, not as a public RPC)
     - notify_new_bid_fn() is a trigger function — no role should call it directly via RPC

  ## Changes
  - Recreate get_is_admin() with SET search_path = public
  - Recreate notify_new_bid_fn() with SET search_path = public
  - REVOKE EXECUTE FROM anon on all five affected functions
  - REVOKE EXECUTE FROM authenticated on is_admin() and notify_new_bid_fn()
    (is_admin is used only inside RLS policies, not as a user-facing RPC;
     notify_new_bid_fn is a trigger-only function)
*/

-- ─── 1. Fix get_is_admin: add SET search_path ───────────────────────────────
CREATE OR REPLACE FUNCTION get_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$;

-- ─── 2. Fix notify_new_bid_fn: add SET search_path ──────────────────────────
CREATE OR REPLACE FUNCTION notify_new_bid_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://xvtakmxumfwggnnyfqpy.supabase.co/functions/v1/notify-new-bid',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGFrbXh1bWZ3Z2dubnlmcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzIzNDcsImV4cCI6MjA5MzQwODM0N30.-7Bpe7kIPy2LVUvCtnpySaRg-GODohHo6DYVxCqWESs',
      'Apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGFrbXh1bWZ3Z2dubnlmcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzIzNDcsImV4cCI6MjA5MzQwODM0N30.-7Bpe7kIPy2LVUvCtnpySaRg-GODohHo6DYVxCqWESs'
    ),
    body    := jsonb_build_object(
      'car_id',     NEW.car_id,
      'bid_amount', NEW.belopp
    )
  );
  RETURN NEW;
END;
$$;

-- ─── 3. Revoke anon access from all SECURITY DEFINER functions ───────────────
REVOKE EXECUTE ON FUNCTION get_is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION is_customer_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION is_winning_dealer_for_customer(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION is_dealer_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION notify_new_bid_fn() FROM anon;

-- ─── 4. Revoke authenticated access from internal-only functions ─────────────
-- is_admin() is used only inside RLS policies, not as a public RPC endpoint
REVOKE EXECUTE ON FUNCTION is_admin() FROM authenticated;
-- notify_new_bid_fn() is a trigger function, never meant to be called via RPC
REVOKE EXECUTE ON FUNCTION notify_new_bid_fn() FROM authenticated;
