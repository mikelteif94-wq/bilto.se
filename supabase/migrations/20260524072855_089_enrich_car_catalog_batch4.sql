/*
  # Enrich car catalog - Batch 4: Seat, Skoda, smart, Suzuki, Tesla, Toyota, Volkswagen, Volvo, Xpeng
*/

-- Seat
UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 7, seats = 7,
  expert_comment = 'Stor spansk MPV med sju säten. Praktisk familjefordon nu i slutet av sin livscykel.'
WHERE make = 'Seat' AND model = 'Alhambra';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt spansk SUV med bra utrustning och prisvärd positionering. Solid allroundbil.'
WHERE make = 'Seat' AND model = 'Ateca';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten prisvärd hatchback med bra utrustning och god köregenskaper för priset.'
WHERE make = 'Seat' AND model = 'Ibiza';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välrundad kompakthatchback med bredare motorpalett. Bra köregenskaper och god utrustning.'
WHERE make = 'Seat' AND model = 'Leon';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','el'], segment = 'budget',
  rating_overall = 6, seats = 4,
  expert_comment = 'Liten och billig stadsbil nu med elbilsversion. Begränsad men prisvärd ingångspunkt.'
WHERE make = 'Seat' AND model = 'Mii';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 7, seats = 7,
  expert_comment = 'Stor spansk SUV med plats för sju. Prisvärd familje-SUV med bra kapacitet.'
WHERE make = 'Seat' AND model = 'Tarraco';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 6, seats = 5,
  expert_comment = 'Kompaktsedan i slutet av sin livscykel. Funktionell men daterad design och teknik.'
WHERE make = 'Seat' AND model = 'Toledo';

-- Skoda
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','el'], segment = 'budget',
  rating_overall = 6, seats = 4,
  expert_comment = 'Liten stadscar ur produktion. Enkel och ekonomisk men nu ersatt av nyare alternativ.'
WHERE make = 'Skoda' AND model = 'Citigo';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk SUV med enastående platseffektivitet och bra räckvidd. Prisvärda Skodas bästa elbil.'
WHERE make = 'Skoda' AND model = 'Enyaq';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välrundad liten hatchback med bra plats och bra prisvärde. Skodas populäraste modell.'
WHERE make = 'Skoda' AND model = 'Fabia';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten kompakt SUV med Skodas typiska platseffektivitet. Bra prisvärde i klassen.'
WHERE make = 'Skoda' AND model = 'Kamiq';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Mellanstor SUV med utmärkt platseffektivitet och bra prisvärde. En av segmentets bästa val.'
WHERE make = 'Skoda' AND model = 'Karoq';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor familje-SUV med plats för sju och utmärkt platseffektivitet. Skodas bästa SUV.'
WHERE make = 'Skoda' AND model = 'Kodiaq';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'En av Europas bäst säljande bilar. Utmärkt platseffektivitet, bra teknik och väldigt prisvärd.'
WHERE make = 'Skoda' AND model = 'Octavia';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Europas mest prisvärda familjebil. Enorm bagageutrymme och bra motorpalett.'
WHERE make = 'Skoda' AND model = 'Octavia Combi';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Kompakt MPV ur produktion men fortfarande sålda begagnade. God platseffektivitet.'
WHERE make = 'Skoda' AND model = 'Roomster';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Stor premiumsedan till VW-pris. Enorm interiör och utmärkt komfort till oslagbart prisvärde.'
WHERE make = 'Skoda' AND model = 'Superb';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Europas mest rymliga kombi till rimligt pris. Enorm bagagekapacitet och lyxkänsla.'
WHERE make = 'Skoda' AND model = 'Superb Combi';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt SUV ur produktion. Beprövad och pålitlig men nu ersatt av Karoq.'
WHERE make = 'Skoda' AND model = 'Yeti';

-- smart
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kinesisk-tysk elbil under nylandserat smart-märke. Bra teknik men priskonkurrens är stenhård.'
WHERE make = 'smart' AND model = '#1';

