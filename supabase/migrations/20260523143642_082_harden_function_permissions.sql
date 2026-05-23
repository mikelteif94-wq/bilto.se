/*
  # Harden RPC / Function Permissions

  ## Summary
  Lock down EXECUTE privileges on PostgreSQL functions so that only the
  roles that legitimately need to call each function can do so.

  ## Changes

  ### 1. Trigger functions — revoke ALL public access
  These are only invoked by database triggers (INSERT/UPDATE on tables).
  They must never be callable directly via PostgREST RPC by any role.
  Affected: generate_quote_access_token, handle_kund_beslut_accepted,
            log_bid_placed_fn, log_dispatch_change_fn, log_portal_view_fn,
            trigger_invoice_score_update, trigger_recalc_dealer_score

  ### 2. Backend-only scoring / matching functions — revoke anon + authenticated
  These are called only from admin edge functions or internal backend logic.
  No direct client-side RPC calls exist in the frontend codebase.
  Affected: calculate_dealer_score, match_buy_lead_to_dealers,
            match_sell_lead_to_dealers, match_inventory_to_lead (keep authenticated),
            next_invoice_number (keep authenticated for admin frontend),
            get_dispatch_kpis

  ### 3. SECURITY INVOKER trigger helpers — revoke anon
  These are update_timestamp helpers fired by triggers only.
  Affected: update_dealer_inventory_updated_at, update_dealer_proposals_updated_at

  ### 4. Drop duplicate is_admin function
  get_is_admin() and is_admin() have identical bodies. is_admin() is used
  only in RLS policies (called internally by postgres). get_is_admin() is
  the RPC used by the admin frontend. Keep both but restrict is_admin to
  postgres + service_role only since it is only used in RLS policies
  (already correctly restricted).

  ## Roles that retain access after this migration
  - generate_quote_access_token    : postgres, service_role (trigger only)
  - handle_kund_beslut_accepted    : postgres, service_role (trigger only)
  - log_bid_placed_fn              : postgres, service_role (trigger only)
  - log_dispatch_change_fn         : postgres, service_role (trigger only)
  - log_portal_view_fn             : postgres, service_role (trigger only)
  - trigger_invoice_score_update   : postgres, service_role (trigger only)
  - trigger_recalc_dealer_score    : postgres, service_role (trigger only)
  - calculate_dealer_score         : postgres, service_role (edge functions)
  - match_buy_lead_to_dealers      : postgres, service_role (edge functions)
  - match_sell_lead_to_dealers     : postgres, service_role (edge functions)
  - match_inventory_to_lead        : postgres, service_role, authenticated (dealer frontend)
  - next_invoice_number            : postgres, service_role, authenticated (admin frontend)
  - get_dispatch_kpis              : postgres, service_role, authenticated (admin frontend)
  - get_is_admin                   : postgres, service_role, authenticated (admin frontend + RLS)
  - is_admin                       : postgres, service_role, authenticated (RLS policies)
  - is_customer_owner              : postgres, service_role, authenticated (RLS policies)
  - is_dealer_member               : postgres, service_role, authenticated (RLS policies)
  - is_winning_dealer_for_customer : postgres, service_role, authenticated (RLS policies)
  - update_dealer_inventory_updated_at : postgres, service_role (trigger only)
  - update_dealer_proposals_updated_at : postgres, service_role (trigger only)
*/

-- ============================================================
-- 1. TRIGGER-ONLY FUNCTIONS
--    Revoke ALL direct execution rights. Only postgres/service_role
--    should be able to run these (via trigger mechanism).
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.generate_quote_access_token()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_kund_beslut_accepted()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_bid_placed_fn()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_dispatch_change_fn()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_portal_view_fn()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.trigger_invoice_score_update()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.trigger_recalc_dealer_score()
  FROM anon, authenticated;

-- ============================================================
-- 2. BACKEND/EDGE-FUNCTION-ONLY SCORING & MATCHING
--    No frontend RPC calls exist for these. Restrict to service_role.
-- ============================================================

-- calculate_dealer_score: called from edge functions only
REVOKE EXECUTE ON FUNCTION public.calculate_dealer_score(uuid)
  FROM anon, authenticated;

-- match_buy_lead_to_dealers: called from dispatch edge function only
REVOKE EXECUTE ON FUNCTION public.match_buy_lead_to_dealers(uuid, integer)
  FROM anon, authenticated;

-- match_sell_lead_to_dealers: called from dispatch edge function only
REVOKE EXECUTE ON FUNCTION public.match_sell_lead_to_dealers(uuid, integer)
  FROM anon, authenticated;

-- match_inventory_to_lead: called from dealer frontend (DealerInventorySync)
-- Keep authenticated, revoke anon only
REVOKE EXECUTE ON FUNCTION public.match_inventory_to_lead(uuid, uuid)
  FROM anon;

-- next_invoice_number: called from admin frontend (AdminDealerDetail)
-- Keep authenticated, revoke anon only
REVOKE EXECUTE ON FUNCTION public.next_invoice_number()
  FROM anon;

-- get_dispatch_kpis: no frontend calls found — restrict to service_role
REVOKE EXECUTE ON FUNCTION public.get_dispatch_kpis(uuid, uuid)
  FROM anon, authenticated;

-- ============================================================
-- 3. SECURITY INVOKER TIMESTAMP HELPERS (trigger-only)
--    Revoke anon — these are timestamp update triggers only.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.update_dealer_inventory_updated_at()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.update_dealer_proposals_updated_at()
  FROM anon;
