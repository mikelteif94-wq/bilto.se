/*
  # Fix quote_requests access_token auto-generation

  Problem: The existing trigger generate_quote_access_token() uses
  SET search_path TO '' which means gen_random_uuid() cannot be resolved.
  As a result all quote_requests were created without an access_token.

  Fixes:
  1. Replace the trigger function with correct search_path = 'public'
  2. Backfill access_token for all existing rows that are missing it
*/

-- Fix the trigger function with correct search_path
CREATE OR REPLACE FUNCTION public.generate_quote_access_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.access_token IS NULL OR NEW.access_token = '' THEN
    NEW.access_token := replace(gen_random_uuid()::text, '-', '');
    NEW.access_token_created_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill existing rows that have no token
UPDATE public.quote_requests
SET
  access_token = replace(gen_random_uuid()::text, '-', ''),
  access_token_created_at = now()
WHERE access_token IS NULL OR access_token = '';