-- Suzuki
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Suzukis hybrid-SUV baserad på Toyota RAV4. Bra off-road och bränsleekonomi.'
WHERE make = 'Suzuki' AND model = 'Across';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Mycket liten och billig stadsbil. Begränsad men prisvänlig ingångspunkt.'
WHERE make = 'Suzuki' AND model = 'Alto';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten hatchback med bra utrustning för priset. Praktisk och ekonomisk dagligbil.'
WHERE make = 'Suzuki' AND model = 'Baleno';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 6, seats = 5,
  expert_comment = 'Mycket liten och prisvärd stadsbil. Enkel men funktionell pendlarbil.'
WHERE make = 'Suzuki' AND model = 'Celerio';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin'], segment = 'budget',
  rating_overall = 8, seats = 4,
  expert_comment = 'Ikonisk liten off-roader med bakhjulsdrift och manuell låda. Unik kapabilitet i kompaktformat.'
WHERE make = 'Suzuki' AND model = 'Jimny';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt SUV med mild hybrid. Pålitlig och ekonomisk allroundbil.'
WHERE make = 'Suzuki' AND model = 'S-Cross';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Suzukis hybrid-kombi baserad på Toyota Corolla. Bränslesnål familjebil.'
WHERE make = 'Suzuki' AND model = 'Swace';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten och rolig hatchback med mild hybrid. Bra köregenskaper och ekonomisk drift.'
WHERE make = 'Suzuki' AND model = 'Swift';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Mellanstor SUV med hybrid-alternativ. Enkel och prisvärd allroundbil.'
WHERE make = 'Suzuki' AND model = 'SX4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt SUV med fyra drivhjulsalternativ och mild hybrid. Kapabel off-road till rimligt pris.'
WHERE make = 'Suzuki' AND model = 'Vitara';

-- Tesla
UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Den bil som revolutionerade elbilsmarknaden. Bra räckvidd, snabb laddning och rolig att köra.'
WHERE make = 'Tesla' AND model = 'Model 3';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Teslas flaggskeppssedan med extremt lång räckvidd och Ludicrous-läge. El-lyx i toppklass.'
WHERE make = 'Tesla' AND model = 'Model S';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 7,
  expert_comment = 'Stor elektrisk SUV med falkvingsdörrar och sju säten. Unik och teknologiskt imponerande.'
WHERE make = 'Tesla' AND model = 'Model X';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Europas mest sålda elbil. Bra räckvidd, snabbladdning och kompetent allroundbil.'
WHERE make = 'Tesla' AND model = 'Model Y';

-- Toyota
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten crossover-SUV med hybrid-alternativ. Rolig och praktisk stadsbil.'
WHERE make = 'Toyota' AND model = 'Aygo X';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Toyotas elektriska SUV på Subaru-plattform. Bra räckvidd och pålitlig Toyota-kvalitet.'
WHERE make = 'Toyota' AND model = 'bZ4X';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Distinkt design med bold-look och bra hybridteknik. En av Toyotas mest originella bilar.'
WHERE make = 'Toyota' AND model = 'C-HR';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Pålitlig hybrid-kompaktbil med utmärkt bränsleekonomi. Toyota-kvalitet och lång livslängd.'
WHERE make = 'Toyota' AND model = 'Corolla Hybrid';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Praktisk hybrid-kombi med exceptionell bränsleekonomi. Pålitlig Toyota-kvalitet i kombiformat.'
WHERE make = 'Toyota' AND model = 'Corolla Touring Sports';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 10, seats = 4,
  expert_comment = 'Rallybil för gatan med 272 hk och fyrhjulsdrift. En av de roligaste bilarna att köra.'
WHERE make = 'Toyota' AND model = 'GR Yaris';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor SUV med plats för sju och hybrid-alternativ. Pålitlig och välrundad familjebil.'
WHERE make = 'Toyota' AND model = 'Highlander';

UPDATE car_catalog SET
  body_type = 'pickup', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Legendarisk tålig pickup med oöverträffad pålitlighet. En av världens bäst säljande bilar.'
