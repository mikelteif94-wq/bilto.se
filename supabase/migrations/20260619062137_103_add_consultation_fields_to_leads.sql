-- Add fields for the free consultation booking flow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='namn'
  ) THEN
    ALTER TABLE leads ADD COLUMN namn text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='preferred_callback_time'
  ) THEN
    ALTER TABLE leads ADD COLUMN preferred_callback_time text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='konsultation_syfte'
  ) THEN
    -- 'kop_bil' | 'salj_bil' | 'inbyte' | 'finansiering' | 'ovrig'
    ALTER TABLE leads ADD COLUMN konsultation_syfte text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='meddelande'
  ) THEN
    ALTER TABLE leads ADD COLUMN meddelande text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='lead_source'
  ) THEN
    -- 'hero_form' | 'konsultation' | 'quiz' | 'kop_bil' etc.
    ALTER TABLE leads ADD COLUMN lead_source text NOT NULL DEFAULT 'hero_form';
  END IF;
END $$;
