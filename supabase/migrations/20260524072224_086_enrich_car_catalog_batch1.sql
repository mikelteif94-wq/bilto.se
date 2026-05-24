/*
  # Enrich car catalog - Batch 1: Alfa Romeo, Audi, BMW, BYD, Citroen, Cupra, Dacia, DS, Fiat, Ford

  Fills in body_type, fuel_types, segment, rating_overall, expert_comment, seats
  for all models from these makes.

  Allowed values:
  - body_type: sedan, kombi, suv, coupe, hatchback, cab, mpv, pickup
  - segment: budget, compact, midsize, fullsize, premium, luxury, sports
  - fuel_types: bensin, diesel, hybrid, laddhybrid, el
*/

-- Alfa Romeo
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Snygg italiensk SUV med karaktär och plug-in hybrid. Bra köregenskaper men något sämre räckvidd på el.'
WHERE make = 'Alfa Romeo' AND model = 'Tonale';

-- Audi
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten premium-halvkombi med fin interiör och bra utrustningsnivå. Lite trång baksäte.'
WHERE make = 'Audi' AND model = 'A1';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välbyggd kompaktsedan med premiumkänsla. Effektiv och komfortabel med goda köregenskaper.'
WHERE make = 'Audi' AND model = 'A3 Sedan';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Populär premium-halvkombi med utmärkt kvalitetskänsla, bra teknologi och stark återförsäljning.'
WHERE make = 'Audi' AND model = 'A3 Sportback';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Praktisk och elegant kombi i premiumsegmentet. Rymlig, komfortabel och med stark teknik.'
WHERE make = 'Audi' AND model = 'A4 Avant';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny generation A5 med modern design och uppdaterad teknik. Balanserar elegans och körupplevelse väl.'
WHERE make = 'Audi' AND model = 'A5';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Praktisk och stilren kombi-version av A5. Stort lastutrymme kombinerat med premiumkänsla.'
WHERE make = 'Audi' AND model = 'A5 Avant';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Representativ stor kombi med utmärkt komfort, avancerad teknik och imponerande interiör.'
WHERE make = 'Audi' AND model = 'A6 Avant';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk version av A6 Avant med lång räckvidd och snabbladdning. Premium-el-kombi på hög nivå.'
WHERE make = 'Audi' AND model = 'A6 Avant e-tron';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegant fastback med fyra dörrar. Kombinerar sportbilskänsla med praktisk vardagsanvändning.'
WHERE make = 'Audi' AND model = 'A7';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Flaggskeppssedan med teknologisk spetskompetens, lyx och komfort i toppklass.'
WHERE make = 'Audi' AND model = 'A8';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk sportsedan med imponerande prestanda och elegans. Konkurrerar med Porsche Taycan.'
WHERE make = 'Audi' AND model = 'e-tron GT';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten premium-SUV med kompakta mått. Bra för stadskörning men begränsat lastutrymme.'
WHERE make = 'Audi' AND model = 'Q2';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välbalanserad kompakt-SUV med premiumkänsla och bra praktiska egenskaper.'
WHERE make = 'Audi' AND model = 'Q3';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportigare variant av Q3 med sänkt takline. Snyggare men något sämre baksätesplats.'
WHERE make = 'Audi' AND model = 'Q3 Sportback';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk kompakt-SUV med bra räckvidd och snabbladdning. Stilren design och gedigen kvalitet.'
WHERE make = 'Audi' AND model = 'Q4 e-tron';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportback-version av Q4 e-tron med lägre tak. Något sämre siktvärden men snyggare profil.'
WHERE make = 'Audi' AND model = 'Q4 e-tron Sportback';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Mogen och välrundad premium-SUV med utmärkt komfort och teknik. En av segmentets bästa.'
WHERE make = 'Audi' AND model = 'Q5';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ny elektrisk mellanstor SUV med 800V-teknik och snabb laddning. Audi på el i toppform.'
WHERE make = 'Audi' AND model = 'Q6 e-tron';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'premium',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor familje-SUV med möjlighet till sju säten. Komfortabel och representativ.'
WHERE make = 'Audi' AND model = 'Q7';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportigt designad stor SUV. Kraftfull och lyxig med fyrhjulsdrift som standard.'
WHERE make = 'Audi' AND model = 'Q8';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk version av Q8 med lång räckvidd. Lyxig elbil för den som vill ha stor SUV på el.'
WHERE make = 'Audi' AND model = 'Q8 e-tron';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig RS-version av Q3 med 400 hk. Imponerande prestanda i SUV-format.'
WHERE make = 'Audi' AND model = 'RS Q3';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Extremt snabb kompakt-halvkombi med 400 hk. Daglig körbarhet kombinerad med superbilsprestanda.'
WHERE make = 'Audi' AND model = 'RS3';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportigare A3 med 333 hk och quattro-drift. Bra balans mellan prestanda och komfort.'
WHERE make = 'Audi' AND model = 'S3';

