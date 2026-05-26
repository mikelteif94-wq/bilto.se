/*
  # Vehicle lookup cache

  Caches responses from the biluppgifter.se API for 24 hours to avoid
  redundant external API calls for the same registration number.

  1. New table
    - `vehicle_lookup_cache`
      - `regnummer` (text, primary key) – normalised upper-case reg number
      - `payload`   (jsonb)             – the full response object
      - `cached_at` (timestamptz)       – when the row was written / last refreshed

  2. Security
    - RLS enabled; service-role-only access (edge function uses service role key).
    - No policies for authenticated/anon — this table is internal only.
*/

CREATE TABLE IF NOT EXISTS vehicle_lookup_cache (
  regnummer  text        PRIMARY KEY,
  payload    jsonb       NOT NULL,
  cached_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicle_lookup_cache ENABLE ROW LEVEL SECURITY;
