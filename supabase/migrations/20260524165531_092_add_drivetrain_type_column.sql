/*
  # Lägg till drivetrain_type kolumn och rätta bagage + drivlina

  1. Ny kolumn
     - `drivetrain_type` (text) – faktisk hjuldrift: "Framhjulsdrift", "Bakhjulsdrift", "Fyrhjulsdrift"

  2. Rättade värden
     - bagage_liter uppdateras med verkliga spec-värden för ~120 populära bilar
     - drivetrain_type sätts för samma bilar

  Källa: tillverkarnas officiella specifikationer (standardutförande/basvariant om ej annat anges)
*/

ALTER TABLE car_catalog ADD COLUMN IF NOT EXISTS drivetrain_type text;

-- ============================================================
-- TESLA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 854, drivetrain_type = 'Bakhjulsdrift' WHERE make = 'Tesla' AND model = 'Model Y';
UPDATE car_catalog SET bagage_liter = 594, drivetrain_type = 'Bakhjulsdrift' WHERE make = 'Tesla' AND model = 'Model 3';
UPDATE car_catalog SET bagage_liter = 745, drivetrain_type = 'Fyrhjulsdrift' WHERE make = 'Tesla' AND model = 'Model S';
UPDATE car_catalog SET bagage_liter = 709, drivetrain_type = 'Fyrhjulsdrift' WHERE make = 'Tesla' AND model = 'Model X';

-- ============================================================
-- VOLVO
-- ============================================================
UPDATE car_catalog SET bagage_liter = 460, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volvo' AND model = 'EX30';
UPDATE car_catalog SET bagage_liter = 460, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'EX30 Cross Country';
UPDATE car_catalog SET bagage_liter = 419, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volvo' AND model = 'EX40';
UPDATE car_catalog SET bagage_liter = 419, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volvo' AND model = 'EC40';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'EX60';
UPDATE car_catalog SET bagage_liter = 652, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'EX90';
UPDATE car_catalog SET bagage_liter = 476, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'XC40';
UPDATE car_catalog SET bagage_liter = 476, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'XC40 Recharge';
UPDATE car_catalog SET bagage_liter = 505, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'XC60';
UPDATE car_catalog SET bagage_liter = 640, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'XC90';
UPDATE car_catalog SET bagage_liter = 442, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'V60';
UPDATE car_catalog SET bagage_liter = 442, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'V60 Cross Country';
UPDATE car_catalog SET bagage_liter = 529, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'V90';
UPDATE car_catalog SET bagage_liter = 529, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'V90 Cross Country';
UPDATE car_catalog SET bagage_liter = 442, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'S60';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'S90';
UPDATE car_catalog SET bagage_liter = 335, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volvo' AND model = 'V40';
UPDATE car_catalog SET bagage_liter = 335, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'V40 Cross Country';
UPDATE car_catalog SET bagage_liter = 447, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'XC70';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'V70';
UPDATE car_catalog SET bagage_liter = 432, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volvo' AND model = 'ES90';

-- ============================================================
-- BMW
-- ============================================================
UPDATE car_catalog SET bagage_liter = 380, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '1-serie';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '3-serie';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '3-serie Touring';
UPDATE car_catalog SET bagage_liter = 470, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '4-serie Coupe';
UPDATE car_catalog SET bagage_liter = 470, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '4-serie Gran Coupe';
UPDATE car_catalog SET bagage_liter = 520, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '5-serie';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '7-serie';
UPDATE car_catalog SET bagage_liter = 470, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = 'i4';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = 'i5';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'i7';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'iX';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'iX1';
UPDATE car_catalog SET bagage_liter = 525, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'iX2';
UPDATE car_catalog SET bagage_liter = 510, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'iX3';
UPDATE car_catalog SET bagage_liter = 505, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X3';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X4';
UPDATE car_catalog SET bagage_liter = 650, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X5';
UPDATE car_catalog SET bagage_liter = 580, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X6';
UPDATE car_catalog SET bagage_liter = 315, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = 'Z4';
UPDATE car_catalog SET bagage_liter = 360, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = 'M2';
UPDATE car_catalog SET bagage_liter = 460, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'M3';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'M3 Touring';
UPDATE car_catalog SET bagage_liter = 440, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'M4';

