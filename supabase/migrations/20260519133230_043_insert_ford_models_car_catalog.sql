/*
  # Insert Ford models into car_catalog

  Adds all Ford models used in the comparison tool to the car_catalog table.
  Existing entries (Kuga, Mustang Mach-E, Ranger) are left untouched via ON CONFLICT DO NOTHING.

  New entries:
    - Ford Focus (halvkombi)
    - Ford Focus Kombi
    - Ford Focus ST
    - Ford Focus ST Kombi
    - Ford Focus RS
    - Ford Focus Vignale
    - Ford Focus Vignale Kombi
    - Ford Focus Active
    - Ford Puma
    - Ford Explorer
    - Ford Mustang

  image_url is left NULL — images will be uploaded manually.
*/

INSERT INTO car_catalog (make, model)
SELECT make, model FROM (VALUES
  ('Ford', 'Focus'),
  ('Ford', 'Focus Kombi'),
  ('Ford', 'Focus ST'),
  ('Ford', 'Focus ST Kombi'),
  ('Ford', 'Focus RS'),
  ('Ford', 'Focus Vignale'),
  ('Ford', 'Focus Vignale Kombi'),
  ('Ford', 'Focus Active'),
  ('Ford', 'Puma'),
  ('Ford', 'Explorer'),
  ('Ford', 'Mustang')
) AS v(make, model)
WHERE NOT EXISTS (
  SELECT 1 FROM car_catalog c WHERE c.make = v.make AND c.model = v.model
);
