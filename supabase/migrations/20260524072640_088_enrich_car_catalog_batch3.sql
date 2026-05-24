/*
  # Enrich car catalog - Batch 3: Mercedes-Benz, MG, MINI, NIO, Nissan, Opel, Peugeot, Polestar, Porsche, Renault
*/

-- Mercedes-Benz
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Premiumhatchback med stjärnmärkets kvalitet. Bra teknik och välgjord interiör.'
WHERE make = 'Mercedes-Benz' AND model = 'A-Klass';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 5,
  expert_comment = 'Hysterisk AMG-version med 421 hk och fyra avgasrörs. Extremt snabb kompaktbil.'
WHERE make = 'Mercedes-Benz' AND model = 'A45 AMG';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Sportig coupé baserad på CLE med AMG-motor och 449 hk. Elegant och kraftfull.'
WHERE make = 'Mercedes-Benz' AND model = 'AMG CLE 53';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Praktisk halvkombi med stjärnmärkets premium-DNA. Bra för stadskörning och pendling.'
WHERE make = 'Mercedes-Benz' AND model = 'B-Klass';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Exceptionell premiumsedan med toppkvalitet och avancerad teknik. En av segmentets absolut bästa.'
WHERE make = 'Mercedes-Benz' AND model = 'C-Klass';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Praktisk premiumkombi med C-klass kvalitet. Bäst i klassen för kombinationen av lyx och plats.'
WHERE make = 'Mercedes-Benz' AND model = 'C-Klass Kombi';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt fyrdörrarscoupé med premiumkänsla och elegant design. Stilig alternativ till A-klass.'
WHERE make = 'Mercedes-Benz' AND model = 'CLA';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny elektrisk CLA med lång räckvidd och snabbladdning. Mercedes första dedikerade elbilsplattform.'
WHERE make = 'Mercedes-Benz' AND model = 'CLA Electric';

UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Elegant cabriolet baserad på CLE. Öppen körglädje med premium-känsla och kraftfull motor.'
WHERE make = 'Mercedes-Benz' AND model = 'CLE Cabriolet';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Elegant coupé som ersätter C- och E-klass coupé. Sportig och lyxig i ett paket.'
WHERE make = 'Mercedes-Benz' AND model = 'CLE Coupe';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportigt fastback med lyxig interiör och kraftfulla motorer. Elegant alternativ till E-klass.'
WHERE make = 'Mercedes-Benz' AND model = 'CLS';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Referensbilen i premiumsedansegmentet. Kombinerar lyx, teknik och körupplvelse oslagbart.'
WHERE make = 'Mercedes-Benz' AND model = 'E-Klass';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'premium',
  rating_overall = 9, seats = 4,
  expert_comment = 'Elegant coupé baserad på E-klass med sporrigt utseende och kraftfulla motorer.'
WHERE make = 'Mercedes-Benz' AND model = 'E-Klass Coupe';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Praktisk premiumkombi i toppklass. Stor kapacitet kombinerat med E-klass komfort.'
WHERE make = 'Mercedes-Benz' AND model = 'E-Klass Kombi';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt elektrisk SUV med elegant design och bra räckvidd. Mercedes på el i kompaktformat.'
WHERE make = 'Mercedes-Benz' AND model = 'EQA';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 7,
  expert_comment = 'Elektrisk SUV med möjlighet till sju säten. Praktisk familje-elbil med premiumkänsla.'
WHERE make = 'Mercedes-Benz' AND model = 'EQB';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Mellanstor elektrisk SUV med bra räckvidd och lyxig interiör. Mercedes elbil-SUV.'
WHERE make = 'Mercedes-Benz' AND model = 'EQC';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk premiumsedan med imponerande räckvidd och lyxig interiör. EQ-flaggskepp i sedanform.'
WHERE make = 'Mercedes-Benz' AND model = 'EQE';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk stor SUV med lyxig interiör och bra räckvidd. EQE-teknik i SUV-format.'
WHERE make = 'Mercedes-Benz' AND model = 'EQE SUV';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 7,
  expert_comment = 'Stor elektrisk SUV med plats för sju och ultralyx interiör. Det elektriska G-klassalternativet.'
WHERE make = 'Mercedes-Benz' AND model = 'EQS SUV';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk version av den ikoniska G-klassen. Bevarat off-road-DNA med helelektrisk drift.'
WHERE make = 'Mercedes-Benz' AND model = 'G-Class Electric';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ikonisk fyrkantig off-road-legende. Oöverträffad kapabilitet i lyx-SUV-format.'
WHERE make = 'Mercedes-Benz' AND model = 'G-Klass';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt premium-SUV med elegant design och bra utrustning. Välsäljande Mercedes-SUV.'
WHERE make = 'Mercedes-Benz' AND model = 'GLA';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 7,
  expert_comment = 'Kompakt SUV med möjlighet till sju säten. Praktisk familje-SUV med premiumkänsla.'
