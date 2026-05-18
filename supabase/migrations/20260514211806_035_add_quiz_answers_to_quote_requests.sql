/*
  # Add quiz_answers column to quote_requests

  1. Modified Tables
    - `quote_requests`
      - `quiz_answers` (jsonb, nullable) - Stores structured quiz answers as JSON
        so an expert can review the customer's preferences (body type, fuel,
        budget range, priorities, brand preference, etc.)

  2. Notes
    - Column is nullable since not all quote requests come through the quiz
    - JSONB allows flexible querying and display in admin panel
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'quiz_answers'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN quiz_answers jsonb;
  END IF;
END $$;
