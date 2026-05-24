/*
  # Fyll drivetrain_type och rätta bagage_liter för resterande ~148 bilar

  Täcker alla bilar som saknade drivetrain_type efter migration 092.
  Källa: tillverkarnas officiella specifikationer.
*/

-- ============================================================
-- ALFA ROMEO
-- ============================================================
UPDATE car_catalog SET bagage_liter = 435, drivetrain_type = 'Fyrhjulsdrift' WHERE make = 'Alfa Romeo' AND model = 'Tonale';

-- ============================================================
-- BMW (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BMW' AND model = '2-serie Gran Coupe';
UPDATE car_catalog SET bagage_liter = 500, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'BMW' AND model = '6-serie GT';
UPDATE car_catalog SET bagage_liter = 390, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'M240i';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X1';
UPDATE car_catalog SET bagage_liter = 525, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X2';
UPDATE car_catalog SET bagage_liter = 750, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'BMW' AND model = 'X7';

-- ============================================================
-- BYD (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 220, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BYD' AND model = 'Seagull';
UPDATE car_catalog SET bagage_liter = 502, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BYD' AND model = 'Seal Tourer';
UPDATE car_catalog SET bagage_liter = 440, drivetrain_type = 'Framhjulsdrift' WHERE make = 'BYD' AND model = 'Yuan Plus';

-- ============================================================
-- CITROEN
-- ============================================================
UPDATE car_catalog SET bagage_liter = 580, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Citroen' AND model = 'C5 Aircross';
UPDATE car_catalog SET bagage_liter = 380, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Citroen' AND model = 'e-C4';

-- ============================================================
-- DS
-- ============================================================
UPDATE car_catalog SET bagage_liter = 350, drivetrain_type = 'Framhjulsdrift' WHERE make = 'DS' AND model = '3 Crossback';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Framhjulsdrift' WHERE make = 'DS' AND model = '4';
UPDATE car_catalog SET bagage_liter = 555, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'DS' AND model = '7 Crossback';

-- ============================================================
-- FIAT
-- ============================================================
UPDATE car_catalog SET bagage_liter = 140, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Fiat' AND model = '124 Spider';
UPDATE car_catalog SET bagage_liter = 185, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = '500';
UPDATE car_catalog SET bagage_liter = 185, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = '500e';
UPDATE car_catalog SET bagage_liter = 400, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = '500L';
UPDATE car_catalog SET bagage_liter = 400, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = '500X';
UPDATE car_catalog SET bagage_liter = 360, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = '600';
UPDATE car_catalog SET bagage_liter = 790, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = 'Doblo';
UPDATE car_catalog SET bagage_liter = 200, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = 'Panda';
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Fiat' AND model = 'Tipo Cross';

-- ============================================================
-- FORD (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 897, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Ford' AND model = 'Ranger';

-- ============================================================
-- GENESIS
-- ============================================================
UPDATE car_catalog SET bagage_liter = 432, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Genesis' AND model = 'GV60';
UPDATE car_catalog SET bagage_liter = 503, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Genesis' AND model = 'GV70';

-- ============================================================
-- HONDA (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 171, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Honda' AND model = 'e';
UPDATE car_catalog SET bagage_liter = 304, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Honda' AND model = 'Prelude';

-- ============================================================
-- HYUNDAI (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 411, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'Bayon';
UPDATE car_catalog SET bagage_liter = 252, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'i10';
UPDATE car_catalog SET bagage_liter = 352, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'i20';
UPDATE car_catalog SET bagage_liter = 352, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'i20 N';
UPDATE car_catalog SET bagage_liter = 553, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'i40 SW';
UPDATE car_catalog SET bagage_liter = 280, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'Inster';
UPDATE car_catalog SET bagage_liter = 443, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'IONIQ';
UPDATE car_catalog SET bagage_liter = 312, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'ix20';
UPDATE car_catalog SET bagage_liter = 591, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Hyundai' AND model = 'ix35';
UPDATE car_catalog SET bagage_liter = 374, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Hyundai' AND model = 'Kona N';
UPDATE car_catalog SET bagage_liter = 800, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Hyundai' AND model = 'Staria';

-- ============================================================
-- JAGUAR
-- ============================================================
UPDATE car_catalog SET bagage_liter = 505, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Jaguar' AND model = 'I-Pace';

-- ============================================================
-- JEEP
-- ============================================================
UPDATE car_catalog SET bagage_liter = 355, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Jeep' AND model = 'Avenger';

-- ============================================================
-- KIA (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Kia' AND model = 'EV4';
UPDATE car_catalog SET bagage_liter = 533, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Kia' AND model = 'EV5';
UPDATE car_catalog SET bagage_liter = 440, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'K4';
UPDATE car_catalog SET bagage_liter = 510, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Kia' AND model = 'Optima SW';
UPDATE car_catalog SET bagage_liter = 255, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Picanto';
UPDATE car_catalog SET bagage_liter = 594, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'ProCeed';
UPDATE car_catalog SET bagage_liter = 300, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Rio';
UPDATE car_catalog SET bagage_liter = 315, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Soul';
UPDATE car_catalog SET bagage_liter = 361, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Kia' AND model = 'Stinger';
UPDATE car_catalog SET bagage_liter = 352, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'Stonic';
UPDATE car_catalog SET bagage_liter = 426, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Kia' AND model = 'XCeed';

-- ============================================================
-- LAMBORGHINI
-- ============================================================
UPDATE car_catalog SET bagage_liter = 150, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lamborghini' AND model = 'Aventador SVJ';
UPDATE car_catalog SET bagage_liter = 100, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lamborghini' AND model = 'Huracan';
UPDATE car_catalog SET bagage_liter = 150, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lamborghini' AND model = 'Revuelto';
UPDATE car_catalog SET bagage_liter = 616, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lamborghini' AND model = 'Urus';

-- ============================================================
-- LEXUS (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 480, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lexus' AND model = 'GS';
UPDATE car_catalog SET bagage_liter = 197, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Lexus' AND model = 'LC';
UPDATE car_catalog SET bagage_liter = 488, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lexus' AND model = 'LM';
UPDATE car_catalog SET bagage_liter = 524, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Lexus' AND model = 'LS';
UPDATE car_catalog SET bagage_liter = 349, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Lexus' AND model = 'RC';

-- ============================================================
-- MAZDA (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 366, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Mazda' AND model = 'MX-30';

-- ============================================================
-- MERCEDES-BENZ (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'A45 AMG';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'AMG CLE 53';
UPDATE car_catalog SET bagage_liter = 370, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'CLE Cabriolet';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'CLE Coupe';
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'CLS';
UPDATE car_catalog SET bagage_liter = 452, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'G-Class Electric';
UPDATE car_catalog SET bagage_liter = 452, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'G-Klass';
UPDATE car_catalog SET bagage_liter = 800, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Mercedes-Benz' AND model = 'V-Klass';

-- ============================================================
-- MG
-- ============================================================
UPDATE car_catalog SET bagage_liter = 363, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'MG' AND model = '4';
UPDATE car_catalog SET bagage_liter = 448, drivetrain_type = 'Framhjulsdrift' WHERE make = 'MG' AND model = 'ZS EV';

-- ============================================================
-- NIO
-- ============================================================
UPDATE car_catalog SET bagage_liter = 574, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'NIO' AND model = 'EL6';

-- ============================================================
-- NISSAN (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 353, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Nissan' AND model = 'Juke';

-- ============================================================
-- PEUGEOT (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 702, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Peugeot' AND model = '5008';
UPDATE car_catalog SET bagage_liter = 487, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '508';
UPDATE car_catalog SET bagage_liter = 390, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Peugeot' AND model = '508 PSE';
UPDATE car_catalog SET bagage_liter = 530, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = '508 SW';
UPDATE car_catalog SET bagage_liter = 434, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-2008';
UPDATE car_catalog SET bagage_liter = 311, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-208';
UPDATE car_catalog SET bagage_liter = 434, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-408';
UPDATE car_catalog SET bagage_liter = 702, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Peugeot' AND model = 'e-5008';

-- ============================================================
-- POLESTAR (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 240, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Polestar' AND model = '5';

-- ============================================================
-- RENAULT (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 545, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Grand Scenic';
UPDATE car_catalog SET bagage_liter = 472, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Kadjar';
UPDATE car_catalog SET bagage_liter = 440, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Renault' AND model = 'Koleos';
UPDATE car_catalog SET bagage_liter = 330, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Megane RS';
UPDATE car_catalog SET bagage_liter = 521, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Renault' AND model = 'Megane Sport Tourer';
UPDATE car_catalog SET bagage_liter = 188, drivetrain_type = 'Bakhjulsdrift'  WHERE make = 'Renault' AND model = 'Twingo';

-- ============================================================
-- SEAT (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 267, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Seat' AND model = 'Mii';
UPDATE car_catalog SET bagage_liter = 459, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Seat' AND model = 'Toledo';

-- ============================================================
-- SKODA (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 267, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Skoda' AND model = 'Citigo';
UPDATE car_catalog SET bagage_liter = 455, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Skoda' AND model = 'Yeti';

-- ============================================================
-- SMART
-- ============================================================
UPDATE car_catalog SET bagage_liter = 411, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'smart' AND model = '#1';

-- ============================================================
-- SUZUKI
-- ============================================================
UPDATE car_catalog SET bagage_liter = 490, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Suzuki' AND model = 'Across';
UPDATE car_catalog SET bagage_liter = 139, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Suzuki' AND model = 'Alto';
UPDATE car_catalog SET bagage_liter = 318, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Suzuki' AND model = 'Baleno';
UPDATE car_catalog SET bagage_liter = 254, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Suzuki' AND model = 'Celerio';
UPDATE car_catalog SET bagage_liter = 377, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Suzuki' AND model = 'Jimny';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Suzuki' AND model = 'S-Cross';
UPDATE car_catalog SET bagage_liter = 596, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Suzuki' AND model = 'Swace';
UPDATE car_catalog SET bagage_liter = 265, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Suzuki' AND model = 'Swift';
UPDATE car_catalog SET bagage_liter = 430, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Suzuki' AND model = 'SX4';
UPDATE car_catalog SET bagage_liter = 375, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Suzuki' AND model = 'Vitara';

-- ============================================================
-- TOYOTA (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 231, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Toyota' AND model = 'Aygo X';
UPDATE car_catalog SET bagage_liter = 671, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Toyota' AND model = 'Highlander';
UPDATE car_catalog SET bagage_liter = 760, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Toyota' AND model = 'Land Cruiser';

-- ============================================================
-- VOLKSWAGEN (resterande)
-- ============================================================
UPDATE car_catalog SET bagage_liter = 1213, drivetrain_type = 'Bakhjulsdrift' WHERE make = 'Volkswagen' AND model = 'ID. Buzz';
UPDATE car_catalog SET bagage_liter = 469, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Volkswagen' AND model = 'Touran';

-- ============================================================
-- XPENG
-- ============================================================
UPDATE car_catalog SET bagage_liter = 571, drivetrain_type = 'Fyrhjulsdrift'  WHERE make = 'Xpeng' AND model = 'G6';

-- ============================================================
-- Lastbilar/skåpbilar – sätter Framhjulsdrift som standard för dessa
-- (bagage_liter lämnas oförändrat då lastvolym varierar kraftigt)
-- ============================================================
UPDATE car_catalog SET drivetrain_type = 'Framhjulsdrift'
WHERE drivetrain_type IS NULL
  AND make IN ('Fiat', 'Nissan', 'Volkswagen', 'Peugeot', 'Renault', 'Toyota', 'Kia')
  AND model IN ('Ducato', 'Scudo', 'Interstar', 'Townstar', 'Caddy', 'Transporter', 'Multivan',
                'Boxer', 'Expert', 'Partner', 'Rifter', 'Traveller',
                'ProAce', 'ProAce City', 'ProAce City Verso', 'ProAce Verso',
                'Kangoo', 'Master', 'Trafic',
                'PV5');

-- Seat Alhambra (MPV)
UPDATE car_catalog SET bagage_liter = 267, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Seat' AND model = 'Alhambra';

-- Skoda Roomster
UPDATE car_catalog SET bagage_liter = 363, drivetrain_type = 'Framhjulsdrift' WHERE make = 'Skoda' AND model = 'Roomster';
