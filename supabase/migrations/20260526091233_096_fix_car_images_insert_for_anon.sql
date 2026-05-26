/*
  # Fix car_images INSERT policy for anon users

  ## Problem
  The car_images INSERT policy checks:
    EXISTS (SELECT 1 FROM cars c WHERE c.id = car_images.car_id AND c.status = 'ny')

  But the cars SELECT policies only allow authenticated roles to read cars.
  When an anonymous user (sell flow) tries to insert car_images, the subquery
  in the policy returns nothing because anon cannot SELECT from cars — so the
  INSERT is denied even though the car was just created.

  ## Fix
  1. Drop the broken policy.
  2. Create a SECURITY DEFINER helper function that bypasses RLS to check
     whether a car exists with status 'ny' — callable by anon.
  3. Re-create the car_images INSERT policy using this function.
*/

-- Helper function: check if a car with given id has status 'ny', bypasses RLS
CREATE OR REPLACE FUNCTION public.car_is_new(p_car_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cars WHERE id = p_car_id AND status = 'ny'
  );
$$;

REVOKE ALL ON FUNCTION public.car_is_new(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.car_is_new(uuid) TO anon, authenticated;

-- Drop old broken policy
DROP POLICY IF EXISTS "Public can upload images for a new car" ON car_images;

-- Re-create using security-definer function so anon can pass the check
CREATE POLICY "Public can upload images for a new car"
  ON car_images
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (car_is_new(car_id));
