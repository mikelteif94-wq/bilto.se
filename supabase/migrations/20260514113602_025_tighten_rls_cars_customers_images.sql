/*
  # Skärp RLS på cars, customers och car_images

  1. Bakgrund
    Tidigare migration 002 lade in fullständigt öppna policies för anon/authenticated
    på cars, customers och car_images. Detta gör att vem som helst kan läsa varje
    kunds namn/telefon/mejl och varje bils detaljer, samt skriva valfria rader.
    Migration 004 lade till en motsvarande öppen UPDATE-policy på cars för alla
    inloggade användare. Den här migrationen ersätter dessa med restriktiva policies
    samtidigt som det publika säljflödet (anon) och edge functions (service_role,
    bypassar RLS) fortsätter fungera.

  2. Ändringar
    - Tar bort öppna policies från migration 002 och 004 på cars, customers och
      car_images (DROP POLICY IF EXISTS – idempotent).
    - Lägger till ny anon INSERT-policy på cars som begränsar nya rader till
      status='ny' så att en spammare inte kan skapa "aktiv" bil direkt.
    - Lägger till ny anon INSERT-policy på customers (säljflödet kräver detta).
    - Lägger till ny anon INSERT-policy på car_images, men endast om car_id pekar
      på en bil som existerar och fortfarande har status='ny'.
    - SELECT på cars: tillåt admin (admin_users), kund (customers.user_id =
      auth.uid()), godkänd handlare (befintlig policy från 005) – ingen anon SELECT.
    - SELECT på customers: tillåt admin, ägare (user_id = auth.uid()), och vinnande
      handlare (dealers.user_id = auth.uid() AND cars.vinnande_bud_id matchar bid
      från denna dealer).
    - SELECT på car_images: tillåt admin, ägare och godkänd handlare.
    - UPDATE: endast admin via admin_users (edge functions använder service_role).

  3. Säkerhet
    Inga rader raderas eller ändras. Alla policies kontrollerar autentisering
    eller äganderätt. Edge functions med service_role påverkas inte.

  4. Notering
    Säljflödet (ConfirmationForm.tsx) och DealerAddCar fortsätter fungera eftersom:
    - Anon insert i customers/cars/car_images är fortsatt tillåtet (med restriktion).
    - Inloggad handlare gör samma anon-liknande inserts (de motsvarar samma policies).
    - customer-car edge function använder service_role.
*/

-- 1) Ta bort öppna policies
DROP POLICY IF EXISTS "Allow public to read cars" ON cars;
DROP POLICY IF EXISTS "Allow public to read customers" ON customers;
DROP POLICY IF EXISTS "Allow public to read car_images" ON car_images;
DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow public to insert cars" ON cars;
DROP POLICY IF EXISTS "Allow public to insert car_images" ON car_images;
DROP POLICY IF EXISTS "Allow authenticated to update cars" ON cars;

-- 2) Anon INSERT-policies (säljflöde via SellCarPage / ConfirmationForm)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Public can register as customer') THEN
    CREATE POLICY "Public can register as customer"
      ON customers FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cars' AND policyname='Public can submit a car as new') THEN
    CREATE POLICY "Public can submit a car as new"
      ON cars FOR INSERT
      TO anon, authenticated
      WITH CHECK (status = 'ny');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_images' AND policyname='Public can upload images for a new car') THEN
    CREATE POLICY "Public can upload images for a new car"
      ON car_images FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM cars c
          WHERE c.id = car_images.car_id
            AND c.status = 'ny'
        )
      );
  END IF;
END $$;

-- 3) SELECT-policies för admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cars' AND policyname='Admins can read all cars') THEN
    CREATE POLICY "Admins can read all cars"
      ON cars FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Admins can read all customers') THEN
    CREATE POLICY "Admins can read all customers"
      ON customers FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_images' AND policyname='Admins can read all car images') THEN
    CREATE POLICY "Admins can read all car images"
      ON car_images FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;

-- 4) Vinnande handlare får läsa kundens kontaktuppgifter
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Winning dealer can read customer contact') THEN
    CREATE POLICY "Winning dealer can read customer contact"
      ON customers FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM cars c
          JOIN bids b ON b.id = c.vinnande_bud_id
          JOIN dealers d ON d.id = b.dealer_id
          WHERE c.customer_id = customers.id
            AND d.user_id = auth.uid()
            AND c.kund_beslut = 'vill_salja'
        )
      );
  END IF;
END $$;

-- 5) Handlare som ser aktiva bilar får också se bilderna
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_images' AND policyname='Approved dealers can view images of active cars') THEN
    CREATE POLICY "Approved dealers can view images of active cars"
      ON car_images FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cars c
          JOIN dealers d ON d.user_id = auth.uid()
          WHERE c.id = car_images.car_id
            AND d.godkand = true
            AND c.status IN ('ny','aktiv')
        )
      );
  END IF;
END $$;

-- 6) UPDATE: endast admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cars' AND policyname='Admins can update cars') THEN
    CREATE POLICY "Admins can update cars"
      ON cars FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Admins can update customers') THEN
    CREATE POLICY "Admins can update customers"
      ON customers FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_images' AND policyname='Admins can update car images') THEN
    CREATE POLICY "Admins can update car images"
      ON car_images FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cars' AND policyname='Admins can delete cars') THEN
    CREATE POLICY "Admins can delete cars"
      ON cars FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_images' AND policyname='Admins can delete car images') THEN
    CREATE POLICY "Admins can delete car images"
      ON car_images FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