-- BMW
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt premium-halvkombi med dynamisk körkaraktär. Agil och rolig att köra i stadsmiljö.'
WHERE make = 'BMW' AND model = '1-serie';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt fyrdörrarscoupé med sportigt utseende. Begränsad baksätesplats men snygg design.'
WHERE make = 'BMW' AND model = '2-serie Gran Coupe';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Referensbilen i premiumsegmentet. Utmärkt balans mellan komfort, prestanda och teknik.'
WHERE make = 'BMW' AND model = '3-serie';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Körglad kombi som kombinerar praktisk rymmlighet med BMW:s typiska köregenskaper.'
WHERE make = 'BMW' AND model = '3-serie Touring';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 4,
  expert_comment = 'Elegant tvådörrarscoupé med kraftfull motor och sportigt utseende. Kompromiss med baksätesplats.'
WHERE make = 'BMW' AND model = '4-serie Coupe';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Fyrdörrarscoupé med sportigt utseende och bra praktikalitet. Mer vardagsanvändbar än coupén.'
WHERE make = 'BMW' AND model = '4-serie Gran Coupe';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Stor executive-sedan med exceptionell körupplevelse och lyxig interiör. En av segmentets bästa.'
WHERE make = 'BMW' AND model = '5-serie';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Stor halvkombi med komfort och praktikalitet. Bra för långa resor med familjen.'
WHERE make = 'BMW' AND model = '6-serie GT';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Flaggskeppslimousin med teknisk spetskompetens. Autonom körning och massagesäten i toppklass.'
WHERE make = 'BMW' AND model = '7-serie';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk Gran Coupé med upp till 600 hk och lång räckvidd. Spännande kombination av sport och el.'
WHERE make = 'BMW' AND model = 'i4';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk 5-serie med imponerande räckvidd och lyxig interiör. BMW:s bästa elbil hittills.'
WHERE make = 'BMW' AND model = 'i5';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk 7-serie med extravagant interiör och lång räckvidd. El-lyx på absolut toppnivå.'
WHERE make = 'BMW' AND model = 'i7';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Stor elektrisk SUV med avancerad teknik och exceptionell räckvidd. BMW:s elbil-flaggskepp.'
WHERE make = 'BMW' AND model = 'iX';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt elektrisk SUV med bra räckvidd. Kombinerar BMW:s köregenskaper med zero-emission.'
WHERE make = 'BMW' AND model = 'iX1';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportigare elektrisk kompakt-SUV. Lägre och mer dynamisk än iX1 med liknande räckvidd.'
WHERE make = 'BMW' AND model = 'iX2';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk version av X3 med bra räckvidd och snabbladdning. Beprövad plattform på el.'
WHERE make = 'BMW' AND model = 'iX3';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Råstark kompakt coupé med 460 hk. En av de roligaste bilarna att köra i sitt segment.'
WHERE make = 'BMW' AND model = 'M2';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 8, seats = 4,
  expert_comment = 'Sportig 2-serie coupé med stark motor och bakhjulsdrift. Kompromissad baksätesplats.'
WHERE make = 'BMW' AND model = 'M240i';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 5,
  expert_comment = 'Ikonisk sportsedan med 510 hk och M xDrive. Referensen för körupplevelse i premiumsegmentet.'
WHERE make = 'BMW' AND model = 'M3';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 5,
  expert_comment = 'Världens snabbaste praktiska kombi. Kombinerar M3:s prestanda med kombi-funktionalitet.'
WHERE make = 'BMW' AND model = 'M3 Touring';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 4,
  expert_comment = 'Sportcoupé med upp till 530 hk och karbontak. En ren körmaskin med daglig användbarhet.'
WHERE make = 'BMW' AND model = 'M4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt premium-SUV med bra utrymmen och dynamisk körkaraktär. Populärt och välbalanserat val.'
WHERE make = 'BMW' AND model = 'X1';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Sportigt designad kompakt-SUV med lägre takprofil. Snyggt men något sämre baksätesplats.'
WHERE make = 'BMW' AND model = 'X2';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Välrundad mellanstor SUV med premiumkänsla och bra allround-egenskaper. En av segmentets bästa.'
WHERE make = 'BMW' AND model = 'X3';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportigt designad SUV med coupéprofil. Väljer stil framför maximal praktikalitet.'
WHERE make = 'BMW' AND model = 'X4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 7,
  expert_comment = 'Stor premiumSUV med möjlighet till sju säten. Kraftfull, lyxig och kapabel off-road.'
