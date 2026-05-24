/*
  # Enrich car catalog - Batch 2: Genesis, Honda, Hyundai, Jaguar, Jeep, Kia, Lamborghini, Land Rover, Lexus, Mazda
*/

-- Genesis
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Koreansk lyx-SUV med elegant design och toppmodern teknik. Imponerande räckvidd och snabbladdning.'
WHERE make = 'Genesis' AND model = 'GV60';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','laddhybrid'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Exklusiv mellanstor SUV med lyxig interiör och bra prestanda. Genesis på väg mot toppen.'
WHERE make = 'Genesis' AND model = 'GV70';

-- Honda
UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig kompaktbil med utmärkt kvalitetsrykte. Bra att köra och pålitlig över tid.'
WHERE make = 'Honda' AND model = 'Civic';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Legendarisk hothatch med 320 hk, bakhjulsdrift och manuell låda. En körentusiasts dröm.'
WHERE make = 'Honda' AND model = 'Civic Type R';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Familjorienterad SUV med beprövad hybrid-teknik och rymlig interiör. Pålitlig allroundare.'
WHERE make = 'Honda' AND model = 'CR-V';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 4,
  expert_comment = 'Liten söt elbil med originellt utseende. Kort räckvidd men rolig stadsbil.'
WHERE make = 'Honda' AND model = 'e';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt elektrisk SUV med Hondas teknikkunnande. Bra räckvidd och välbalanserad körupplevelse.'
WHERE make = 'Honda' AND model = 'e:Ny1';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt SUV med hybrid-alternativ. Praktisk och bränslesnål vardagsbil.'
WHERE make = 'Honda' AND model = 'HR-V';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten och smidig bil med unik e:HEV hybrid-teknik. Bränslesnål och rolig att köra.'
WHERE make = 'Honda' AND model = 'Jazz';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny generation av legendarisk sportmodell med modern hybridteknik. Honda återvänder till rötterna.'
WHERE make = 'Honda' AND model = 'Prelude';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny kompakt SUV med sportiga linjer och effektiv hybrid. Bra alternativ i populärt segment.'
WHERE make = 'Honda' AND model = 'ZR-V';

-- Hyundai
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten SUV med bra utrustning för priset. Bra säkerhet och lång garanti.'
WHERE make = 'Hyundai' AND model = 'Bayon';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten och ekonomisk stadsbil med bra säkerhet och lång garanti. Pålitlig vardagsbil.'
WHERE make = 'Hyundai' AND model = 'i10';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt och prisvärd med bra utrustning. Bra val för den priskänslige.'
WHERE make = 'Hyundai' AND model = 'i20';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportversion av i20 med 204 hk. Rolig och aggressiv hothatch till bra pris.'
WHERE make = 'Hyundai' AND model = 'i20 N';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välrundad kompakthatchback med bra utrustning och pålitliga motorer. Prisvärd allroundare.'
WHERE make = 'Hyundai' AND model = 'i30';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Praktisk kombi-version av i30 med rymligt lastutrymme. Bra familjevalternativ.'
WHERE make = 'Hyundai' AND model = 'i30 SW';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Stor kombi med bra plats och pålitliga motorer. Ålderdomlig design men praktisk.'
WHERE make = 'Hyundai' AND model = 'i40 SW';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Ny liten elbil för stadsmiljö. Bra räckvidd för klassen och välutrustad.'
WHERE make = 'Hyundai' AND model = 'Inster';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt laddhybrid med bra elektrisk räckvidd. Bra miljöalternativ med låga driftkostnader.'
WHERE make = 'Hyundai' AND model = 'IONIQ';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk SUV med 800V-teknik och snabb laddning. En av marknadens bästa elbilar.'
WHERE make = 'Hyundai' AND model = 'IONIQ 5';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'sports',
  rating_overall = 10, seats = 5,
  expert_comment = 'Prestandaversion av IONIQ 5 med 650 hk. Snabbaste produktionsbilen runt Nürburgring.'
WHERE make = 'Hyundai' AND model = 'IONIQ 5 N';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk fastbacksedan med lång räckvidd och aerodynamisk design. Imponerande val.'
WHERE make = 'Hyundai' AND model = 'IONIQ 6';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Liten kompakt MPV. Praktisk men ålderdomlig design. Bra utrymmen för storleken.'
WHERE make = 'Hyundai' AND model = 'ix20';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Äldre kompakt SUV fortfarande i försäljning. Pålitlig men teknologiskt daterad.'
WHERE make = 'Hyundai' AND model = 'ix35';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Populär kompakt SUV med bra utrustning och bred motorpalett inklusive elbil-version.'
WHERE make = 'Hyundai' AND model = 'Kona';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk version av Kona med bra räckvidd. En av de mest prisvärda kompakta elbilarna.'
WHERE make = 'Hyundai' AND model = 'Kona Electric';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Höjsprestanda-version av Kona med 280 hk och fyrhjulsdrift. Sportig kompakt SUV.'
WHERE make = 'Hyundai' AND model = 'Kona N';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor familje-SUV med möjlighet till sju säten. Bra utrymmen och bred motorpalett.'
WHERE make = 'Hyundai' AND model = 'Santa Fe';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 7, seats = 9,
  expert_comment = 'Stort MPV/minibuss med upp till nio säten. Perfekt för familjer och transport.'
