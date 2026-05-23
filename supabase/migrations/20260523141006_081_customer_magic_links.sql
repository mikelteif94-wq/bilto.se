/*
  # Customer Magic Links

  ## Purpose
  Passwordless login for the customer portal via secure single-use tokens.

  ## New Table: customer_magic_links
  - id: uuid primary key
  - email: the email address the link was sent to
  - token_hash: SHA-256 hash of the random token (never store plaintext)
  - expires_at: 30 minutes from creation
  - used_at: timestamp when the token was consumed (null = unused)
  - created_at: auto timestamp

  ## Security
  - RLS enabled; only service role may read/write (all client access via edge functions)
  - Tokens expire after 30 minutes
  - Single-use: used_at is set on first redemption
  - Rate limiting enforced in edge function (max 5 sends per email per hour)
  - Old tokens for the same email are NOT invalidated on new request
    (allows "send again" without breaking the first link if it hasn't been used)
*/

CREATE TABLE IF NOT EXISTS customer_magic_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_magic_links_email_idx ON customer_magic_links (email);
CREATE INDEX IF NOT EXISTS customer_magic_links_token_hash_idx ON customer_magic_links (token_hash);

ALTER TABLE customer_magic_links ENABLE ROW LEVEL SECURITY;

-- No client-side policies: all access goes through service-role edge functions.
-- This means unauthenticated/authenticated users cannot read or write this table directly.