WHERE make = 'Toyota' AND model = 'Hilux';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 7,
  expert_comment = 'Ikonisk off-road-SUV med enastående pålitlighet. Används världen över i tuffaste förhållanden.'
WHERE make = 'Toyota' AND model = 'Land Cruiser';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Pionjären bland hybridbilar. Prisvinnande design och exceptionell bränsleekonomi.'
WHERE make = 'Toyota' AND model = 'Prius';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 3,
  expert_comment = 'Pålitlig stor transportbil för yrkestrafik. Toyota-kvalitet i skåpformat.'
WHERE make = 'Toyota' AND model = 'ProAce';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt skåpbil med el-alternativ. Pålitlig och praktisk stadsleverantör.'
WHERE make = 'Toyota' AND model = 'ProAce City';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 7,
  expert_comment = 'Kompakt minibuss för familj och yrkestrafik. Praktisk med bra platsutnyttjande.'
WHERE make = 'Toyota' AND model = 'ProAce City Verso';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 9,
  expert_comment = 'Stor minibuss med upp till nio platser. Pålitlig Toyota för grupptransport.'
WHERE make = 'Toyota' AND model = 'ProAce Verso';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'En av Europas mest populära SUV:ar. Bred motorpalett, bra köregenskaper och Toyota-pålitlighet.'
WHERE make = 'Toyota' AND model = 'RAV4';

UPDATE car_catalog SET
  body_type = 'coupe', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 2,
  expert_comment = 'Ren sportbil med rak-6-motor och bakhjulsdrift. Toyota-BMW-samarbete ger exceptionell körglädje.'
WHERE make = 'Toyota' AND model = 'Supra';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','el','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny kompakt SUV på ny plattform. Bred motorpalett och bra allround-egenskaper.'
WHERE make = 'Toyota' AND model = 'Urban Cruiser';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten och bränslesnål bil med hybrid-teknik. Pålitlig Toyota-kvalitet till bra pris.'
WHERE make = 'Toyota' AND model = 'Yaris';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','hybrid'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten crossover-SUV med hybrid-teknik. Bra köregenskaper och ekonomisk drift.'
WHERE make = 'Toyota' AND model = 'Yaris Cross';

-- Volkswagen
UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegant fastback med unik design. Lite bortglömd men bra alternativ för den stilmedvetne.'
WHERE make = 'Volkswagen' AND model = 'Arteon';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt skåpbil med el-alternativ. Pålitlig VW-kvalitet i praktiskt format.'
WHERE make = 'Volkswagen' AND model = 'Caddy';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel','hybrid','laddhybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ikonisk bil och referenspunkt för kompaktbilar. Välbalanserad, pålitlig och bra att köra.'
WHERE make = 'Volkswagen' AND model = 'Golf';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Golf med laddhybrid och 245 hk. Bra alternativ för den miljömedvetne Golf-entusiasten.'
WHERE make = 'Volkswagen' AND model = 'Golf GTE';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Legendarisk GTI med 265 hk och skarp chassituning. Den ursprungliga hothatchén.'
WHERE make = 'Volkswagen' AND model = 'Golf GTI';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ultimata Golf med 333 hk och fyrhjulsdrift. En körmaksin som kan användas dagligen.'
WHERE make = 'Volkswagen' AND model = 'Golf R';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 7,
  expert_comment = 'Elektrisk modern Bulli-buss med plats för sju. Nostalgi möter framtid i unik design.'