-- ============================================================
-- MERCEDES-BENZ
-- ============================================================
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'A-Klass';
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'B-Klass';
UPDATE car_catalog SET bagage_liter = 455, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'C-Klass';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'C-Klass Kombi';
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'CLA';
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'CLA Electric';
UPDATE car_catalog SET bagage_liter = 540, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'E-Klass';
UPDATE car_catalog SET bagage_liter = 540, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'E-Klass Coupe';
UPDATE car_catalog SET bagage_liter = 540, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'E-Klass Kombi';
UPDATE car_catalog SET bagage_liter = 422, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'EQA';
UPDATE car_catalog SET bagage_liter = 495, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'EQB';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'EQC';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'EQE';
UPDATE car_catalog SET bagage_liter = 520, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'EQE SUV';
UPDATE car_catalog SET bagage_liter = 670, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'EQS SUV';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'GLA';
UPDATE car_catalog SET bagage_liter = 560, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'GLB';
UPDATE car_catalog SET bagage_liter = 560, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mercedes-Benz' AND model = 'GLB Electric';
UPDATE car_catalog SET bagage_liter = 620, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'GLC';
UPDATE car_catalog SET bagage_liter = 545, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'GLC Coupe';
UPDATE car_catalog SET bagage_liter = 620, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'GLC Electric';
UPDATE car_catalog SET bagage_liter = 825, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'GLE';
UPDATE car_catalog SET bagage_liter = 680, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'GLS';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'S-Klass';

-- ============================================================
-- AUDI
-- ============================================================
UPDATE car_catalog SET bagage_liter = 335, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Audi' AND model = 'A1';
UPDATE car_catalog SET bagage_liter = 380, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Audi' AND model = 'A3 Sportback';
UPDATE car_catalog SET bagage_liter = 425, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Audi' AND model = 'A3 Sedan';
UPDATE car_catalog SET bagage_liter = 495, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A4 Avant';
UPDATE car_catalog SET bagage_liter = 476, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A5';
UPDATE car_catalog SET bagage_liter = 476, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A5 Avant';
UPDATE car_catalog SET bagage_liter = 565, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A6 Avant';
UPDATE car_catalog SET bagage_liter = 502, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A6 Avant e-tron';
UPDATE car_catalog SET bagage_liter = 535, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A7';
UPDATE car_catalog SET bagage_liter = 510, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'A8';
UPDATE car_catalog SET bagage_liter = 405, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q2';
UPDATE car_catalog SET bagage_liter = 530, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q3';
UPDATE car_catalog SET bagage_liter = 530, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q3 Sportback';
UPDATE car_catalog SET bagage_liter = 520, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Audi' AND model = 'Q4 e-tron';
UPDATE car_catalog SET bagage_liter = 480, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Audi' AND model = 'Q4 e-tron Sportback';
UPDATE car_catalog SET bagage_liter = 620, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q5';
UPDATE car_catalog SET bagage_liter = 526, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q6 e-tron';
UPDATE car_catalog SET bagage_liter = 770, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q7';
UPDATE car_catalog SET bagage_liter = 605, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q8';
UPDATE car_catalog SET bagage_liter = 569, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'Q8 e-tron';
UPDATE car_catalog SET bagage_liter = 305, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'RS3';
UPDATE car_catalog SET bagage_liter = 305, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'S3';
UPDATE car_catalog SET bagage_liter = 340, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'RS Q3';
UPDATE car_catalog SET bagage_liter = 405, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Audi' AND model = 'e-tron GT';

-- ============================================================
-- VOLKSWAGEN
-- ============================================================
UPDATE car_catalog SET bagage_liter = 381, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'Golf';
UPDATE car_catalog SET bagage_liter = 272, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'Golf GTI';
UPDATE car_catalog SET bagage_liter = 272, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'Golf R';
UPDATE car_catalog SET bagage_liter = 272, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'Golf GTE';
UPDATE car_catalog SET bagage_liter = 385, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'Polo';
UPDATE car_catalog SET bagage_liter = 328, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'T-Cross';
UPDATE car_catalog SET bagage_liter = 445, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'T-Roc';
UPDATE car_catalog SET bagage_liter = 284, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'T-Roc Cabriolet';
UPDATE car_catalog SET bagage_liter = 338, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'Taigo';
UPDATE car_catalog SET bagage_liter = 543, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'ID.4';
UPDATE car_catalog SET bagage_liter = 549, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'ID.5';
UPDATE car_catalog SET bagage_liter = 385, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'ID.3';
UPDATE car_catalog SET bagage_liter = 532, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'ID.7';
UPDATE car_catalog SET bagage_liter = 532, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'ID.7 Tourer';
UPDATE car_catalog SET bagage_liter = 563, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'Tiguan';
UPDATE car_catalog SET bagage_liter = 830, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'Touareg';
UPDATE car_catalog SET bagage_liter = 615, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'Tayron';
UPDATE car_catalog SET bagage_liter = 565, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'Passat Variant';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Volkswagen' AND model = 'Arteon';

