/*
  # Åtgärda RLS-rekursion på admin_users

  Policyn "Admins can read all admin rows" på admin_users gör EXISTS-subquery
  mot admin_users vilket triggar samma policy igen. Andra tabellers policies
  kontrollerar admin-status via samma EXISTS-mönster och fastnar i rekursion.

  Lösning: Skapa SECURITY DEFINER-funktion is_admin() som bypass:ar RLS, och
  ersätt den rekursiva policyn med ett anrop till funktionen. Andra tabellers
  policies fortsätter fungera eftersom Postgres inbygga logik tillåter EXISTS
  på admin_users när den policy:n inte själv frågar admin_users.

  Säkerhet: Funktionen returnerar enbart boolean, kontrollerar auth.uid().
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

DROP POLICY IF EXISTS "Admins can read all admin rows" ON admin_users;
CREATE POLICY "Admins can read all admin rows"
  ON admin_users FOR SELECT
  TO authenticated
  USING (public.is_admin());
