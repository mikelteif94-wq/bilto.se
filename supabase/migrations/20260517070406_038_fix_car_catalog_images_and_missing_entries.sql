/*
  # Fix car_catalog images and add missing entries

  1. Updates
    - Add image URLs to existing entries that are missing images:
      - BMW 3-serie, Hyundai IONIQ 6, Polestar 2/3/4, MG 4
      - Peugeot e-208, e-308, e-2008, e-3008, e-308 SW, e-408, e-5008
      - BMW 2-serie Coupe, 2-serie Gran Coupe
      - Toyota Corolla Hybrid
      - DS 3 Crossback, DS 4

  2. New entries (brands missing from car_catalog entirely)
    - Alfa Romeo: Tonale
    - Citroen: C5 Aircross, e-C4
    - Dacia: Jogger, Sandero, Spring
    - Genesis: GV60, GV70
    - Jaguar: I-Pace
    - Jeep: Avenger
    - Mazda: CX-30, CX-60, Mazda3, MX-30, MX-5
    - Mercedes-Benz: B-Klass, CLS, EQE, GLS, S-Klass
    - MG: ZS EV
    - NIO: EL6
    - Nissan: Leaf
    - Opel: Astra, Mokka-e
    - Land Rover: Defender
    - Toyota: Highlander
    - Volkswagen: Arteon, Caddy, Touran
    - BMW: 6-serie GT, 7-serie, i5, i7, M4, X4, X6
    - Audi: A5, A7, A8, Q8 e-tron
    - Volvo: EX40, V70
    - smart: #1
    - Xpeng: G6

  3. Important notes
    - Uses cdn.imagin.studio API for consistent image style
    - All entries use existing pattern from car_catalog
    - No destructive changes to existing data
*/

-- Fix existing entries missing images
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=3-serie&angle=23&width=600' WHERE make = 'BMW' AND model = '3-serie' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=2-serie&angle=23&width=600' WHERE make = 'BMW' AND model = '2-serie Coupe' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=2-serie&angle=23&width=600' WHERE make = 'BMW' AND model = '2-serie Gran Coupe' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Hyundai&modelFamily=IONIQ6&angle=23&width=600' WHERE make = 'Hyundai' AND model = 'IONIQ 6' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Polestar&modelFamily=2&angle=23&width=600' WHERE make = 'Polestar' AND model = '2' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Polestar&modelFamily=3&angle=23&width=600' WHERE make = 'Polestar' AND model = '3' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Polestar&modelFamily=4&angle=23&width=600' WHERE make = 'Polestar' AND model = '4' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=MG&modelFamily=MG4&angle=23&width=600' WHERE make = 'MG' AND model = '4' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-208&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-208' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-308&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-308' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-2008&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-2008' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-3008&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-3008' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-308&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-308 SW' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-408&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-408' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Peugeot&modelFamily=e-5008&angle=23&width=600' WHERE make = 'Peugeot' AND model = 'e-5008' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Toyota&modelFamily=Corolla&angle=23&width=600' WHERE make = 'Toyota' AND model = 'Corolla Hybrid' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=DS&modelFamily=3&angle=23&width=600' WHERE make = 'DS' AND model = '3 Crossback' AND image_url IS NULL;
UPDATE car_catalog SET image_url = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=DS&modelFamily=4&angle=23&width=600' WHERE make = 'DS' AND model = '4' AND image_url IS NULL;