-- ============================================================
-- HYUNDAI
-- ============================================================
UPDATE car_catalog SET bagage_liter = 531, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Hyundai' AND model = 'IONIQ 5';
UPDATE car_catalog SET bagage_liter = 361, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Hyundai' AND model = 'IONIQ 5 N';
UPDATE car_catalog SET bagage_liter = 401, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Hyundai' AND model = 'IONIQ 6';
UPDATE car_catalog SET bagage_liter = 352, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'Kona';
UPDATE car_catalog SET bagage_liter = 352, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'Kona Electric';
UPDATE car_catalog SET bagage_liter = 513, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Hyundai' AND model = 'Tucson';
UPDATE car_catalog SET bagage_liter = 634, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Hyundai' AND model = 'Santa Fe';
UPDATE car_catalog SET bagage_liter = 350, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'i30';
UPDATE car_catalog SET bagage_liter = 602, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'i30 SW';

-- ============================================================
-- KIA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Kia' AND model = 'EV6';
UPDATE car_catalog SET bagage_liter = 333, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'EV3';
UPDATE car_catalog SET bagage_liter = 828, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Kia' AND model = 'EV9';
UPDATE car_catalog SET bagage_liter = 433, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Sportage';
UPDATE car_catalog SET bagage_liter = 739, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Kia' AND model = 'Sorento';
UPDATE car_catalog SET bagage_liter = 352, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Niro';
UPDATE car_catalog SET bagage_liter = 380, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Ceed';
UPDATE car_catalog SET bagage_liter = 600, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Ceed SW';

-- ============================================================
-- POLESTAR
-- ============================================================
UPDATE car_catalog SET bagage_liter = 405, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Polestar' AND model = '2';
UPDATE car_catalog SET bagage_liter = 484, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Polestar' AND model = '3';
UPDATE car_catalog SET bagage_liter = 526, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Polestar' AND model = '4';

-- ============================================================
-- PORSCHE
-- ============================================================
UPDATE car_catalog SET bagage_liter = 405, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Porsche' AND model = 'Taycan';
UPDATE car_catalog SET bagage_liter = 671, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Porsche' AND model = 'Cayenne';
UPDATE car_catalog SET bagage_liter = 540, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Porsche' AND model = 'Macan';
UPDATE car_catalog SET bagage_liter = 495, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Porsche' AND model = 'Panamera';
UPDATE car_catalog SET bagage_liter = 150, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Porsche' AND model = '718 Boxster';
UPDATE car_catalog SET bagage_liter = 150, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Porsche' AND model = '718 Cayman';
UPDATE car_catalog SET bagage_liter = 150, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Porsche' AND model = '718 Spyder';
UPDATE car_catalog SET bagage_liter = 132, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Porsche' AND model = '911';

-- ============================================================
-- TOYOTA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 452, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Toyota' AND model = 'RAV4';
UPDATE car_catalog SET bagage_liter = 452, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Toyota' AND model = 'bZ4X';
UPDATE car_catalog SET bagage_liter = 413, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'Corolla Hybrid';
UPDATE car_catalog SET bagage_liter = 581, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'Corolla Touring Sports';
UPDATE car_catalog SET bagage_liter = 387, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'C-HR';
UPDATE car_catalog SET bagage_liter = 286, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'Yaris';
UPDATE car_catalog SET bagage_liter = 397, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Toyota' AND model = 'Yaris Cross';
UPDATE car_catalog SET bagage_liter = 217, drivetrain_type = 'Fyrhulsdrift'   WHERE make = 'Toyota' AND model = 'GR Yaris';
UPDATE car_catalog SET bagage_liter = 438, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'Prius';
UPDATE car_catalog SET bagage_liter = 172, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Toyota' AND model = 'Supra';
UPDATE car_catalog SET bagage_liter = 314, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'Urban Cruiser';
-- GR Yaris rättelse (stavfel ovan)
UPDATE car_catalog SET drivetrain_type = 'Fyrhjulsdrift' WHERE make = 'Toyota' AND model = 'GR Yaris';

-- ============================================================
-- SKODA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 385, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Skoda' AND model = 'Fabia';
UPDATE car_catalog SET bagage_liter = 385, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Skoda' AND model = 'Octavia';
UPDATE car_catalog SET bagage_liter = 640, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Skoda' AND model = 'Octavia Combi';
UPDATE car_catalog SET bagage_liter = 585, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Skoda' AND model = 'Superb';
UPDATE car_catalog SET bagage_liter = 660, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Skoda' AND model = 'Superb Combi';
UPDATE car_catalog SET bagage_liter = 372, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Skoda' AND model = 'Kamiq';
UPDATE car_catalog SET bagage_liter = 521, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Skoda' AND model = 'Karoq';
UPDATE car_catalog SET bagage_liter = 630, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Skoda' AND model = 'Kodiaq';
UPDATE car_catalog SET bagage_liter = 585, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Skoda' AND model = 'Enyaq';

