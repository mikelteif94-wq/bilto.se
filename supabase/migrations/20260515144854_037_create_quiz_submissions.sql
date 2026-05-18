/*
  # Create quiz_submissions table

  1. New Tables
    - `quiz_submissions`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text, not null) - Customer's name
      - `email` (text, nullable) - Customer's email (optional)
      - `phone` (text, not null) - Customer's phone number
      - `quiz_answers` (jsonb, not null) - Full quiz answers object
      - `selected_cars` (jsonb, not null) - Array of selected car objects
      - `created_at` (timestamptz) - Submission timestamp

  2. Security
    - Enable RLS on `quiz_submissions` table
    - Public insert policy (customers are not logged in when submitting)
    - Admin-only read/delete policy via admin_users table
*/

CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text DEFAULT '',
  phone text NOT NULL,
  quiz_answers jsonb NOT NULL DEFAULT '{}',
  selected_cars jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (customers are not authenticated)
CREATE POLICY "Anyone can submit quiz results"
  ON quiz_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read submissions
CREATE POLICY "Admins can read quiz submissions"
  ON quiz_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Only admins can delete submissions
CREATE POLICY "Admins can delete quiz submissions"
  ON quiz_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
