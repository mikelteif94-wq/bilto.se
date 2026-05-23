/*
  # Schedule daily OTP cleanup via pg_cron

  ## Purpose
  Calls the cleanup-otp edge function every day at 03:00 UTC to purge:
  - Expired + unverified OTP rows older than 1 hour
  - Verified OTP rows older than 7 days

  ## Notes
  - Uses pg_cron extension (already available on Supabase)
  - Uses pg_net extension to make HTTP POST to the edge function
  - Job name: 'cleanup-otp-daily' (idempotent via DELETE + INSERT)
  - The service role key is not needed here; the function is public (verify_jwt=false)
    and we pass the anon key in the Authorization header.
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old job if it exists (idempotent re-runs)
SELECT cron.unschedule('cleanup-otp-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-otp-daily'
);

-- Schedule: every day at 03:00 UTC
SELECT cron.schedule(
  'cleanup-otp-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/cleanup-otp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
