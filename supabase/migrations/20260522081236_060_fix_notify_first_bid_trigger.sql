/*
  # Fix notify-first-bid trigger to use net.http_post (pg_net)

  Replaces the previous trigger function with one that uses the correct
  net.http_post API from the pg_net extension. The edge function has
  verify_jwt disabled so the anon key is sufficient to call it.

  - Drops and recreates notify_first_bid_fn with net.http_post
  - Trigger remains AFTER INSERT ON bids FOR EACH ROW
*/

CREATE OR REPLACE FUNCTION notify_first_bid_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_count integer;
BEGIN
  -- Count bids for this car excluding the one just inserted
  SELECT COUNT(*) INTO existing_count
  FROM bids
  WHERE car_id = NEW.car_id
    AND id <> NEW.id;

  -- Only fire on the very first bid
  IF existing_count = 0 THEN
    PERFORM net.http_post(
      url     := 'https://xvtakmxumfwggnnyfqpy.supabase.co/functions/v1/notify-first-bid',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGFrbXh1bWZ3Z2dubnlmcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzIzNDcsImV4cCI6MjA5MzQwODM0N30.-7Bpe7kIPy2LVUvCtnpySaRg-GODohHo6DYVxCqWESs',
        'Apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGFrbXh1bWZ3Z2dubnlmcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzIzNDcsImV4cCI6MjA5MzQwODM0N30.-7Bpe7kIPy2LVUvCtnpySaRg-GODohHo6DYVxCqWESs'
      ),
      body    := jsonb_build_object('car_id', NEW.car_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_first_bid_trigger ON bids;

CREATE TRIGGER notify_first_bid_trigger
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_first_bid_fn();
