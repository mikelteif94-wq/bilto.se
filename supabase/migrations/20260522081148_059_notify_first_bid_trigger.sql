/*
  # Trigger notify-first-bid on first bid for a car

  When the first bid is inserted for a car (count goes from 0 to 1), fire an
  async HTTP POST to the notify-first-bid edge function so the customer
  receives an email prompting them to create their account.

  1. New function: notify_first_bid_fn
     - Counts existing bids for the car (excluding the one just inserted)
     - If count is 0 (this is the first bid), calls the edge function via pg_net
  2. New trigger: notify_first_bid_trigger
     - Fires AFTER INSERT on the bids table
*/

CREATE OR REPLACE FUNCTION notify_first_bid_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_count integer;
  supabase_url   text;
  service_key    text;
BEGIN
  -- Count bids for this car excluding the one just inserted
  SELECT COUNT(*) INTO existing_count
  FROM bids
  WHERE car_id = NEW.car_id
    AND id <> NEW.id;

  -- Only act on the very first bid
  IF existing_count = 0 THEN
    supabase_url := current_setting('app.supabase_url', true);
    service_key  := current_setting('app.service_role_key', true);

    IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
      PERFORM extensions.http_post(
        url     := supabase_url || '/functions/v1/notify-first-bid',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || service_key,
          'Apikey',        service_key
        ),
        body    := jsonb_build_object('car_id', NEW.car_id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_first_bid_trigger ON bids;

CREATE TRIGGER notify_first_bid_trigger
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_first_bid_fn();