WHERE make = 'Hyundai' AND model = 'Staria';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välsäljande mellanstor SUV med modern design och bred motorpalett. Bra allroundalternativ.'
WHERE make = 'Hyundai' AND model = 'Tucson';

-- Jaguar
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 8, seats = 5,
  expert_comment = 'Jaguars elektriska SUV med lyxig interiör och bra prestanda. Brittisk elegans på el.'
WHERE make = 'Jaguar' AND model = 'I-Pace';

-- Jeep
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','laddhybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten Jeep med bra utrustning och el-alternativ. Rolig design med Jeep-arv.'
WHERE make = 'Jeep' AND model = 'Avenger';

-- Kia
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt halvkombi med bra utrustning och lång garanti. Bra vardagsbil till rätt pris.'
WHERE make = 'Kia' AND model = 'Ceed';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Praktisk kombi-version av Ceed med rymligt lastutrymme. Bra prisvärde.'
WHERE make = 'Kia' AND model = 'Ceed SW';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten elektrisk SUV med bra räckvidd och välutrustad. Kias svar på Volkswagen ID.3.'
WHERE make = 'Kia' AND model = 'EV3';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kommande elektrisk kompaktsedan. Kia expanderar sin elbilsportfölj nedåt.'
WHERE make = 'Kia' AND model = 'EV4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Mellanstor elektrisk SUV med bra räckvidd och konkurrenskraftigt pris.'
WHERE make = 'Kia' AND model = 'EV5';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk SUV med 800V-teknik och snabbladdning. En av marknadens bästa elbilar sida vid sida med IONIQ 5.'
WHERE make = 'Kia' AND model = 'EV6';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 9, seats = 7,
  expert_comment = 'Stor elektrisk SUV med sju säten och imponerande räckvidd. Kias elbil-flaggskepp.'
WHERE make = 'Kia' AND model = 'EV9';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny global modell med elegant design och effektiva hybrid-alternativ. Välutrustad sedan.'
WHERE make = 'Kia' AND model = 'K4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Mångsidig SUV med bred motorpalett från bensin till ren el. Bra familjeorienterad SUV.'
WHERE make = 'Kia' AND model = 'Niro';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Stor sportkombi med bra utrymmen. Ersatt av nyare modeller men fortfarande sålda.'
WHERE make = 'Kia' AND model = 'Optima SW';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten ekonomisk stadsbil med bred utrustning och lång garanti. Perfekt pendlare.'
WHERE make = 'Kia' AND model = 'Picanto';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig skjutback-kaross på Ceed-plattform. Unik design och bra körupplevelse.'
WHERE make = 'Kia' AND model = 'ProCeed';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk kompakt skåpbil baserad på EV-plattform. Ny klass av elbil för arbete.'
WHERE make = 'Kia' AND model = 'PV5';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten och prisvärd kompakthatchback med bred standard-utrustning och lång garanti.'
WHERE make = 'Kia' AND model = 'Rio';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor familje-SUV med upp till sju säten och bred motorpalett. Bra prisvärde och utrymmen.'
WHERE make = 'Kia' AND model = 'Sorento';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt SUV med originell boxig design. El-version med god räckvidd.'
WHERE make = 'Kia' AND model = 'Soul';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kias mest sålda SUV med bred motorpalett och bra utrustning. Välbalanserad allroundbil.'
WHERE make = 'Kia' AND model = 'Sportage';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 8, seats = 5,
  expert_comment = 'Sportig liftback med kraftfull V6-motor. Unik sportsedanupplevelse från Kia.'
WHERE make = 'Kia' AND model = 'Stinger';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten och prisvärd crossover-SUV. Bra utrustning och Kias välkända garanti.'
WHERE make = 'Kia' AND model = 'Stonic';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Crossover-SUV baserad på Ceed med sportiga linjer och bra körupplevelse.'
WHERE make = 'Kia' AND model = 'XCeed';

-- Lamborghini
UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 2,
  expert_comment = 'Extrem V12-superbil med 770 hk. En av de mest dramatiska bilarna som någonsin byggts.'
WHERE make = 'Lamborghini' AND model = 'Aventador SVJ';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 2,
  expert_comment = 'V10-superbil med 640 hk och natural-aspirerad motor. Legendarisk körupplevelse.'
