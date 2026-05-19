/*
  # Insert BMW, Mercedes-Benz and Audi models into car_catalog

  ## Summary
  Inserts all BMW, Mercedes-Benz and Audi models from external data source into the
  car_catalog table. Uses INSERT ... WHERE NOT EXISTS to avoid duplicates.

  ## New data
  - 23 BMW models (1 Series through M3)
  - 23 Mercedes-Benz models (A-Class through EQE SUV)
  - 23 Audi models (A1 Sportback through e-tron GT)

  ## Notes
  - image_url left NULL — to be matched later
  - Duplicate (make, model) combinations are safely skipped
*/

INSERT INTO car_catalog (make, model)
SELECT make, model FROM (VALUES
  -- BMW
  ('BMW', '1 Series'),
  ('BMW', 'X1'),
  ('BMW', 'iX3'),
  ('BMW', 'X3'),
  ('BMW', 'X5'),
  ('BMW', '3 Series'),
  ('BMW', '3 Series Touring'),
  ('BMW', 'iX1'),
  ('BMW', '2 Series Coupe'),
  ('BMW', 'iX'),
  ('BMW', 'M2'),
  ('BMW', 'i4'),
  ('BMW', '2 Series Gran Coupe'),
  ('BMW', 'M3 Touring'),
  ('BMW', '5 Series'),
  ('BMW', 'X7'),
  ('BMW', 'X2'),
  ('BMW', 'iX2'),
  ('BMW', '4 Series'),
  ('BMW', '4 Series Gran Coupe'),
  ('BMW', 'M4 Coupe'),
  ('BMW', '5 Series Touring'),
  ('BMW', 'M3'),
  -- Mercedes-Benz
  ('Mercedes-Benz', 'CLA Electric'),
  ('Mercedes-Benz', 'A-Class'),
  ('Mercedes-Benz', 'GLC'),
  ('Mercedes-Benz', 'GLA'),
  ('Mercedes-Benz', 'CLA'),
  ('Mercedes-Benz', 'GLC Electric'),
  ('Mercedes-Benz', 'GLB'),
  ('Mercedes-Benz', 'C-Class Saloon'),
  ('Mercedes-Benz', 'AMG A35'),
  ('Mercedes-Benz', 'GLE'),
  ('Mercedes-Benz', 'E-Class'),
  ('Mercedes-Benz', 'EQA'),
  ('Mercedes-Benz', 'AMG A45'),
  ('Mercedes-Benz', 'G-Class Electric'),
  ('Mercedes-Benz', 'EQB'),
  ('Mercedes-Benz', 'CLE Coupe'),
  ('Mercedes-Benz', 'G-Class'),
  ('Mercedes-Benz', 'GLC Coupe'),
  ('Mercedes-Benz', 'CLE Cabriolet'),
  ('Mercedes-Benz', 'C-Class Estate'),
  ('Mercedes-Benz', 'AMG CLE 53'),
  ('Mercedes-Benz', 'GLB Electric'),
  ('Mercedes-Benz', 'EQE SUV'),
  -- Audi
  ('Audi', 'Q3'),
  ('Audi', 'A3 Sportback'),
  ('Audi', 'Q4 e-tron'),
  ('Audi', 'A1 Sportback'),
  ('Audi', 'Q5'),
  ('Audi', 'Q3 Sportback'),
  ('Audi', 'Q2'),
  ('Audi', 'Q6 e-tron'),
  ('Audi', 'Q7'),
  ('Audi', 'RS3'),
  ('Audi', 'A3 Saloon'),
  ('Audi', 'A5'),
  ('Audi', 'A5 Avant'),
  ('Audi', 'Q4 Sportback e-tron'),
  ('Audi', 'A6 Avant'),
  ('Audi', 'S3 Sportback'),
  ('Audi', 'A6 Avant e-tron'),
  ('Audi', 'Q5 Sportback'),
  ('Audi', 'RS3 Saloon'),
  ('Audi', 'Q8'),
  ('Audi', 'A6'),
  ('Audi', 'Q6 e-tron Sportback'),
  ('Audi', 'e-tron GT')
) AS v(make, model)
WHERE NOT EXISTS (
  SELECT 1 FROM car_catalog c
  WHERE c.make = v.make AND c.model = v.model
);