WHERE make = 'Mercedes-Benz' AND model = 'GLB';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 7,
  expert_comment = 'Elektrisk version av GLB med plats för sju. Familjevänlig elbil med premiumkänsla.'
WHERE make = 'Mercedes-Benz' AND model = 'GLB Electric';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Mellanstor premium-SUV i toppklass. Komfortabel, välutrustad och kapabel.'
WHERE make = 'Mercedes-Benz' AND model = 'GLC';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig coupé-version av GLC med lägre takprofil och mer dramatiskt utseende.'
WHERE make = 'Mercedes-Benz' AND model = 'GLC Coupe';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk version av GLC med lång räckvidd och snabbladdning. Bästa Mercedes elbil-SUV.'
WHERE make = 'Mercedes-Benz' AND model = 'GLC Electric';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 7,
  expert_comment = 'Stor premium-SUV med plats för sju och lyxig interiör. Konkurrerar med BMW X5 och Volvo XC90.'
WHERE make = 'Mercedes-Benz' AND model = 'GLE';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'luxury',
  rating_overall = 9, seats = 7,
  expert_comment = 'Stor lyxig SUV i toppklass. Massor av plats, maximal utrustning och representativt utseende.'
WHERE make = 'Mercedes-Benz' AND model = 'GLS';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'luxury',
  rating_overall = 10, seats = 5,
  expert_comment = 'Det ultimata lyxfordonet. S-klass sätter standarden för komfort, teknik och elegans.'
WHERE make = 'Mercedes-Benz' AND model = 'S-Klass';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'premium',
  rating_overall = 8, seats = 8,
  expert_comment = 'Lyxig minibuss med VIP-känsla. Massagesäten och premiumkänsla för upp till åtta passagerare.'
WHERE make = 'Mercedes-Benz' AND model = 'V-Klass';

-- MG
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Prisvärd elektrisk kompaktbil med bra räckvidd. Kinesisk elbil med brittiskt namn.'
WHERE make = 'MG' AND model = '4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Prisvärd elektrisk SUV med bra utrymmen. Konkurrenskraftigt alternativ i elbilsklassen.'
WHERE make = 'MG' AND model = 'ZS EV';

-- MINI
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Femrörars MINI med mer praktisk bakdörrar. Mer användbar utan att förlora charmen.'
WHERE make = 'MINI' AND model = '5-door';

UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 8, seats = 4,
  expert_comment = 'Ikonisk MINI cabriolet med fällbart tak. Rolig och charmig öppen körning.'
WHERE make = 'MINI' AND model = 'Convertible';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','el'], segment = 'compact',
  rating_overall = 8, seats = 4,
  expert_comment = 'Ny generation Cooper med modern teknik och el-alternativ. Rolig att köra med ikonisk design.'
WHERE make = 'MINI' AND model = 'Cooper';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','el','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Stor MINI SUV med plats för familjen. Behåller MINI-charmen i ett större format.'
WHERE make = 'MINI' AND model = 'Countryman';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Ultimata MINI med 231 hk och John Cooper Works-tuning. Extremt rolig hothatch.'
WHERE make = 'MINI' AND model = 'JCW';

-- NIO
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kinesisk premium-SUV med battery-swap-teknik. Unikt system för snabb energipåfyllning.'
WHERE make = 'NIO' AND model = 'EL6';

-- Nissan
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk SUV med bra räckvidd och modern design. Nyssans elbil-SUV-flaggskepp.'
WHERE make = 'Nissan' AND model = 'Ariya';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Stor skåpbil/transportbil med el-alternativ. Praktisk för både arbete och fritid.'
WHERE make = 'Nissan' AND model = 'Interstar';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten SUV med distinkt design och hybrid-teknik. Rolig och praktisk stadsbil.'
WHERE make = 'Nissan' AND model = 'Juke';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Pionjären bland moderna elbilar. Beprövad teknologi men nu lite ålderdomlig design.'
WHERE make = 'Nissan' AND model = 'Leaf';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Populär kompakt SUV med bra köregenskaper och bred motorpalett. Mycket bra allroundval.'
WHERE make = 'Nissan' AND model = 'Qashqai';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten skåpbil med el-alternativ. Praktisk stadslösning för små leveranser.'
WHERE make = 'Nissan' AND model = 'Townstar';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor familje-SUV med plats för sju och bred motorpalett. Bra allroundfamiljefordon.'
WHERE make = 'Nissan' AND model = 'X-Trail';

