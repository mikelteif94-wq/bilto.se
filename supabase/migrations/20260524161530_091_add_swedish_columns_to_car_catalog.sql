/*
  # Add Swedish-named columns to car_catalog

  Adds all 37 domain columns using Swedish names to match the JSON import format
  and the full 39-field spec. All columns are nullable so existing rows are unaffected.

  ## New columns (grouped)

  ### Identitet
  - `slug` (text) — already exists, kept for completeness

  ### Pris
  - `pris_ny_fran` (numeric)
  - `pris_ny_till` (numeric)
  - `pris_begagnat` (numeric) — typical used price
  - `pris_begagnat_spann_min` (numeric)
  - `pris_begagnat_spann_max` (numeric)
  - `pris_billigast` (numeric)
  - `pris_rekommenderat` (text)

  ### Månadskostnad
  - `manadskostnad_ny` (integer)
  - `manadskostnad_ny_min` (numeric)
  - `manadskostnad_ny_max` (numeric)
  - `manadskostnad_begagnad` (integer)
  - `manadskostnad_beg_min` (numeric)
  - `manadskostnad_beg_max` (numeric)

  ### Specifikationer
  - `kaross` (text)
  - `drivmedel` (text)
  - `drivlina` (text)
  - `drivlina_kort` (text)
  - `bagage_liter` (integer)

  ### Betyg
  - `betyg_skala` (text) — e.g. "1–5"
  - `betyg_totalt` (numeric)
  - `betyg_korning` (numeric)
  - `betyg_komfort` (numeric)
  - `betyg_praktiskt` (numeric)
  - `betyg_varde` (numeric)

  ### Värdeminskning
  - `vardeminskning_betyg` (text)
  - `vardeminskning_text` (text)

  ### Generation
  - `generation_namn` (text)
  - `generation_fran_ar` (integer)
  - `generation_till_ar` (integer)

  ### Listor / JSONB
  - `passar_for` (jsonb) — array of strings
  - `styrkor` (jsonb) — array of strings
  - `svagheter` (jsonb) — array of strings
  - `cta` (jsonb)

  ### Text / Persona
  - `expert_text` (text)
  - `meta_description` (text) — already exists, kept for completeness
  - `persona_familjetest` (text)
  - `persona_kordynamik` (text)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_ny_fran') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_ny_fran numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_ny_till') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_ny_till numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_begagnat') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_begagnat numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_begagnat_spann_min') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_begagnat_spann_min numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_begagnat_spann_max') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_begagnat_spann_max numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_billigast') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_billigast numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'pris_rekommenderat') THEN
    ALTER TABLE car_catalog ADD COLUMN pris_rekommenderat text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'manadskostnad_ny') THEN
    ALTER TABLE car_catalog ADD COLUMN manadskostnad_ny integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'manadskostnad_ny_min') THEN
    ALTER TABLE car_catalog ADD COLUMN manadskostnad_ny_min numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'manadskostnad_ny_max') THEN
    ALTER TABLE car_catalog ADD COLUMN manadskostnad_ny_max numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'manadskostnad_begagnad') THEN
    ALTER TABLE car_catalog ADD COLUMN manadskostnad_begagnad integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'manadskostnad_beg_min') THEN
    ALTER TABLE car_catalog ADD COLUMN manadskostnad_beg_min numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'manadskostnad_beg_max') THEN
    ALTER TABLE car_catalog ADD COLUMN manadskostnad_beg_max numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'kaross') THEN
    ALTER TABLE car_catalog ADD COLUMN kaross text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'drivmedel') THEN
    ALTER TABLE car_catalog ADD COLUMN drivmedel text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'drivlina') THEN
    ALTER TABLE car_catalog ADD COLUMN drivlina text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'drivlina_kort') THEN
    ALTER TABLE car_catalog ADD COLUMN drivlina_kort text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'bagage_liter') THEN
    ALTER TABLE car_catalog ADD COLUMN bagage_liter integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'betyg_skala') THEN
    ALTER TABLE car_catalog ADD COLUMN betyg_skala text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'betyg_totalt') THEN
    ALTER TABLE car_catalog ADD COLUMN betyg_totalt numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'betyg_korning') THEN
    ALTER TABLE car_catalog ADD COLUMN betyg_korning numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'betyg_komfort') THEN
    ALTER TABLE car_catalog ADD COLUMN betyg_komfort numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'betyg_praktiskt') THEN
    ALTER TABLE car_catalog ADD COLUMN betyg_praktiskt numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'betyg_varde') THEN
    ALTER TABLE car_catalog ADD COLUMN betyg_varde numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'vardeminskning_betyg') THEN
    ALTER TABLE car_catalog ADD COLUMN vardeminskning_betyg text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'vardeminskning_text') THEN
    ALTER TABLE car_catalog ADD COLUMN vardeminskning_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'generation_namn') THEN
    ALTER TABLE car_catalog ADD COLUMN generation_namn text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'generation_fran_ar') THEN
    ALTER TABLE car_catalog ADD COLUMN generation_fran_ar integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'generation_till_ar') THEN
    ALTER TABLE car_catalog ADD COLUMN generation_till_ar integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'passar_for') THEN
    ALTER TABLE car_catalog ADD COLUMN passar_for jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'styrkor') THEN
    ALTER TABLE car_catalog ADD COLUMN styrkor jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'svagheter') THEN
    ALTER TABLE car_catalog ADD COLUMN svagheter jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'cta_sv') THEN
    ALTER TABLE car_catalog ADD COLUMN cta_sv jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'expert_text') THEN
    ALTER TABLE car_catalog ADD COLUMN expert_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'persona_familjetest') THEN
    ALTER TABLE car_catalog ADD COLUMN persona_familjetest text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_catalog' AND column_name = 'persona_kordynamik') THEN
    ALTER TABLE car_catalog ADD COLUMN persona_kordynamik text;
  END IF;
END $$;