-- Add missing brand/model entries
INSERT INTO car_catalog (make, model, image_url)
VALUES
  ('Alfa Romeo', 'Tonale', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Alfa-Romeo&modelFamily=Tonale&angle=23&width=600'),
  ('Citroen', 'C5 Aircross', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Citroen&modelFamily=C5-Aircross&angle=23&width=600'),
  ('Citroen', 'e-C4', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Citroen&modelFamily=e-C4&angle=23&width=600'),
  ('Dacia', 'Jogger', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Dacia&modelFamily=Jogger&angle=23&width=600'),
  ('Dacia', 'Sandero', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Dacia&modelFamily=Sandero&angle=23&width=600'),
  ('Dacia', 'Spring', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Dacia&modelFamily=Spring&angle=23&width=600'),
  ('Genesis', 'GV60', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Genesis&modelFamily=GV60&angle=23&width=600'),
  ('Genesis', 'GV70', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Genesis&modelFamily=GV70&angle=23&width=600'),
  ('Jaguar', 'I-Pace', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Jaguar&modelFamily=I-Pace&angle=23&width=600'),
  ('Jeep', 'Avenger', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Jeep&modelFamily=Avenger&angle=23&width=600'),
  ('Mazda', 'CX-30', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=CX-30&angle=23&width=600'),
  ('Mazda', 'CX-60', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=CX-60&angle=23&width=600'),
  ('Mazda', 'Mazda3', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=Mazda3&angle=23&width=600'),
  ('Mazda', 'MX-30', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=MX-30&angle=23&width=600'),
  ('Mazda', 'MX-5', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=MX-5&angle=23&width=600'),
  ('Mercedes-Benz', 'B-Klass', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mercedes-Benz&modelFamily=B-Class&angle=23&width=600'),
  ('Mercedes-Benz', 'CLS', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mercedes-Benz&modelFamily=CLS&angle=23&width=600'),
  ('Mercedes-Benz', 'EQE', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mercedes-Benz&modelFamily=EQE&angle=23&width=600'),
  ('Mercedes-Benz', 'GLS', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mercedes-Benz&modelFamily=GLS&angle=23&width=600'),
  ('Mercedes-Benz', 'S-Klass', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mercedes-Benz&modelFamily=S-Class&angle=23&width=600'),
  ('MG', 'ZS EV', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=MG&modelFamily=ZS&angle=23&width=600'),
  ('NIO', 'EL6', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=NIO&modelFamily=EL6&angle=23&width=600'),
  ('Nissan', 'Leaf', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Nissan&modelFamily=Leaf&angle=23&width=600'),
  ('Opel', 'Astra', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Opel&modelFamily=Astra&angle=23&width=600'),
  ('Opel', 'Mokka-e', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Opel&modelFamily=Mokka&angle=23&width=600'),
  ('Land Rover', 'Defender', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Land-Rover&modelFamily=Defender&angle=23&width=600'),
  ('Toyota', 'Highlander', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Toyota&modelFamily=Highlander&angle=23&width=600'),
  ('Volkswagen', 'Arteon', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Volkswagen&modelFamily=Arteon&angle=23&width=600'),
  ('Volkswagen', 'Caddy', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Volkswagen&modelFamily=Caddy&angle=23&width=600'),
  ('Volkswagen', 'Touran', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Volkswagen&modelFamily=Touran&angle=23&width=600'),
  ('BMW', '6-serie GT', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=6-serie&angle=23&width=600'),
  ('BMW', '7-serie', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=7-serie&angle=23&width=600'),
  ('BMW', 'i5', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=i5&angle=23&width=600'),
  ('BMW', 'i7', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=i7&angle=23&width=600'),
  ('BMW', 'M4', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=M4&angle=23&width=600'),
  ('BMW', 'X4', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=X4&angle=23&width=600'),
  ('BMW', 'X6', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=X6&angle=23&width=600'),
  ('Audi', 'A5', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A5&angle=23&width=600'),
  ('Audi', 'A7', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A7&angle=23&width=600'),
  ('Audi', 'A8', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A8&angle=23&width=600'),
  ('Audi', 'Q8 e-tron', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=Q8-e-tron&angle=23&width=600'),
  ('Volvo', 'EX40', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Volvo&modelFamily=EX40&angle=23&width=600'),
  ('Volvo', 'V70', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Volvo&modelFamily=V70&angle=23&width=600'),
  ('smart', '#1', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Smart&modelFamily=%231&angle=23&width=600'),
  ('Xpeng', 'G6', 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Xpeng&modelFamily=G6&angle=23&width=600')
ON CONFLICT DO NOTHING;
