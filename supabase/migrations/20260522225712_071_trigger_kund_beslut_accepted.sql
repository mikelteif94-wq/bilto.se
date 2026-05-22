/*
  # Trigger on kund_beslut = 'vill_salja'

  When a customer accepts a bid (kund_beslut changes to 'vill_salja'):
  1. Automatically set cars.status = 'sald'
  2. Call notify-bid-approved edge function → sends email to winning dealer with customer contact info
  3. Call notify-customer-decision-admin edge function → sends email to admin

  New functions:
  - handle_kund_beslut_accepted() — trigger function on cars UPDATE
*/

CREATE OR REPLACE FUNCTION public.handle_kund_beslut_accepted()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_anon_key text;
  v_base_url text;
BEGIN
  -- Only fire when kund_beslut transitions to 'vill_salja'
  IF NEW.kund_beslut = 'vill_salja' AND (OLD.kund_beslut IS DISTINCT FROM 'vill_salja') THEN

    -- Set status to sald
    NEW.status := 'sald';

    v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGFrbXh1bWZ3Z2dubnlmcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzIzNDcsImV4cCI6MjA5MzQwODM0N30.-7Bpe7kIPy2LVUvCtnpySaRg-GODohHo6DYVxCqWESs';
    v_base_url := 'https://xvtakmxumfwggnnyfqpy.supabase.co/functions/v1';

    -- Notify winning dealer
    PERFORM net.http_post(
      url     := v_base_url || '/notify-bid-approved',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_anon_key,
        'Apikey',        v_anon_key
      ),
      body    := jsonb_build_object('car_id', NEW.id)
    );

    -- Notify admin
    PERFORM net.http_post(
      url     := v_base_url || '/notify-customer-decision-admin',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_anon_key,
        'Apikey',        v_anon_key
      ),
      body    := jsonb_build_object('car_id', NEW.id)
    );

  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kund_beslut_accepted ON public.cars;

CREATE TRIGGER trg_kund_beslut_accepted
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_kund_beslut_accepted();
