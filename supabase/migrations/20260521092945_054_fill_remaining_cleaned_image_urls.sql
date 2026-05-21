/*
  # Fill remaining cleaned_image_url entries

  Covers the 35 cars not matched in the previous migration:
  extra Audi/BMW variants plus Jaguar, Jeep, Mazda, MG, NIO, smart, Xpeng.
*/

UPDATE car_catalog SET cleaned_image_url = CASE
  -- Audi extras
  WHEN make = 'Audi' AND model = 'A1 Sportback' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A1&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'A3 Saloon' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A3&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'A5 Avant' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A5&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'A6' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A6&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'A6 Avant e-tron' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=A6-e-tron&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'Q4 Sportback e-tron' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=Q4-e-tron&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'Q5 Sportback' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=Q5&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'Q6 e-tron Sportback' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=Q6-e-tron&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'RS Q3' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=Q3&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'RS3 Saloon' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=RS3&angle=23&width=600'
  WHEN make = 'Audi' AND model = 'S3 Sportback' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Audi&modelFamily=S3&angle=23&width=600'
  -- BMW extras (English names)
  WHEN make = 'BMW' AND model = '1 Series' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=1-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '2 Series Coupe' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=2-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '2 Series Gran Coupe' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=2-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '3 Series' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=3-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '3 Series Touring' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=3-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '4 Series' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=4-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '4 Series Gran Coupe' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=4-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '5 Series' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=5-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = '5 Series Touring' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=5-series&angle=23&width=600'
  WHEN make = 'BMW' AND model = 'iX2' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=iX2&angle=23&width=600'
  WHEN make = 'BMW' AND model = 'M4 Coupe' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=BMW&modelFamily=M4&angle=23&width=600'
  -- Jaguar
  WHEN make = 'Jaguar' AND model = 'I-Pace' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Jaguar&modelFamily=I-Pace&angle=23&width=600'
  WHEN make = 'Jaguar' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Jaguar&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  -- Jeep
  WHEN make = 'Jeep' AND model = 'Avenger' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Jeep&modelFamily=Avenger&angle=23&width=600'
  WHEN make = 'Jeep' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Jeep&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  -- Mazda
  WHEN make = 'Mazda' AND model = 'CX-30' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=CX-30&angle=23&width=600'
  WHEN make = 'Mazda' AND model = 'CX-5' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=CX-5&angle=23&width=600'
  WHEN make = 'Mazda' AND model = 'CX-60' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=CX-60&angle=23&width=600'
  WHEN make = 'Mazda' AND model = 'Mazda3' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=3&angle=23&width=600'
  WHEN make = 'Mazda' AND model = 'MX-30' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=MX-30&angle=23&width=600'
  WHEN make = 'Mazda' AND model = 'MX-5' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=MX-5&angle=23&width=600'
  WHEN make = 'Mazda' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Mazda&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  -- MG
  WHEN make = 'MG' AND model = '4' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=MG&modelFamily=4&angle=23&width=600'
  WHEN make = 'MG' AND model = 'ZS EV' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=MG&modelFamily=ZS&angle=23&width=600'
  WHEN make = 'MG' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=MG&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  -- NIO
  WHEN make = 'NIO' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=NIO&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  -- smart
  WHEN make = 'smart' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=smart&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  -- Xpeng
  WHEN make = 'Xpeng' THEN 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=Xpeng&modelFamily=' || replace(model, ' ', '-') || '&angle=23&width=600'
  ELSE NULL
END
WHERE cleaned_image_url IS NULL;