WHERE make = 'Volkswagen' AND model = 'ID. Buzz';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'VW:s elektriska Golf-ersättare. Bra räckvidd och välbekant VW-känsla på el.'
WHERE make = 'Volkswagen' AND model = 'ID.3';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk kompakt SUV med bra räckvidd. En av de mest sålda elbilarna i Europa.'
WHERE make = 'Volkswagen' AND model = 'ID.4';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Coupé-version av ID.4 med sportigt utseende. Snyggt alternativ med lite sämre baksätesplats.'
WHERE make = 'Volkswagen' AND model = 'ID.5';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk stor sedan med lång räckvidd. Rymlig och komfortabel elbil i premiumformat.'
WHERE make = 'Volkswagen' AND model = 'ID.7';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elektrisk kombi-version av ID.7 med stort lastutrymme. Familjevänlig elbil med lång räckvidd.'
WHERE make = 'Volkswagen' AND model = 'ID.7 Tourer';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Modern premium-minibuss med plats för sju. Ersätter gamla T5/T6 Caravelle i personbilsformat.'
WHERE make = 'Volkswagen' AND model = 'Multivan';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Ny generation Passat nu enbart som kombi. Stor och välrundad familjebil i toppklass.'
WHERE make = 'Volkswagen' AND model = 'Passat Variant';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'VW:s lilla storstad med Golf-känsla i kompaktformat. Välgjord och bra prisvärde.'
WHERE make = 'Volkswagen' AND model = 'Polo';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten SUV med Golf-teknik. Bra för stadskörning med SUV-höjd och praktisk design.'
WHERE make = 'Volkswagen' AND model = 'T-Cross';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Välbalanserad kompakt SUV med Golf-teknik. Bra köregenskaper och bred motorpalett.'
WHERE make = 'Volkswagen' AND model = 'T-Roc';

UPDATE car_catalog SET
  body_type = 'cab', fuel_types = ARRAY['bensin'], segment = 'sports',
  rating_overall = 7, seats = 4,
  expert_comment = 'Cabriolet-version av T-Roc. Sällsynt öppen SUV-känsla med VW-kvalitet.'
WHERE make = 'Volkswagen' AND model = 'T-Roc Cabriolet';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'budget',
  rating_overall = 7, seats = 5,
  expert_comment = 'Liten kompakt SUV med sportig design. Bra stadsbil med SUV-höjd till prisvärt pris.'
WHERE make = 'Volkswagen' AND model = 'Taigo';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 7,
  expert_comment = 'Ny stor SUV som ersätter Tiguan Allspace. Bra plats och bred motorpalett.'
WHERE make = 'Volkswagen' AND model = 'Tayron';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'VW:s mest sålda bil. Utmärkt allroundbil med bra köregenskaper och teknik.'
WHERE make = 'Volkswagen' AND model = 'Tiguan';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'premium',
  rating_overall = 8, seats = 7,
  expert_comment = 'Stor premium-SUV med plats för sju. Lyxigare än Tiguan men till VW-pris.'
WHERE make = 'Volkswagen' AND model = 'Touareg';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 7, seats = 7,
  expert_comment = 'Kompakt MPV med plats för sju. Väljer kompromissen mellan sedan och minibuss.'
WHERE make = 'Volkswagen' AND model = 'Touran';

UPDATE car_catalog SET
  body_type = 'mpv', fuel_types = ARRAY['bensin','diesel','el'], segment = 'budget',
  rating_overall = 7, seats = 3,
  expert_comment = 'Klassisk transportbil med bred konfigurationspalett. VW-pålitlighet för yrkestrafik.'
WHERE make = 'Volkswagen' AND model = 'Transporter';

-- Volvo
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk SUV baserad på C40-plattform med coupéprofil. Stilig och praktisk Volvo-elbil.'
WHERE make = 'Volvo' AND model = 'EC40';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['el'], segment = 'luxury',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ny elektrisk Volvo-flaggskepp-sedan. Elegant design och lång räckvidd i lyxformat.'
WHERE make = 'Volvo' AND model = 'ES90';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'budget',
  rating_overall = 8, seats = 5,
  expert_comment = 'Liten elektrisk SUV med imponerande räckvidd och snabbladdning. Bästa elbilen i sitt segment.'