-- Opel
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','el','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Välrundad kompakthatchback med bred motorpalett inkl elbil. Bra värde för pengarna.'
WHERE make = 'Opel' AND model = 'Astra';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten och prisvärd stadsbil med el-alternativ. Bra val för daglig stadskörning.'
WHERE make = 'Opel' AND model = 'Corsa';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Liten crossover-SUV med praktisk höjd och bra utrymmen. Enkel men funktionell.'
WHERE make = 'Opel' AND model = 'Crossland';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','el','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Mellanstor SUV med bred motorpalett. Bra allroundalternativ med el och hybridteknik.'
WHERE make = 'Opel' AND model = 'Grandland';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk liten SUV med bra räckvidd. Prisvärd elbil-SUV för daglig pendling.'
WHERE make = 'Opel' AND model = 'Mokka-e';

-- Peugeot
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten kompakt SUV med Peugeots distinktiva design. Bra stadsbil med modern styling.'
WHERE make = 'Peugeot' AND model = '2008';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt och stilig hatchback med Peugeots originella cockpit-design. Bra stadsbil.'
WHERE make = 'Peugeot' AND model = '208';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Populär kompakt SUV med bred motorpalett och modern design. Bra allroundval.'
WHERE make = 'Peugeot' AND model = '3008';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakthatchback med Peugeots originella i-Cockpit. Stilig men polariserande instrumentpanel.'
WHERE make = 'Peugeot' AND model = '308';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Praktisk kombi-variant av 308 med rymligt lastutrymme och bra motorpalett.'
WHERE make = 'Peugeot' AND model = '308 SW';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Fastback-version med kombistorlek och coupéprofil. Elegant och rymlig kombination.'
WHERE make = 'Peugeot' AND model = '408';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor 7-sitsig SUV med bred motorpalett. Bra familjefordon med ordentliga utrymmen.'
WHERE make = 'Peugeot' AND model = '5008';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegant fastback-sedan med lyxig interiör. Premiumambitioner till konkurrenskraftigt pris.'
WHERE make = 'Peugeot' AND model = '508';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportig laddhybridversion av 508 med 360 hk. Snabb och effektiv kombination.'
WHERE make = 'Peugeot' AND model = '508 PSE';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Praktisk kombi-version av 508 med stor kapacitet och lyxig interiör.'
WHERE make = 'Peugeot' AND model = '508 SW';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 3,
  expert_comment = 'Stor skåpbil för transport. Pålitlig och kapabel med bred utrustning.'
WHERE make = 'Peugeot' AND model = 'Boxer';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk liten SUV med bra räckvidd. Peugeots elbil-svar i kompaktformat.'
WHERE make = 'Peugeot' AND model = 'e-2008';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk version av 208 med bra räckvidd. Prisvärd elbil med Peugeots stilkänsla.'
WHERE make = 'Peugeot' AND model = 'e-208';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk version av 3008 med lång räckvidd. Modern design och snabbladdning.'
WHERE make = 'Peugeot' AND model = 'e-3008';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk version av 308 med bra räckvidd. Kompakt elbil med Peugeots originella design.'
WHERE make = 'Peugeot' AND model = 'e-308';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk kombi-version av 308 med bra räckvidd och lastutrymme.'
WHERE make = 'Peugeot' AND model = 'e-308 SW';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk fastback-version med coupéprofil och bra räckvidd. Snygg elbil.'
WHERE make = 'Peugeot' AND model = 'e-408';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Elektrisk stor SUV med sju säten. Familjevänlig elbil med lång räckvidd.'
WHERE make = 'Peugeot' AND model = 'e-5008';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Mellanstort skåpfordon för yrkestrafik. Praktisk och pålitlig vardagsbil.'
WHERE make = 'Peugeot' AND model = 'Expert';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt skåpbil med el-alternativ. Praktisk stadslösning för transport.'
WHERE make = 'Peugeot' AND model = 'Partner';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Rymlig MPV för familjen. Praktiska skjutdörrar och bra lastutrymme.'
WHERE make = 'Peugeot' AND model = 'Rifter';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 9,
  expert_comment = 'Stor minibuss för transport av upp till nio passagerare. Bra för grupper och familjer.'
WHERE make = 'Peugeot' AND model = 'Traveller';

-- Polestar
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Prisvinnande elektrisk fastback med imponerande räckvidd och sportig körkaraktär. En av marknadens bästa elbilar.'
WHERE make = 'Polestar' AND model = '2';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Stor elektrisk SUV med lång räckvidd och lyxig interiör. Polestars svar på Volvo XC90.'
WHERE make = 'Polestar' AND model = '3';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Kompakt elektrisk SUV med bakhjulsdrift och sportiga ambitioner. Spännande alternativ.'
WHERE make = 'Polestar' AND model = '4';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 10, seats = 4,
  expert_comment = 'Handbyggd elektrisk GT med 872 hk. Polestars supercar på el med extrem prestanda.'
WHERE make = 'Polestar' AND model = '5';

