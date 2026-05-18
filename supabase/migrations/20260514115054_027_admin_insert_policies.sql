/*
  # Admin insert policies på cars/customers/car_images

  1. Bakgrund
    Migration 025 ersatte den öppna INSERT-policyn på cars med en restriktiv som
    bara tillåter status='ny'. Det blockerade admin-flödet i AdminAddCar som ibland
    skapar bilar med status='aktiv' direkt. Lägg till explicita admin-policies.

  2. Säkerhet
    - Endast användare i admin_users får skapa rader oavsett status.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cars' AND policyname='Admins can insert cars') THEN
    CREATE POLICY "Admins can insert cars"
      ON cars FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='customers' AND policyname='Admins can insert customers') THEN
    CREATE POLICY "Admins can insert customers"
      ON customers FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='car_images' AND policyname='Admins can insert car images') THEN
    CREATE POLICY "Admins can insert car images"
      ON car_images FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid()));
  END IF;
END $$;
