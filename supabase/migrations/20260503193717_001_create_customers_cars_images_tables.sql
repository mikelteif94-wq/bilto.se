/*
  # Create database schema for car sales platform

  1. New Tables
    - `customers` - Sellers information
      - `id` (uuid, primary key)
      - `namn` (text) - Full name
      - `telefon` (text) - Phone number
      - `mejl` (text) - Email address
      - `created_at` (timestamp)
    
    - `cars` - Car listings
      - `id` (uuid, primary key)
      - `regnummer` (text) - License plate
      - `marke` (text) - Brand
      - `modell` (text) - Model
      - `ar` (integer) - Year
      - `miltal` (integer) - Mileage
      - `skick` (text) - Condition
      - `status` (text, default 'ny') - Status (ny, aktiv, avslutad)
      - `customer_id` (uuid, foreign key to customers)
      - `created_at` (timestamp)
    
    - `car_images` - Car images
      - `id` (uuid, primary key)
      - `car_id` (uuid, foreign key to cars)
      - `storage_url` (text) - URL to image in storage
      - `ordning` (integer) - Order/sequence
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables (default deny - no policies added)
    - All tables are locked down by default until explicit policies are created
    - Each table will require specific policies based on use case

  3. Storage
    - Storage bucket setup will be configured separately
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  namn text NOT NULL,
  telefon text NOT NULL,
  mejl text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regnummer text NOT NULL,
  marke text NOT NULL,
  modell text NOT NULL,
  ar integer NOT NULL,
  miltal integer NOT NULL,
  skick text NOT NULL,
  status text DEFAULT 'ny',
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  ordning integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cars_customer_id ON cars(customer_id);
CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id);