WHERE make = 'BMW' AND model = 'X5';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'premium',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig stor SUV med coupéprofil. Dramatiskt utseende och kraftfulla motorer.'
WHERE make = 'BMW' AND model = 'X6';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'luxury',
  rating_overall = 9, seats = 7,
  expert_comment = 'BMW:s största SUV med sju säten och extravagant interiör. Konkurrerar med Volvo XC90 och GLS.'
WHERE make = 'BMW' AND model = 'X7';

UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 2,
  expert_comment = 'Klassisk roadster med fantastisk körupplevelse. Mjukt tak och bakhjulsdrift i bästa BMW-tradition.'
WHERE make = 'BMW' AND model = 'Z4';

-- BYD
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kinesisk elektrisk SUV med bra utrymmen och konkurrenskraftigt pris. Imponerande teknik.'
WHERE make = 'BYD' AND model = 'Atto 3';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Lekfull liten elbil med roterande rattstång och bra räckvidd för klassen. Unik design.'
WHERE make = 'BYD' AND model = 'Dolphin';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegant elektrisk sedan med lång räckvidd och exklusiv känsla. Imponerar på teknik och pris.'
WHERE make = 'BYD' AND model = 'Han';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 6, seats = 4,
  expert_comment = 'Liten och billig elbil för stadskörning. Begränsad räckvidd men prisvänlig ingångspunkt.'
WHERE make = 'BYD' AND model = 'Seagull';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig elektrisk sedan med imponerande prestanda och elegant design. Konkurrerar med Tesla Model 3.'
WHERE make = 'BYD' AND model = 'Seal';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk kombi-version av Seal. Praktisk och rymlig med samma imponerande räckvidd.'
WHERE make = 'BYD' AND model = 'Seal Tourer';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Mellanstor elektrisk SUV med bra utrymme och konkurrensmässigt pris. Solid vardagsbil.'
WHERE make = 'BYD' AND model = 'Seal U';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 7, seats = 7,
  expert_comment = 'Stor elektrisk SUV med sju säten. Riklig utrustning och bra familjekapacitet till konkurrenskraftigt pris.'
WHERE make = 'BYD' AND model = 'Tang';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt elektrisk SUV med bra allround-egenskaper och konkurrenskraftigt pris.'
WHERE make = 'BYD' AND model = 'Yuan Plus';

-- Citroen
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Komfortfokuserad SUV med mjuk fjädring och stilren interiör. Bra för långa resor.'
WHERE make = 'Citroen' AND model = 'C5 Aircross';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk kompaktbil med distinkt design och bra räckvidd. Citroëns modernaste elbil.'
WHERE make = 'Citroen' AND model = 'e-C4';

-- Cupra
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig kompakt-SUV med kraftfulla motorer och aggressiv styling. Kul att köra.'
WHERE make = 'Cupra' AND model = 'Ateca';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig elbil med bakhjulsdrift och bra prestanda. En av de roligaste kompakta elbilarna.'
WHERE make = 'Cupra' AND model = 'Born';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Cupra:s mest sålda modell. Sportig SUV med starkt moteutbud och tilltalande design.'
WHERE make = 'Cupra' AND model = 'Formentor';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig kompakthatchback med 300 hk i toppversion. Rolig att köra med bra vardagspraktik.'
WHERE make = 'Cupra' AND model = 'Leon';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk SUV-coupé med sportigt utseende och bra räckvidd. Cupra på el i toppform.'
WHERE make = 'Cupra' AND model = 'Tavascan';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Ny mellanstor SUV med sportiga ambitioner. Fokus på dynamik och modern design.'
WHERE make = 'Cupra' AND model = 'Terramar';

-- Dacia
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Prisvärd kompakt SUV med bra utrymmen. Robust och praktisk utan onödiga extrafeatures.'
WHERE make = 'Dacia' AND model = 'Duster';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 7,
  expert_comment = 'Prisvärd familjekombi med sju säten. Unik kombination av stor familjekapacitet och lågt pris.'
WHERE make = 'Dacia' AND model = 'Jogger';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Europas mest prisvärda bil. Enkel, pålitlig och kostnadseffektiv dagligbil.'
WHERE make = 'Dacia' AND model = 'Sandero';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Europas billigaste elbil. Begränsad räckvidd men perfekt för stadskörning till låg kostnad.'
WHERE make = 'Dacia' AND model = 'Spring';

