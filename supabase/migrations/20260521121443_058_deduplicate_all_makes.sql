/*
  # Deduplicate remaining car_catalog entries across all makes

  ## Summary
  After reviewing all makes, the following entries are genuine duplicates
  or redundant generic entries where a more specific entry already exists.

  ## Changes

  ### Volvo
  - "EC40" is the renamed version of "C40 Recharge" (same car, new name from 2024)
    → Remove "C40 Recharge", keep "EC40"
  - "XC40 Recharge" is the EV version of XC40 → these ARE different cars, keep both

  ### Ford Focus
  - "Focus Active" (no image) is a trim level of Focus, not a separate model
    → Remove "Focus Active", covered by "Focus"
  - "Focus Vignale" and "Focus Vignale Kombi" are premium trims, redundant
    with Focus / Focus Kombi → Remove both

  ### Mercedes-Benz
  - "AMG A35" (no image) is a trim of A-Klass, "A45 AMG" already covers AMG A-Klass
    → Remove "AMG A35"
  - "G-Class Electric" (no image) is a new separate model, keep it
  - "GLB Electric" and "GLC Electric" are separate models, keep them

  ### Hyundai
  - "Kona" (generic, has image) and "Kona Electric" (no image) coexist
    The Kona Electric is a separate model since 2023 → keep both
  - "IONIQ" (old hybrid, 2016-2022) is different from IONIQ 5/6 → keep all

  ### Skoda
  - "Octavia" + "Octavia Combi" → different bodies, keep both
  - "Superb" + "Superb Combi" → different bodies, keep both
*/

-- Volvo: EC40 replaced C40 Recharge name
DELETE FROM car_catalog WHERE make = 'Volvo' AND model = 'C40 Recharge';

-- Ford: remove redundant Focus trim levels
DELETE FROM car_catalog WHERE make = 'Ford' AND model IN (
  'Focus Active',
  'Focus Vignale',
  'Focus Vignale Kombi'
);

-- Mercedes: AMG A35 is redundant with A45 AMG
DELETE FROM car_catalog WHERE make = 'Mercedes-Benz' AND model = 'AMG A35';
