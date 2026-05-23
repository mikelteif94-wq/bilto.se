/*
  # Harden Functions — Revoke PUBLIC, Grant Explicitly

  ## Problem
  Previous migration used REVOKE FROM anon/authenticated but the root
  grant was to PUBLIC (=X/postgres in ACL). REVOKE FROM a specific role
  does not override a PUBLIC grant — the role still gets it via PUBLIC.

  ## Solution
  For each function that must be restricted:
  1. REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC  -- removes the wildcard grant
  2. GRANT EXECUTE ON FUNCTION ... TO <allowed_roles>  -- explicit allowlist

  ## Policy per function
  - Trigger-only functions: postgres + service_role only
  - Backend/edge-function scoring+matching: postgres + service_role only
  - match_inventory_to_lead: postgres + service_role + authenticated (dealer frontend)
  - next_invoice_number: postgres + service_role + authenticated (admin frontend)
  - get_dispatch_kpis: postgres + service_role + authenticated (admin frontend)
  - update_dealer_*_at: postgres + service_role only (trigger helpers)
*/

-- ============================================================
-- TRIGGER-ONLY FUNCTIONS: postgres + service_role only
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.generate_quote_access_token() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.generate_quote_access_token() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_kund_beslut_accepted() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_kund_beslut_accepted() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_bid_placed_fn() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_bid_placed_fn() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_dispatch_change_fn() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_dispatch_change_fn() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_portal_view_fn() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_portal_view_fn() TO service_role;

REVOKE EXECUTE ON FUNCTION public.trigger_invoice_score_update() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.trigger_invoice_score_update() TO service_role;

REVOKE EXECUTE ON FUNCTION public.trigger_recalc_dealer_score() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.trigger_recalc_dealer_score() TO service_role;

-- ============================================================
-- BACKEND/EDGE-FUNCTION SCORING & MATCHING: postgres + service_role only
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.calculate_dealer_score(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.calculate_dealer_score(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_buy_lead_to_dealers(uuid, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.match_buy_lead_to_dealers(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_sell_lead_to_dealers(uuid, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.match_sell_lead_to_dealers(uuid, integer) TO service_role;

-- ============================================================
-- FUNCTIONS USED BY AUTHENTICATED FRONTEND
-- ============================================================

-- match_inventory_to_lead: dealer frontend (DealerInventorySync page)
REVOKE EXECUTE ON FUNCTION public.match_inventory_to_lead(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.match_inventory_to_lead(uuid, uuid) TO service_role, authenticated;

-- next_invoice_number: admin frontend (AdminDealerDetail page)
REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.next_invoice_number() TO service_role, authenticated;

-- get_dispatch_kpis: no frontend calls found but keep authenticated for safety
REVOKE EXECUTE ON FUNCTION public.get_dispatch_kpis(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_dispatch_kpis(uuid, uuid) TO service_role, authenticated;

-- ============================================================
-- SECURITY INVOKER TIMESTAMP HELPERS (trigger-only)
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.update_dealer_inventory_updated_at() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_dealer_inventory_updated_at() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_dealer_proposals_updated_at() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_dealer_proposals_updated_at() TO service_role;
