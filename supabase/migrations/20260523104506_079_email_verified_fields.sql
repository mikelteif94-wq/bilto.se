/*
  # Add email_verified fields to customers and quote_requests

  ## Purpose
  Permanently records that a customer's email address was verified via OTP
  before form submission. This flag is checked server-side before any
  bid acceptance or deal confirmation is allowed.

  ## Changes

  ### customers table
  - `email_verified` (boolean, default false) — true after OTP confirmed
  - `email_verified_at` (timestamptz, nullable) — when verification occurred

  ### quote_requests table
  - `email_verified` (boolean, default false)
  - `email_verified_at` (timestamptz, nullable)

  ## Notes
  - Existing rows get email_verified = false (safe default — they predate OTP)
  - Server-side enforcement is added in the customer-car edge function
  - No RLS changes needed (columns follow existing table policies)
*/

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