WHERE make = 'Volvo' AND model = 'EX30';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Cross Country-version av EX30 med högre markfrigång. Bra för svenska vinterförhållanden.'
WHERE make = 'Volvo' AND model = 'EX30 Cross Country';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk XC40 med bra räckvidd och Volvo-säkerhet. En av de bästa kompakta el-SUV:arna.'
WHERE make = 'Volvo' AND model = 'EX40';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'Ny mellanstor elektrisk SUV som ersätter XC60. Elegant design och lång räckvidd.'
WHERE make = 'Volvo' AND model = 'EX60';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'premium',
  rating_overall = 9, seats = 7,
  expert_comment = 'Elektrisk XC90 med plats för sju och imponerande räckvidd. Volvo på el i toppklass.'
WHERE make = 'Volvo' AND model = 'EX90';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Elegant och säker kompaktsedan med bred motorpalett. Typisk Volvo-kombination av säkerhet och design.'
WHERE make = 'Volvo' AND model = 'S60';

UPDATE car_catalog SET
  body_type = 'sedan', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Stor elegant sedan med lyxig interiör. Volvo-flaggskepp i sedanform med bra komfort.'
WHERE make = 'Volvo' AND model = 'S90';

UPDATE car_catalog SET
  body_type = 'hatchback', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Kompakt Volvo nu i slutet av sin livscykel. Säker och väldesignad men daterad teknik.'
WHERE make = 'Volvo' AND model = 'V40';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'compact',
  rating_overall = 7, seats = 5,
  expert_comment = 'Cross Country-version av V40 med höjd markfrigång. Bra för svenska vinterförhållanden.'
WHERE make = 'Volvo' AND model = 'V40 Cross Country';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'En av Europas bästa kompaktkombisar. Säker, rymlig och snygg med bred motorpalett.'
WHERE make = 'Volvo' AND model = 'V60';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'compact',
  rating_overall = 8, seats = 5,
  expert_comment = 'Cross Country-version av V60 med höjd markfrigång och off-road-förmåga.'
WHERE make = 'Volvo' AND model = 'V60 Cross Country';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Klassisk Volvo-kombi i slutet av sin livscykel. Beprövad och säker men ersatt av V90.'
WHERE make = 'Volvo' AND model = 'V70';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Stor premiumkombi med lyxig interiör. Volvo-komfort och säkerhet i toppklass.'
WHERE make = 'Volvo' AND model = 'V90';

UPDATE car_catalog SET
  body_type = 'kombi', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Cross Country-version av V90. Höjd markfrigång och äventyrskänsla i premiumformat.'
WHERE make = 'Volvo' AND model = 'V90 Cross Country';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','el','laddhybrid','hybrid'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'En av Europas mest populära premium-SUV:ar. Bred motorpalett, säker och väldesignad.'
WHERE make = 'Volvo' AND model = 'XC40';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'compact',
  rating_overall = 9, seats = 5,
  expert_comment = 'Elektrisk version av XC40 med bra räckvidd. Volvo-kvalitet och säkerhet på el.'
WHERE make = 'Volvo' AND model = 'XC40 Recharge';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid'], segment = 'midsize',
  rating_overall = 9, seats = 5,
  expert_comment = 'En av Europas bästa mellanklass-SUV:ar. Elegant design, säker och välbalanserad körkänsla.'
WHERE make = 'Volvo' AND model = 'XC60';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Cross Country-version av den klassiska X70-generationen. Beprövad men nu daterad teknik.'
WHERE make = 'Volvo' AND model = 'XC70';

UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['bensin','diesel','laddhybrid','hybrid'], segment = 'premium',
  rating_overall = 9, seats = 7,
  expert_comment = 'Volvo-flaggskeppet och Skandinaviens bästa lyxiga familje-SUV. Säker, elegant och bekväm.'
WHERE make = 'Volvo' AND model = 'XC90';

-- Xpeng
UPDATE car_catalog SET
  body_type = 'suv', fuel_types = ARRAY['el'], segment = 'midsize',
  rating_overall = 8, seats = 5,
  expert_comment = 'Kinesisk elektrisk SUV med avancerad ADAS och imponerande teknik. Bra räckvidd och AI-funktioner.'
WHERE make = 'Xpeng' AND model = 'G6';
