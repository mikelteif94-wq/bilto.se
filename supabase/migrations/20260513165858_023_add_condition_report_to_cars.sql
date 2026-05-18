/*
  # Add structured condition report to cars

  1. Schema changes
    - Add `condition_report` (jsonb, nullable) to `cars` table.
      Stores structured checklist data: mechanical, cosmetic, interior, history.
      Null means "not yet submitted" so we can prompt customers/dealers to fill it in.

  2. Notes
    - Schema is intentionally flexible (jsonb) — frontend ConditionReportForm
      defines the canonical shape (sections with item statuses: ok / anmark / allvarligt).
    - No RLS changes needed; existing policies on cars already allow read access.
      Updates from unauthenticated customers happen via the `customer-car` edge function
      using the service role.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'condition_report'
  ) THEN
    ALTER TABLE cars ADD COLUMN condition_report jsonb;
  END IF;
END $$;
