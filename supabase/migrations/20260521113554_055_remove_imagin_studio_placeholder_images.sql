/*
  # Remove imagin.studio placeholder images

  ## Summary
  The car_catalog table contains two columns with imagin.studio URLs
  (customer=hrjavascript-mastery). These are demo/watermarked placeholder
  images, not real car photos.

  ## Changes
  1. `cleaned_image_url` — all 417 values are imagin.studio URLs → set all to NULL
  2. `image_url` — 59 rows have imagin.studio URLs (no real photo available) → set to NULL
     The remaining 318 rows have real Supabase Storage URLs and are left untouched.

  ## Result
  Cars without a real photo will show the fallback car icon instead of a
  watermarked grey placeholder. No real images are deleted.
*/

-- Clear the entire cleaned_image_url column (100% imagin.studio demo URLs)
UPDATE car_catalog
SET cleaned_image_url = NULL
WHERE cleaned_image_url LIKE '%imagin.studio%';

-- Clear image_url only where it still points to imagin.studio
UPDATE car_catalog
SET image_url = NULL
WHERE image_url LIKE '%imagin.studio%';
