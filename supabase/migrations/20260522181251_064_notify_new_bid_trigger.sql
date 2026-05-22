/*
  # Trigger notify-new-bid on every new bid

  Fires the notify-new-bid edge function after every bid insertion so
  the car owner receives an email with the new highest bid amount and
  a direct link to their portal.

  1. New/replaced function: notify_new_bid_fn
     - Calls net.http_post to the notify-new-bid edge function
     - Passes car_id and the bid amount
  2. New trigger: notify_new_bid_trigger
     - AFTER INSERT ON bids FOR EACH ROW
*/

CREATE OR REPLACE FUNCTION notify_new_bid_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS notify_new_bid_trigger ON bids;

CREATE TRIGGER notify_new_bid_trigger
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_bid_fn();
