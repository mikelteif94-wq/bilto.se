/*
  # Email OTP Codes

  ## Purpose
  Stores short-lived 6-digit one-time-password codes used to verify customer
  email addresses before form submission (sell flow and buy flow).

  ## Table: email_otp_codes
  - id            — primary key
  - email         — the address being verified (lowercase-trimmed)
  - code          — 6-digit numeric string (hashed with SHA-256 in the edge function before insert)
  - expires_at    — 10 minutes from creation
  - verified_at   — set when the code is successfully consumed
  - attempts      — how many wrong guesses; locked after 5
  - created_at    — audit timestamp

  ## Security
  - RLS enabled; no direct client access — all reads/writes go through edge
    functions using the service role key.
  - No policy grants access to anon or authenticated roles (service_role bypasses RLS).
  - Codes expire after 10 minutes; max 5 attempts before lockout.
  - Verified tokens are single-use (verified_at set on first successful verify).
*/

CREATE TABLE IF NOT EXISTS email_otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at timestamptz,
  attempts    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otp_codes_email_idx ON email_otp_codes (email, created_at DESC);

ALTER TABLE email_otp_codes ENABLE ROW LEVEL SECURITY;
-- No client-facing policies — edge functions use service_role which bypasses RLS.
