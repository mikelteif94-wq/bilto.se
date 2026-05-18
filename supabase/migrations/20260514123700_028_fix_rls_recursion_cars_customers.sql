/*
  # Åtgärda RLS-rekursion mellan cars och customers

  1. Bakgrund
    Policyn "Customer can read own cars" på cars gör en subquery mot customers.
    Policyn "Winning dealer can read customer contact" på customers gör en subquery
    mot cars. När en handlare läser cars triggas customers-policyn (via underliggande
    join), vilken i sin tur läser cars - oändlig rekursion.

  2. Lösning
    Skapa SECURITY DEFINER hjälpfunktioner som bypass:ar RLS för de specifika
    relationella kontrollerna. Funktionerna är read-only och kontrollerar enbart
    tillhörighet baserat på auth.uid().

  3. Säkerhet
    - Funktionerna kontrollerar fortfarande auth.uid()
    - SECURITY DEFINER kör som postgres men exponerar endast booleska resultat
    - Inga rader exponeras direkt
*/

-- 1) Hjälpfunktion: är inloggad användare ägare till given customer-id?
CREATE OR REPLACE FUNCTION public.is_customer_owner(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE id = cid AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_customer_owner(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_customer_owner(uuid) TO authenticated, anon;

-- 2) Hjälpfunktion: är inloggad användare den vinnande handlaren för given customer?
CREATE OR REPLACE FUNCTION public.is_winning_dealer_for_customer(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cars c
    JOIN bids b ON b.id = c.vinnande_bud_id
    JOIN dealers d ON d.id = b.dealer_id
    WHERE c.customer_id = cid
      AND d.user_id = auth.uid()
      AND c.kund_beslut = 'vill_salja'
  );
$$;

REVOKE ALL ON FUNCTION public.is_winning_dealer_for_customer(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_winning_dealer_for_customer(uuid) TO authenticated, anon;

-- 3) Ersätt rekursiva policies
DROP POLICY IF EXISTS "Customer can read own cars" ON cars;
CREATE POLICY "Customer can read own cars"
  ON cars FOR SELECT
  TO authenticated
  USING (public.is_customer_owner(customer_id));

DROP POLICY IF EXISTS "Winning dealer can read customer contact" ON customers;
CREATE POLICY "Winning dealer can read customer contact"
  ON customers FOR SELECT
  TO authenticated
  USING (public.is_winning_dealer_for_customer(id));