-- ============================================================
-- FORD
-- ============================================================
UPDATE car_catalog SET bagage_liter = 402, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Ford' AND model = 'Focus';
UPDATE car_catalog SET bagage_liter = 575, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Ford' AND model = 'Focus Kombi';
UPDATE car_catalog SET bagage_liter = 298, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Ford' AND model = 'Focus RS';
UPDATE car_catalog SET bagage_liter = 402, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Ford' AND model = 'Focus ST';
UPDATE car_catalog SET bagage_liter = 575, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Ford' AND model = 'Focus ST Kombi';
UPDATE car_catalog SET bagage_liter = 475, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Ford' AND model = 'Kuga';
UPDATE car_catalog SET bagage_liter = 420, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Ford' AND model = 'Mustang';
UPDATE car_catalog SET bagage_liter = 402, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Ford' AND model = 'Mustang Mach-E';
UPDATE car_catalog SET bagage_liter = 412, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Ford' AND model = 'Explorer';
UPDATE car_catalog SET bagage_liter = 300, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Ford' AND model = 'Puma';

-- ============================================================
-- RENAULT
-- ============================================================
UPDATE car_catalog SET bagage_liter = 440, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Austral';
UPDATE car_catalog SET bagage_liter = 332, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Captur';
UPDATE car_catalog SET bagage_liter = 391, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Clio';
UPDATE car_catalog SET bagage_liter = 472, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Megane E-Tech';
UPDATE car_catalog SET bagage_liter = 545, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Scenic';
UPDATE car_catalog SET bagage_liter = 402, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Zoe';
UPDATE car_catalog SET bagage_liter = 331, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = '5 E-Tech';
UPDATE car_catalog SET bagage_liter = 420, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = '4 E-Tech';
UPDATE car_catalog SET bagage_liter = 391, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Arkana';

-- ============================================================
-- NISSAN
-- ============================================================
UPDATE car_catalog SET bagage_liter = 468, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Nissan' AND model = 'Leaf';
UPDATE car_catalog SET bagage_liter = 468, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Nissan' AND model = 'Ariya';
UPDATE car_catalog SET bagage_liter = 504, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Nissan' AND model = 'Qashqai';
UPDATE car_catalog SET bagage_liter = 585, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Nissan' AND model = 'X-Trail';

-- ============================================================
-- LAND ROVER
-- ============================================================
UPDATE car_catalog SET bagage_liter = 786, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Land Rover' AND model = 'Defender';
UPDATE car_catalog SET bagage_liter = 467, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Land Rover' AND model = 'Discovery Sport';
UPDATE car_catalog SET bagage_liter = 818, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Land Rover' AND model = 'Range Rover';
UPDATE car_catalog SET bagage_liter = 591, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Land Rover' AND model = 'Range Rover Sport';
UPDATE car_catalog SET bagage_liter = 591, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Land Rover' AND model = 'Range Rover Velar';
UPDATE car_catalog SET bagage_liter = 422, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Land Rover' AND model = 'Range Rover Evoque';

-- ============================================================
-- MAZDA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 422, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mazda' AND model = 'CX-30';
UPDATE car_catalog SET bagage_liter = 522, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mazda' AND model = 'CX-5';
UPDATE car_catalog SET bagage_liter = 570, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mazda' AND model = 'CX-60';
UPDATE car_catalog SET bagage_liter = 350, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mazda' AND model = 'Mazda3';
UPDATE car_catalog SET bagage_liter = 127, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mazda' AND model = 'MX-5';

-- ============================================================
-- OPEL / VAUXHALL
-- ============================================================
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Opel' AND model = 'Corsa';
UPDATE car_catalog SET bagage_liter = 422, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Opel' AND model = 'Astra';
UPDATE car_catalog SET bagage_liter = 390, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Opel' AND model = 'Crossland';
UPDATE car_catalog SET bagage_liter = 514, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Opel' AND model = 'Grandland';
UPDATE car_catalog SET bagage_liter = 310, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Opel' AND model = 'Mokka-e';

