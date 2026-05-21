/*
  # Deduplicate Audi models in car_catalog

  ## Summary
  Several Audi models exist as both a generic entry and a body-style variant,
  causing duplicates in search results. The rule applied:
  - When a generic model (e.g. "A3") and specific variants (e.g. "A3 Sedan",
    "A3 Sportback") coexist, remove the generic entry.
  - When two entries represent the same car under different names, keep the
    one with a real image.

  ## Removed entries
  - "A1 Sportback" → duplicate of "A1" (A1 is only sold as Sportback anyway)
  - "A3" (generic, no suffix) → kept "A3 Sedan" and "A3 Sportback"
  - "A6" (generic) → kept "A6 Avant"
  - "RS3 Sedan" → duplicate of "RS3"
  - "S3 Sedan" → rename to "S3" (only sold as Sedan/Sportback; generic name cleaner)
  - "Q5 Sportback" (no image) → kept "Q5"
  - "Q6 e-tron Sportback" (no image) → kept "Q6 e-tron"
  - "e-tron" (old name for Q8 e-tron, no image) → kept "Q8 e-tron"
*/

-- Remove generic/duplicate Audi entries
DELETE FROM car_catalog
WHERE make = 'Audi' AND model IN (
  'A1 Sportback',
  'A3',
  'A6',
  'RS3 Sedan',
  'Q5 Sportback',
  'Q6 e-tron Sportback',
  'e-tron'
);

-- Rename "S3 Sedan" to "S3" for cleaner display
UPDATE car_catalog
SET model = 'S3'
WHERE make = 'Audi' AND model = 'S3 Sedan';