WHERE make = 'Lamborghini' AND model = 'Huracan';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'sports',
  rating_overall = 10, seats = 2,
  expert_comment = 'Ny generation supersportbil med V12 hybridteknik och 1 015 hk. Lamborghinis framtid.'
WHERE make = 'Lamborghini' AND model = 'Revuelto';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportbils-SUV med 666 hk och Lamborghinis unika DNA. Lyx och prestanda i SUV-form.'
WHERE make = 'Lamborghini' AND model = 'Urus';

-- Land Rover
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ikonisk off-road SUV med militär DNA. Kapabel i alla terränger men bekväm på väg.'
WHERE make = 'Land Rover' AND model = 'Defender';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt premium-SUV med bra off-road-kapabilitet. Elegant och praktisk allroundbil.'
WHERE make = 'Land Rover' AND model = 'Discovery Sport';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'luxury',
  rating_overall = 10, seats = 5,
  expert_comment = 'Det ultimata lyxiga off-road-fordonet. Obegränsad kapabilitet med oskäligt hög komfort.'
WHERE make = 'Land Rover' AND model = 'Range Rover';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt Range Rover med elegant design och bra stadslämplighet. Premium-känsla i kompaktformat.'
WHERE make = 'Land Rover' AND model = 'Range Rover Evoque';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 5,
  expert_comment = 'Sportig variant av Range Rover med kraftfulla motorer. Körglad premium-SUV.'
WHERE make = 'Land Rover' AND model = 'Range Rover Sport';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'premium',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegant och aerodinamisk mellanstor Range Rover. Elegant design och bra komfort.'
WHERE make = 'Land Rover' AND model = 'Range Rover Velar';

-- Lexus
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Premium-halvkombi med hybridteknik och utmärkt kvalitet. Bränslesnål och tyst.'
WHERE make = 'Lexus' AND model = 'CT';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Lyxig hybrid-sedan med mjuk körning och utmärkt komfort. Stor och elegant.'
WHERE make = 'Lexus' AND model = 'ES';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välrundad sportsedan med bra köregenskaper och Lexus kvalitet. Konkurrerar med 3-serie och E-klass.'
WHERE make = 'Lexus' AND model = 'GS';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt premiumsedan med sportig design och effektiv hybrid. Populär i sitt segment.'
WHERE make = 'Lexus' AND model = 'IS';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','hybrid'], segment = 'sports',
  rating_overall = 9, seats = 4,
  expert_comment = 'Lyxig sportcoupé med V8 eller hybrid. Sällsynt kombination av lyx och prestanda.'
WHERE make = 'Lexus' AND model = 'LC';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['hybrid'], segment = 'luxury',
  rating_overall = 8, seats = 7,
  expert_comment = 'Lyxigt MPV för VIP-transport. Massagesäten och skärmar i baksätet. Ultimat komfort.'
WHERE make = 'Lexus' AND model = 'LM';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','hybrid'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Flaggskeppssedan med ultralux-inredning. Konkurrerar med S-klass och A8 i lyx-segmentet.'
WHERE make = 'Lexus' AND model = 'LS';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Mellanstor premium-SUV med hybrid och ny elbil-version. Bra allroundalternativ med Lexus-kvalitet.'
WHERE make = 'Lexus' AND model = 'NX';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin','hybrid'], segment = 'sports',
  rating_overall = 8, seats = 4,
  expert_comment = 'Sportig F-sport coupé med elegant design. Mer stylad än snabb men bra körupplevelse.'
WHERE make = 'Lexus' AND model = 'RC';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Beprövad mellanstor premium-SUV med bra hybridteknik och lyxig interiör.'
WHERE make = 'Lexus' AND model = 'RX';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kompakt premium-SUV med distinkt design och bra hybridteknik. Smidig stadsbil.'
WHERE make = 'Lexus' AND model = 'UX';

-- Mazda
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Väldesignad kompakt SUV med bra köregenskaper och premiumkänsla. Rolig Mazda-karaktär.'
WHERE make = 'Mazda' AND model = 'CX-30';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välutprövad mellanstor SUV med utmärkt körupplevelse och bra bränsleekonomi.'
WHERE make = 'Mazda' AND model = 'CX-5';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Stor Mazda SUV med rak-6-motor och bakhjulsdrift. Premium-ambitioner med Mazda-karaktär.'
WHERE make = 'Mazda' AND model = 'CX-60';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegantast i kompaktklassen. Premiumkänsla och bra körupplevelse till måttligt pris.'
WHERE make = 'Mazda' AND model = 'Mazda3';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Elektrisk Mazda med unik rotor-range extender i laddhybrid-version. Ovanlig och intressant.'
WHERE make = 'Mazda' AND model = 'MX-30';

UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 2,
  expert_comment = 'Legendarisk lättviktsroadster med mjukt tak. Ren körupplevelse och bilintusiasternas favorit.'
WHERE make = 'Mazda' AND model = 'MX-5';
