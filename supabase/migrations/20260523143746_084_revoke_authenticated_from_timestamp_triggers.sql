/*
  # Revoke authenticated from timestamp trigger helpers

  These functions are fired exclusively by DB triggers (BEFORE UPDATE on
  dealer_inventory and dealer_proposals tables). They must never be
  callable directly via RPC by any client role.

  An authenticated grant was present from a previous migration. Removing it.
*/

REVOKE EXECUTE ON FUNCTION public.update_dealer_inventory_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_dealer_proposals_updated_at() FROM authenticated;