-- ============================================================
-- MINI
-- ============================================================
UPDATE car_catalog SET bagage_liter = 211, drivetrain_type = 'Framhjulsdrift' WHERE make = 'MINI' AND model = 'Cooper';
UPDATE car_catalog SET bagage_liter = 278, drivetrain_type = 'Framhjulsdrift' WHERE make = 'MINI' AND model = '5-door';
UPDATE car_catalog SET bagage_liter = 160, drivetrain_type = 'Framhjulsdrift' WHERE make = 'MINI' AND model = 'Convertible';
UPDATE car_catalog SET bagage_liter = 450, drivetrain_type = 'Framhjulsdrift' WHERE make = 'MINI' AND model = 'Countryman';
UPDATE car_catalog SET bagage_liter = 211, drivetrain_type = 'Framhjulsdrift' WHERE make = 'MINI' AND model = 'JCW';

-- ============================================================
-- SEAT / CUPRA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 355, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Seat' AND model = 'Leon';
UPDATE car_catalog SET bagage_liter = 355, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Seat' AND model = 'Ibiza';
UPDATE car_catalog SET bagage_liter = 510, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Seat' AND model = 'Ateca';
UPDATE car_catalog SET bagage_liter = 785, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Seat' AND model = 'Tarraco';
UPDATE car_catalog SET bagage_liter = 355, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Cupra' AND model = 'Leon';
UPDATE car_catalog SET bagage_liter = 420, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Cupra' AND model = 'Formentor';
UPDATE car_catalog SET bagage_liter = 510, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Cupra' AND model = 'Ateca';
UPDATE car_catalog SET bagage_liter = 540, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Cupra' AND model = 'Tavascan';
UPDATE car_catalog SET bagage_liter = 480, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Cupra' AND model = 'Born';
UPDATE car_catalog SET bagage_liter = 540, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Cupra' AND model = 'Terramar';

-- ============================================================
-- PEUGEOT
-- ============================================================
UPDATE car_catalog SET bagage_liter = 390, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '308';
UPDATE car_catalog SET bagage_liter = 548, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '308 SW';
UPDATE car_catalog SET bagage_liter = 390, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '408';
UPDATE car_catalog SET bagage_liter = 516, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Peugeot' AND model = '3008';
UPDATE car_catalog SET bagage_liter = 259, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '208';
UPDATE car_catalog SET bagage_liter = 434, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '2008';
UPDATE car_catalog SET bagage_liter = 516, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-3008';
UPDATE car_catalog SET bagage_liter = 390, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-308';
UPDATE car_catalog SET bagage_liter = 548, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-308 SW';

-- ============================================================
-- BYD
-- ============================================================
UPDATE car_catalog SET bagage_liter = 440, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BYD' AND model = 'Atto 3';
UPDATE car_catalog SET bagage_liter = 308, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BYD' AND model = 'Dolphin';
UPDATE car_catalog SET bagage_liter = 410, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BYD' AND model = 'Han';
UPDATE car_catalog SET bagage_liter = 420, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BYD' AND model = 'Seal U';
UPDATE car_catalog SET bagage_liter = 402, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BYD' AND model = 'Seal';
UPDATE car_catalog SET bagage_liter = 670, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BYD' AND model = 'Tang';

-- ============================================================
-- HONDA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 420, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'Civic';
UPDATE car_catalog SET bagage_liter = 420, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'Civic Type R';
UPDATE car_catalog SET bagage_liter = 497, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Honda' AND model = 'CR-V';
UPDATE car_catalog SET bagage_liter = 362, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'HR-V';
UPDATE car_catalog SET bagage_liter = 304, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'Jazz';
UPDATE car_catalog SET bagage_liter = 346, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'ZR-V';
UPDATE car_catalog SET bagage_liter = 361, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'e:Ny1';

-- ============================================================
-- LEXUS
-- ============================================================
UPDATE car_catalog SET bagage_liter = 376, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Lexus' AND model = 'CT';
UPDATE car_catalog SET bagage_liter = 454, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Lexus' AND model = 'IS';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Lexus' AND model = 'ES';
UPDATE car_catalog SET bagage_liter = 560, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lexus' AND model = 'RX';
UPDATE car_catalog SET bagage_liter = 612, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lexus' AND model = 'NX';
UPDATE car_catalog SET bagage_liter = 284, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Lexus' AND model = 'UX';

-- ============================================================
-- DACIA
-- ============================================================
UPDATE car_catalog SET bagage_liter = 472, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Dacia' AND model = 'Duster';
UPDATE car_catalog SET bagage_liter = 708, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Dacia' AND model = 'Jogger';
UPDATE car_catalog SET bagage_liter = 328, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Dacia' AND model = 'Sandero';
UPDATE car_catalog SET bagage_liter = 308, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Dacia' AND model = 'Spring';
