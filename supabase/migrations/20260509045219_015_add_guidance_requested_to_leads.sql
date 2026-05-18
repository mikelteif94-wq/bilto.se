/*
  # Lägg till guidance_requested-flagga på leads

  1. Ändringar
    - Ny kolumn `guidance_requested` (boolean, default false) på tabellen `leads`
      markerar att kunden bad om att bli uppringd för guidning istället för att
      själv välja försäljningsspår (direktbud vs förmedling).

  2. Säkerhet
    - Inga policyändringar - befintliga RLS-policies på `leads` täcker detta fält.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'guidance_requested'
  ) THEN
    ALTER TABLE leads ADD COLUMN guidance_requested boolean NOT NULL DEFAULT false;
  END IF;
END $$;
