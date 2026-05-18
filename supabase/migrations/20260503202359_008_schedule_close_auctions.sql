/*
  # Schemalägg stängning av auktioner var 5:e minut

  1. Aktiverar pg_cron och pg_net så att vi kan anropa edge-funktioner från databasen.
  2. Skapar ett schemalagt jobb "close-auctions-every-5-min" som var 5:e minut
     anropar edge-funktionen `close-auctions` via HTTP POST.
  3. Inga data påverkas; detta är enbart schemalagd bearbetning.

  Notering: URL och service-role-key läses från Vault (key `close_auctions_url`
  och `service_role_key`) om de finns, annars används GUC-variabler satta i
  `app.settings.*`. Service-role-nyckeln behövs så att edge-funktionen
  (anropad med `verify_jwt=false`) ändå kan svara och för att funktionen
  internt skapar en klient med service_role från sin egen miljö.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  project_url text;
BEGIN
  SELECT decrypted_secret INTO project_url
    FROM vault.decrypted_secrets
    WHERE name = 'project_url'
    LIMIT 1;

  IF project_url IS NULL THEN
    project_url := current_setting('app.settings.project_url', true);
  END IF;

  IF project_url IS NOT NULL AND project_url <> '' THEN
    PERFORM cron.unschedule('close-auctions-every-5-min')
      WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'close-auctions-every-5-min'
      );

    PERFORM cron.schedule(
      'close-auctions-every-5-min',
      '*/5 * * * *',
      format(
        $cron$
        SELECT net.http_post(
          url := %L,
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := '{}'::jsonb
        );
        $cron$,
        rtrim(project_url, '/') || '/functions/v1/close-auctions'
      )
    );
  END IF;
END $$;
