/*
  # Remove duplicate car_catalog entries

  ## Summary
  The car_catalog table contains duplicate entries where the same car model
  appears under both English and Swedish names, or with slight naming variations.
  In each case, the Swedish/localized version has a real image and is kept.
  The duplicates (English names, no image) are removed.

  ## Duplicates removed

  ### BMW — English "Series" vs Swedish "serie"
  - "1 Series" (no image) → kept "1-serie"
  - "2 Series Coupe" (no image) → kept "2-serie Gran Coupe"
  - "2 Series Gran Coupe" (no image) → kept "2-serie Gran Coupe"
  - "2-serie Coupe" (no image) → kept "2-serie Gran Coupe"
  - "3 Series" (no image) → kept "3-serie"
  - "3 Series Touring" (no image) → kept "3-serie Touring"
  - "4 Series" (no image) → kept "4-serie Coupe"
  - "4 Series Gran Coupe" (no image) → kept "4-serie Gran Coupe"
  - "5 Series" (no image) → kept "5-serie"
  - "5 Series Touring" (no image) → kept "5-serie" (no separate touring entry needed)
  - "M4 Coupe" (no image) → kept "M4"

  ### Mercedes-Benz — English class names vs Swedish "Klass"
  - "A-Class" (no image) → kept "A-Klass"
  - "AMG A45" duplicate → "A45 AMG" has image; remove "AMG A45"
  - "C-Class Estate" (no image) → kept "C-Klass Kombi"
  - "C-Class Saloon" (no image) → kept "C-Klass"
  - "E-Class" (no image) → kept "E-Klass"
  - "G-Class" (no image) → kept "G-Klass"

  ### Audi — naming variants
  - "A3 Saloon" (no image) → kept "A3 Sedan"
  - "Q4 Sportback e-tron" (no image) → kept "Q4 e-tron Sportback"
  - "RS3 Saloon" (no image) → kept "RS3 Sedan"
  - "S3 Sportback" (no image) → kept "S3 Sedan"

  ### Skoda
  - "Superb Kombi" (no image) → kept "Superb Combi"
*/

DELETE FROM car_catalog WHERE make = 'BMW' AND model IN (
  '1 Series',
  '2 Series Coupe',
  '2 Series Gran Coupe',
  '2-serie Coupe',
  '3 Series',
  '3 Series Touring',
  '4 Series',
  '4 Series Gran Coupe',
  '5 Series',
  '5 Series Touring',
  'M4 Coupe'
);

DELETE FROM car_catalog WHERE make = 'Mercedes-Benz' AND model IN (
  'A-Class',
  'AMG A45',
  'C-Class Estate',
  'C-Class Saloon',
  'E-Class',
  'G-Class'
);

DELETE FROM car_catalog WHERE make = 'Audi' AND model IN (
  'A3 Saloon',
  'Q4 Sportback e-tron',
  'RS3 Saloon',
  'S3 Sportback'
);

DELETE FROM car_catalog WHERE make = 'Skoda' AND model = 'Superb Kombi';
