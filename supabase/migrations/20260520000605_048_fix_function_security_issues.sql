/*
  # Fix Function Security Issues

  1. Mutable search_path
     - Set `search_path = ''` on `generate_quote_access_token` and `update_dealer_proposals_updated_at`
       to prevent search_path hijacking attacks.

  2. SECURITY DEFINER exposure
     - Revoke public/authenticated EXECUTE on `is_admin()`, `is_customer_owner(uuid)`,
       and `is_winning_dealer_for_customer(uuid)` so they cannot be called directly via RPC.
       These are internal helper functions used only within RLS policies.
*/

-- Fix mutable search_path on generate_quote_access_token
ALTER FUNCTION public.generate_quote_access_token()
  SET search_path = '';

-- Fix mutable search_path on update_dealer_proposals_updated_at
ALTER FUNCTION public.update_dealer_proposals_updated_at()
  SET search_path = '';

-- Revoke direct RPC execution of SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_customer_owner(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_winning_dealer_for_customer(uuid) FROM authenticated, anon, PUBLIC;