-- DS
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','el','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Fransk premium-SUV med distinkt design och lyxig interiör. God konkurrent till tyska märken.'
WHERE make = 'DS' AND model = '3 Crossback';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elegant och välutrustad kompakthatchback med premium-ambitioner. Stilfull fransk alternativ.'
WHERE make = 'DS' AND model = '4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'DS:s flaggskepp. Stor SUV med massagesäten och lyxig interiör. Prestige till konkurrenskraftigt pris.'
WHERE make = 'DS' AND model = '7 Crossback';

-- Fiat
UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 8, seats = 2,
  expert_comment = 'Klassisk italiensk roadster med mjukt tak och bakhjulsdrift. Känslosam och rolig att köra.'
WHERE make = 'Fiat' AND model = '124 Spider';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 4,
  expert_comment = 'Ikonisk Fiat med charmigt utseende och kompakta mått. Perfekt för stadskörning.'
WHERE make = 'Fiat' AND model = '500';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 8, seats = 4,
  expert_comment = 'Elektrisk 500 med 320 km räckvidd och charmig design. En av de snyggaste mini-elbilarna.'
WHERE make = 'Fiat' AND model = '500e';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Familjevariant av 500 med fem dörrar och mer lastutrymme. Funktionell men ålderdomlig.'
WHERE make = 'Fiat' AND model = '500L';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt SUV med 500-design. Bra utrymmen och italiensk charm i SUV-format.'
WHERE make = 'Fiat' AND model = '500X';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','laddhybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Ny liten SUV som ersätter 500X. Modern plattform med el- och hybriddrivning.'
WHERE make = 'Fiat' AND model = '600';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Kompakt MPV för stadsmiljö. Praktisk men relativt ålderdomlig design och teknik.'
WHERE make = 'Fiat' AND model = 'Doblo';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 3,
  expert_comment = 'Klassisk husbilar- och transportbilsplattform. Pålitlig och populär i hela Europa.'
WHERE make = 'Fiat' AND model = 'Ducato';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','el','hybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Ikonisk liten bil med ny hybrid-teknik. Praktisk och ekonomisk stadsbil med charm.'
WHERE make = 'Fiat' AND model = 'Panda';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 6, seats = 3,
  expert_comment = 'Medelstor skåpbil för transport och hantverk. Pålitlig och kostnadseffektiv.'
WHERE make = 'Fiat' AND model = 'Scudo';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'compact',
  rating_overall = 6, seats = 5,
  expert_comment = 'SUV-version av Tipo. Enkel och prisvärd men inte lika kapabel som konkurrenterna.'
WHERE make = 'Fiat' AND model = 'Tipo Cross';

-- Ford
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Elektrisk 7-sitsig SUV baserad på VW-plattform. Rymlig familjebil med bra räckvidd.'
WHERE make = 'Ford' AND model = 'Explorer';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ford:s bäst körande kompaktbil. Utmärkt chassituning och bra motorer. Omtyckt av bilentusiaster.'
WHERE make = 'Ford' AND model = 'Focus';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Praktisk kombi med Focus köregenskaper. Bra lastutrymme och bra ergonomi.'
WHERE make = 'Ford' AND model = 'Focus Kombi';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Legendarisk hothatch med 350 hk och unik tredubbelutblåsning. Exceptionell körupplevelse.'
WHERE make = 'Ford' AND model = 'Focus RS';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportig Focus med 280 hk och skarp chassituning. Bäst-i-klassen för körglädje.'
WHERE make = 'Ford' AND model = 'Focus ST';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportig kombi-version av Focus ST. Sällsynt kombination av prestanda och praktikalitet.'
WHERE make = 'Ford' AND model = 'Focus ST Kombi';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Populär mellanstor SUV med bra köregenskaper. Modern teknik och konkurrenskraftigt pris.'
WHERE make = 'Ford' AND model = 'Kuga';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Ikonisk ponnymuskelbil med V8-ljud och bakhjulsdrift. En del av amerikansk bilhistoria.'
WHERE make = 'Ford' AND model = 'Mustang';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk SUV med Mustang-design. Bra räckvidd och köregenskaper. Rolig elbil från Ford.'
WHERE make = 'Ford' AND model = 'Mustang Mach-E';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten sportig SUV med bra köregenskaper och unik design. ST-Line ger sportig känsla.'
WHERE make = 'Ford' AND model = 'Puma';

UPDATE car_catalog SET
  body_type = 'pickup', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Europas mest sålda pickup. Tålig, kapabel och med allt fler personbilsegenskaper.'
WHERE make = 'Ford' AND model = 'Ranger';
