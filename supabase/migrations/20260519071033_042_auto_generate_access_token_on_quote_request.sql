/*
  # Auto-generate access_token on quote_request insert

  1. Changes
    - Adds a trigger function that generates a secure random access_token
      on every new quote_request insert where access_token is NULL.
    - This ensures every customer gets a portal link immediately after
      submitting their request, allowing the confirmation email to include it.

  2. Notes
    - Uses gen_random_uuid() cast to text as a collision-resistant token.
    - Does not overwrite existing tokens (admin-generated tokens are preserved).
*/

CREATE OR REPLACE FUNCTION generate_quote_access_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_token IS NULL THEN
    NEW.access_token := replace(gen_random_uuid()::text, '-', '');
    NEW.access_token_created_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_request_access_token ON quote_requests;

CREATE TRIGGER trg_quote_request_access_token
  BEFORE INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_access_token();