-- Porsche
UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 2,
  expert_comment = 'Klassisk Boxster roadster med mittmonterad boxer-motor. En av de bästa roadstrarna.'
WHERE make = 'Porsche' AND model = '718 Boxster';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 2,
  expert_comment = 'Coupé-version av 718 med hårt tak. Extremt rolig och hanterbar sportbil.'
WHERE make = 'Porsche' AND model = '718 Cayman';

UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 2,
  expert_comment = 'Toppversionen av 718 med 500 hk GT4-motor. En av årets roligaste bilar att köra.'
WHERE make = 'Porsche' AND model = '718 Spyder';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'sports',
  rating_overall = 10, seats = 4,
  expert_comment = 'Det ultimata sportbilsikonet. 911 har raffinerats i 60 år och är fortfarande oslagbar.'
WHERE make = 'Porsche' AND model = '911';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportbils-SUV som definierade ett segment. Extremt kapabel och rolig att köra i SUV-format.'
WHERE make = 'Porsche' AND model = 'Cayenne';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','laddhybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ny generation Macan nu med elbilsalternativ. Kompakt sportbils-SUV på hög nivå.'
WHERE make = 'Porsche' AND model = 'Macan';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','laddhybrid','hybrid'], segment = 'luxury',
  rating_overall = 9, seats = 4,
  expert_comment = 'Sportig lyxbil med bred motorpalett. Kombinerar sportbilskänsla med praktisk fyrsitsig design.'
WHERE make = 'Porsche' AND model = 'Panamera';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 10, seats = 4,
  expert_comment = 'Elektrisk sportsedan som konkurrerar med Tesla Model S i prestanda. Porsche på el i toppklass.'
WHERE make = 'Porsche' AND model = 'Taycan';

-- Renault
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk nyversion av legendariska R4. Modern reinkarnation av en ikon med nutida teknik.'
WHERE make = 'Renault' AND model = '4 E-Tech';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk nyversion av legendariska R5. Lekfull och prisvärd elbil med retro-charm.'
WHERE make = 'Renault' AND model = '5 E-Tech';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Coupe-SUV med hybrid och elegant design. Stilig men med kompromisser på bakre plats.'
WHERE make = 'Renault' AND model = 'Arkana';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny Renault flagship-SUV med bred hybridpalett. Komfortabel och välutrustad.'
WHERE make = 'Renault' AND model = 'Austral';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid','laddhybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten kompakt SUV med hybrid-alternativ. Populär och prisvärd stadsbil.'
WHERE make = 'Renault' AND model = 'Captur';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Charmig liten bil med E-Tech hybrid. Bränslesnål och praktisk stadsbil.'
WHERE make = 'Renault' AND model = 'Clio';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid','el'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor SUV med upp till sju säten. Rymlig familjebil med bred motorpalett.'
WHERE make = 'Renault' AND model = 'Grand Scenic';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Mellanstor SUV nu i slutet av sin livscykel. Pålitlig men ålderdomlig teknik.'
WHERE make = 'Renault' AND model = 'Kadjar';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt skåpbil med el-alternativ. Praktisk lösning för hantverkare och leverans.'
WHERE make = 'Renault' AND model = 'Kangoo';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 7, seats = 5,
  expert_comment = 'Stor SUV med rymlig interiör. Pålitlig men ålderdomlig design.'
WHERE make = 'Renault' AND model = 'Koleos';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 3,
  expert_comment = 'Stor transportbil för yrkestrafik. Pålitlig och välkänd inom transport-sektorn.'
WHERE make = 'Renault' AND model = 'Master';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk kompaktbil med modern design och bra räckvidd. Renaults bästa elbil.'
WHERE make = 'Renault' AND model = 'Megane E-Tech';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Legendärt RS-märke med 300 hk och Nürburgring-rekord. En klassisk hothatch-ikon.'
WHERE make = 'Renault' AND model = 'Megane RS';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Praktisk kombi med hybrid-alternativ. Bra lastutrymme och prisvärd allroundbil.'
WHERE make = 'Renault' AND model = 'Megane Sport Tourer';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid','el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny generation Scenic som elektrisk SUV. Vacker design och bra räckvidd.'
WHERE make = 'Renault' AND model = 'Scenic';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Mellanstort skåpfordon för yrkestrafik. Populär och pålitlig transportlösning.'
WHERE make = 'Renault' AND model = 'Trafic';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','el'], segment = 'budget',
  rating_overall = 6, seats = 4,
  expert_comment = 'Liten och billig stadsbil. Begränsad men prisvärd ingångspunkt i Renault-sortimentet.'
WHERE make = 'Renault' AND model = 'Twingo';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Pionjär bland kompakta elbilar. Enkel och prisvärd men med begränsad räckvidd.'
WHERE make = 'Renault' AND model = 'Zoe';
