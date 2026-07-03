export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideSection {
  heading: string;
  body: string;
  subsections?: { heading: string; body: string }[];
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  readingTime: string;
  intro: string;
  author: string;
  publishedDate: string;
  sections: GuideSection[];
  faq: GuideFaq[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'kopa-begagnad-bil',
    title: 'Så köper du begagnad bil tryggt – steg för steg',
    metaTitle: 'Köpa begagnad bil – guide 2026 | Bilto',
    metaDescription: 'Lär dig hur du köper begagnad bil tryggt. Komplett guide med checklista, förhandlingstips och vanliga fällor att undvika.',
    category: 'Bilköp',
    readingTime: '6 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-01-15',
    intro: 'Att köpa begagnad bil kan spara dig hundratusentals kronor jämfört med nytt – men det ställer krav på att du vet vad du letar efter. Den här guiden tar dig igenom hela processen, från att bestämma budget till att skriva under kontraktet.',
    sections: [
      {
        heading: 'Sätt en realistisk budget',
        body: 'Börja med att fastställa din totala budget, inklusive försäkring, skatt, drivmedel och eventuell finansiering. En tumregel är att driftkostnaderna (inklusive avbetalning) inte bör överstiga 15–20% av din nettoinkomst. Glöm inte att räkna in en buffert för oförutsedda reparationer.',
      },
      {
        heading: 'Välj rätt biltyp för ditt behov',
        body: 'Definiera hur du ska använda bilen. Pendlar du ensam i stan? En kompakt hybrid eller elbil sänker driftkostnaderna. Har du familj och hund? Kombi eller SUV ger mer plats. Kör du lång sträcka? Diesel kan fortfarande vara motiverat. En enkel behovsanalys sparar dig från att köpa fel bil.',
      },
      {
        heading: 'Kontrollera fordonets historia',
        body: 'Sök alltid på registreringsnumret i Transportstyrelses register och i tjänster som Carfax eller UC Biluppgifter. Kontrollera: antal ägare (färre är bättre), om bilen haft krockar, om servicen är gjord i tid, om det finns utestående skulder och om kilometerräknaren stämmer mot servicehistoriken.',
      },
      {
        heading: 'Provkör och besikta noga',
        body: 'Testa bilen i olika hastigheter och situationer. Lyssna efter oljud från motor, bromsar och växellåda. Kontrollera att alla elektroniska funktioner fungerar. Boka gärna en oberoende besiktning (ca 800–1 500 kr) – det är en liten investering som kan rädda dig från en stor kostnad. Fråga alltid om besiktningsprotokoll.',
      },
      {
        heading: 'Förhandla priset',
        body: 'Utgångspriset är sällan det slutliga priset. Använd historikproblem, slitage och kommande kostnader som argument. Jämför priset mot Bilweb och Blocket för liknande bilar. Biltos experter kan förhandla åt dig om du vill ha professionellt stöd – genomsnittskunden sparar 12 000–35 000 kr på en affär.',
      },
      {
        heading: 'Skriv ett korrekt kontrakt',
        body: 'Kontraktet ska alltid innehålla: bilens reg.nr, chassis-nr, miltal vid överlåtelse, köpeskillingen, datum, och båda parters personnummer/organisationsnummer. Köper du av en handlare har du konsumentköplagen på din sida – det ger ett starkare skydd än privat köp. Spara alltid kopia av köpekontraktet.',
      },
    ],
    faq: [
      {
        question: 'Hur kontrollerar jag en begagnad bils historia?',
        answer: 'Sök på registreringsnumret via Transportstyrelsens e-tjänster och tjänster som UC Biluppgifter. Kontrollera antal ägare, krockar, servicehistorik och utestående skulder.',
      },
      {
        question: 'Är det värt att betala för en oberoende besiktning?',
        answer: 'Ja. En oberoende besiktning kostar 800–1 500 kr men kan avslöja fel som kostar tiotusentals kronor att åtgärda. Det är en av de bästa investeringarna du kan göra.',
      },
      {
        question: 'Vad är rimligt att förhandla ned priset med?',
        answer: 'Det beror på bilens skick och marknadspriset, men 5–15% under begärt pris är vanligt. Verkliga brister och kommande kostnader ger dig starka argument.',
      },
      {
        question: 'Vilken säljkanal ger bäst trygghet som köpare?',
        answer: 'Handlare ger konsumentköplagens skydd, vilket är starkare än skyddet vid privat köp. Med Bilto får du dessutom en expert som granskat bilen och förhandlat priset åt dig.',
      },
    ],
  },
  {
    slug: 'forhandla-bilpris',
    title: 'Förhandla ned bilpriset – 7 beprövade tekniker',
    metaTitle: 'Förhandla bilpris – tekniker som fungerar 2026 | Bilto',
    metaDescription: 'Lär dig förhandla ned bilpriset med 7 konkreta tekniker. Genomsnittskunden sparar 12 000–35 000 kr med rätt strategi.',
    category: 'Förhandling',
    readingTime: '5 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-02-10',
    intro: 'De flesta betalar mer för sin bil än de behöver. Anledningen är enkel: handlare förhandlar dagligen, de flesta köpare gör det sällan. Den här guiden ger dig de tekniker som faktiskt fungerar – och som Biltos egna förhandlare använder varje dag.',
    sections: [
      {
        heading: 'Gör din research innan du sätter foten i butiken',
        body: 'Kolla priset på identiska bilar (årsmodell, miltal, utrustning) på Blocket, Bytbil och Bilweb. Det ger dig ett konkret referenspris att hänvisa till. En handlare som vet att du vet marknadspriset vet att de inte kan ta ut överpris.',
      },
      {
        heading: 'Var aldrig den som nämner en siffra först',
        body: 'Låt handlaren lägga det första budet. Säg: "Vad är ert bästa pris?" – och lyssna sedan. Säger handlaren ett pris du kan acceptera, be ändå om lite mer. Det kostar ingenting att fråga och handlaren förväntar sig det.',
      },
      {
        heading: 'Använd verkliga brister som argument',
        body: 'Hitta faktiska fel och brister under provkörning och besiktning. Slitage på däck (ca 2 000–3 000 kr att byta), kommande service, repor, defekter i elektroniken – varje brist är ett argument för prisavdrag. Var konkret: "Däcken behöver bytas till hösten, det är 2 800 kr. Kan vi ta av det på priset?"',
      },
      {
        heading: 'Kombinera och förhandla hela paketet',
        body: 'Handlare har ofta mer rörelseutrymme på kringtjänster (garanti, service, tillbehör) än på grundpriset. Fråga efter fri vinterdäcksförvaring, förlängd garanti, dubbdäck på köpet eller gratis service. Paketförhandling ger ofta mer totalt värde än enbart prisrabatt.',
      },
      {
        heading: 'Visa att du är redo att gå',
        body: 'Handlare vill inte förlora en kund som är nära att köpa. Säg lugnt: "Det är över min budget. Tack för visningen." och börja röra dig mot utgången. Det är förvånansvärt ofta som handlaren ropar tillbaka med ett bättre pris. Ha på dig och agera genuint – det märks om det är bluff.',
      },
      {
        heading: 'Förhandla finansieringen separat',
        body: 'Blanda inte ihop prisförhandlingen med finansieringen. Förhandla priset klart först. Handlarens finansiering är ofta dyrare än bankens – jämför alltid med din bank eller ett finansieringsbolag innan du skriver under. Ränteskillnaden på ett fyraårigt lån kan vara 20 000–50 000 kr.',
      },
      {
        heading: 'Låt en expert förhandla åt dig',
        body: 'Om du inte är bekväm med att förhandla, eller om det är mycket pengar på spel, kan Biltos rådgivare ta över förhandlingen åt dig. Genomsnittskunden sparar 12 000–35 000 kr per affär – ofta mer än vad man trodde var möjligt.',
      },
    ],
    faq: [
      {
        question: 'Hur mycket kan man förhandla ned priset på en bil?',
        answer: 'Typiskt 5–15% beroende på bilens skick och hur länge den stått till salu. Konkreta brister och ett tydligt marknadspriset som referens är dina starkaste argument.',
      },
      {
        question: 'Ska man förhandla pris och finansiering samtidigt?',
        answer: 'Nej. Förhandla alltid priset separat och klart innan du diskuterar finansiering. Handlare kan annars kompensera ett lägre pris med sämre lånevillkor.',
      },
      {
        question: 'Vad händer om handlaren inte vill röra sig på priset?',
        answer: 'Be om kringtjänster istället – förlängd garanti, extra service eller tillbehör. Visar handlaren noll flexibilitet alls är det ett tecken på att bilen prissatts korrekt, eller att det finns andra intressenter.',
      },
      {
        question: 'Är det möjligt att anlita någon som förhandlar åt en?',
        answer: 'Ja. Bilto erbjuder förhandlingshjälp där en expert tar över kontakten med säljaren. Tjänsten är kostnadsfri och genomsnittskunden sparar 12 000–35 000 kr.',
      },
    ],
  },
  {
    slug: 'salja-bil-basta-pris',
    title: 'Sälja bil till bästa pris – komplett guide',
    metaTitle: 'Sälja bil till bästa pris – guide 2026 | Bilto',
    metaDescription: 'Maximera priset när du säljer din bil. Steg-för-steg guide om förberedelser, värdering, var du säljer och hur du undviker vanliga misstag.',
    category: 'Bilförsäljning',
    readingTime: '7 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-03-05',
    intro: 'De flesta som säljer sin bil privat lämnar pengar på bordet. Inte för att de fuskar, utan för att de inte vet hur de ska presentera bilen rätt, var de ska sälja och hur de ska förhandla. Den här guiden ändrar på det.',
    sections: [
      {
        heading: 'Förbered bilen innan du säljer',
        body: 'En välvårdad bil säljs snabbare och till ett högre pris. Investera i en professionell invändig och utvändig tvätt (ca 500–1 000 kr). Fixa enkla skador som repor och stenkast i lacken – det höjer det visuella intrycket enormt. Samla alla servicekvitton och lägg dem synligt. En bil med komplett servicehistorik motiverar ett märkbart högre pris.',
      },
      {
        heading: 'Sätt rätt pris från start',
        body: 'Undersök priset på 5–10 liknande bilar (årsmodell, miltal, utrustning) på Bilweb, Blocket och Bytbil. Sätt ditt pris 5–10% över vad du faktiskt accepterar – det ger utrymme att förhandla utan att förlora. Prissätter du för högt stannar bilen utan intresse. För lågt och du lämnar pengar på bordet.',
      },
      {
        heading: 'Ta bra foton',
        body: 'Foton är det viktigaste i en annons. Fotografera i dagsljus, på en ren bakgrund, utifrån alla vinklar. Ta bilder på motorrum, instrumentpanel, bagageutrymme och sätena. En bil med 20 tydliga, välbelysta bilder får markant fler intressenter än en med 4 suddiga mobilbilder. Undvik att fotografera inne i garaget.',
      },
      {
        heading: 'Välj rätt säljkanal',
        body: 'Privat via Blocket når många, men det tar tid och du förhandlar på egen hand. Via Bilto når du granskade handlare som lämnar konkurrerande bud – du slipper förhandla och slipper ryckas i av oseriösa privatköpare. Handlare kan ofta betala mer än en privatperson för rätt bil, tack vare att de kan sälja vidare med marginal.',
      },
      {
        heading: 'Hantera visningar och förhandlingar',
        body: 'Möt alltid köparen på dagtid, helst hemma eller på en välbesökt plats. Ha all dokumentation redo. Låt köparen provköra, men följ med. Var beredd på att köparen hittar på fel – det är del av förhandlingstaktiken. Ha ett bottenpris klart i huvudet och håll dig till det.',
      },
      {
        heading: 'Skriv ett korrekt köpekontrakt',
        body: 'Kontraktet skyddar dig juridiskt. Det ska inkludera: bilens registreringsnummer och chassinummer, köpeskillingen, miltal vid överlåtelse, att bilen säljs i befintligt skick (om privat försäljning), datum och underskrifter. Ägarbytet ska anmälas till Transportstyrelsen – det är säljarens ansvar att det görs i tid.',
      },
    ],
    faq: [
      {
        question: 'Vad är mitt bils värde just nu?',
        answer: 'Det beror på årsmodell, miltal, skick och utrustning. Jämför med liknande bilar på Blocket, Bilweb och Bytbil. Bilto erbjuder en kostnadsfri värdering där granskade handlare lämnar konkreta bud.',
      },
      {
        question: 'Är det bättre att sälja till handlare eller privat?',
        answer: 'Det beror på hur du prioriterar. Handlare köper snabbare och utan visningskaos, men kräver ofta ett något lägre pris. Via Bilto tävlar flera handlare mot varandra vilket höjer slutpriset.',
      },
      {
        question: 'Behöver jag besikta bilen innan jag säljer?',
        answer: 'Du måste ha en giltig besiktning men behöver inte göra en ny om den nuvarande gäller. En frivillig extra besiktning kan öka köparens förtroende och motivera ett högre pris.',
      },
      {
        question: 'Hur lång tid tar det att sälja bil via Bilto?',
        answer: 'Vanligtvis 24–72 timmar från att du skickat in dina uppgifter tills du har konkreta bud att välja bland. Hela processen är digital och du behöver inte göra något mer.',
      },
    ],
  },
  {
    slug: 'salja-leasingbil-i-fortid',
    title: 'Sälja leasingbil i förtid – vad gäller?',
    metaTitle: 'Sälja leasingbil i förtid – regler och kostnader 2026 | Bilto',
    metaDescription: 'Vad händer om du vill sälja din leasingbil innan avtalet löper ut? Lär dig om förtidsinlösen, kostnader och dina alternativ.',
    category: 'Bilförsäljning',
    readingTime: '5 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-04-01',
    intro: 'Livet förändras – och ibland passar leasingavtalet inte längre. Kanske har du fått en ny bil via jobbet, eller så har familjen blivit större. Den här guiden förklarar exakt vad som gäller när du vill sälja eller avsluta ett privatleasingavtal i förtid.',
    sections: [
      {
        heading: 'Vad innebär förtida avslut av leasing?',
        body: 'När du tecknar ett privatleasingavtal binder du dig för hela avtalstiden – vanligtvis 24–48 månader. Att avsluta i förtid innebär att du måste lösa in bilen till ett förutbestämt värde, det så kallade återköpspriset. Det skiljer sig från bilens marknadsvärde och kan resultera i en merkostnad.',
      },
      {
        heading: 'Hur räknas förtidsinlösenbeloppet ut?',
        body: 'Leasingbolaget räknar ut vad det kostar att avsluta avtalet i förtid baserat på återstående leasingavgifter, eventuell restvärdeskillnad och administrativa avgifter. Be om en skriftlig kalkyl från ditt leasingbolag – de är skyldiga att ge dig det på begäran.',
      },
      {
        heading: 'Kan du sälja till en privatperson?',
        body: 'Nej, du kan i regel inte sälja en leasad bil direkt till en privatperson eftersom du inte äger bilen – det gör leasingbolaget. Däremot kan du köpa ut bilen (förtidsinlösen) och sedan sälja den. Alternativt kan du i vissa fall överlåta leasingavtalet till en annan person om leasingbolaget godkänner det.',
      },
      {
        heading: 'Kan en handlare hjälpa dig lösa ut bilen?',
        body: 'Ja. Vissa handlare kan lösa in din leasingbil direkt från leasingbolaget och köpa den av dig i samma transaktion. Bilto hjälper dig få konkurrerade bud från handlare som är vana vid inlösen – det kan ge ett bättre nettoresultat än att lösa in på egen hand.',
      },
      {
        heading: 'Vad kostar ett förtida avslut typiskt sett?',
        body: 'Kostnaden varierar kraftigt. Har du 6 månader kvar kan merkostnaden vara minimal. Har du 18 månader kvar kan det handla om 20 000–60 000 kr. Jämför alltid den totala kostnaden för förtidsinlösen mot att fortsätta betala leasingavgiften. Ibland är det billigare att fullfölja avtalet.',
      },
    ],
    faq: [
      {
        question: 'Kan jag sälja en leasingbil direkt?',
        answer: 'Nej. Du äger inte bilen – det gör leasingbolaget. Du måste antingen lösa in bilen först eller överlåta avtalet om leasingbolaget tillåter det.',
      },
      {
        question: 'Vad är förtidsinlösen?',
        answer: 'Förtidsinlösen innebär att du betalar det återstående värdet av leasingavtalet för att bli ägare till bilen. Beloppet inkluderar kvarvarande leasingavgifter och eventuella avgifter.',
      },
      {
        question: 'Kan jag överlåta mitt leasingavtal?',
        answer: 'Ibland, om leasingbolaget godkänner det och den nya personen uppfyller kreditkraven. Kontakta ditt leasingbolag för att höra om det är möjligt.',
      },
      {
        question: 'Hjälper Bilto med leasingbil?',
        answer: 'Ja. Vi kan hjälpa dig få bud från handlare som tar hand om hela inlösenprocessen, ofta till ett bättre pris än om du gör det själv.',
      },
    ],
  },
  {
    slug: 'salja-avstaelld-bil',
    title: 'Sälja avställd bil – komplett guide',
    metaTitle: 'Sälja avställd bil – guide 2026 | Bilto',
    metaDescription: 'Allt om att sälja en avställd bil. Vad du behöver göra, vad det kostar och hur du maximerar priset.',
    category: 'Bilförsäljning',
    readingTime: '4 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-04-08',
    intro: 'En avställd bil är en bil som inte är registrerad för körning på allmän väg. Det kan vara en gammal veteranbil, en projektbil eller helt enkelt en bil du ställde av för att spara på försäkringen. Att sälja den kräver lite extra steg – men det är enklare än du tror.',
    sections: [
      {
        heading: 'Vad innebär det att bilen är avställd?',
        body: 'En avställd bil får inte köras på allmän väg. Den är inte försäkrad och registreras som avställd i Transportstyrelsens register. Skatten är reducerad och försäkringspremien låg eller noll. Ägarbyte kan ske precis som för en påställd bil.',
      },
      {
        heading: 'Behöver du ställa på bilen innan du säljer?',
        body: 'Nej, du behöver inte ställa på bilen före försäljning. Köparen kan överta bilen avställd och välja att ställa på den senare. Tydliggör i annonsen att bilen är avställd och vad det innebär. Ange om bilen har giltig besiktning eller inte.',
      },
      {
        heading: 'Hur anmäler du ägarbytet?',
        body: 'Ägarbytet anmäls digitalt via Transportstyrelsens e-tjänster. Både säljare och köpare behöver BankID. Säljaren är ansvarig för att ägarbytet registreras – annars kan du hållas ansvarig för framtida fordonsskatt och böter.',
      },
      {
        heading: 'Hur påverkar avställningen priset?',
        body: 'En avställd bil värderas ofta lägre om besiktningen gått ut och bilen inte körts på länge. Köparen vet att det kan tillkomma kostnader för besiktning, eventuella reparationer och påställning. Var ärlig om bilens skick och prissätt realistiskt. En genomgång av en verkstad kan öka köparens förtroende.',
      },
      {
        heading: 'Kan Bilto hjälpa dig sälja en avställd bil?',
        body: 'Ja. Bilto hämtar bud från handlare som är vana vid avställda bilar och projektbilar. De gör en bedömning baserad på bilens skick och potentiella värde. Du slipper leta köpare på egen hand och slipper diskussionerna om bilens skick.',
      },
    ],
    faq: [
      {
        question: 'Kan man sälja en avställd bil?',
        answer: 'Ja. En avställd bil kan säljas precis som en påställd. Köparen tar över den avställd och ställer på den när de vill.',
      },
      {
        question: 'Måste besiktningen vara giltig för att sälja?',
        answer: 'Nej, men en utgången besiktning påverkar priset negativt. Du bör informera köparen tydligt om besiktningsstatusen.',
      },
      {
        question: 'Vem anmäler ägarbytet?',
        answer: 'Säljaren är ansvarig för att ägarbytet anmäls till Transportstyrelsen. Görs det inte kan säljaren hållas ansvarig för framtida avgifter.',
      },
      {
        question: 'Hur länge tar ett ägarbyte?',
        answer: 'Digitalt via Transportstyrelsens e-tjänster tar det vanligtvis bara några minuter med BankID.',
      },
    ],
  },
  {
    slug: 'salja-bil-dodsbo',
    title: 'Sälja bil vid dödsbo – fullmakt och regler',
    metaTitle: 'Sälja bil vid dödsbo – guide 2026 | Bilto',
    metaDescription: 'Steg-för-steg guide om hur du säljer en bil som ingår i ett dödsbo. Fullmakt, bouppteckning och praktiska råd.',
    category: 'Bilförsäljning',
    readingTime: '5 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-04-15',
    intro: 'Att hantera ett dödsbo är ofta både känslomässigt och praktiskt krävande. En bil som ingår i boet behöver säljas eller övertas – och det finns tydliga regler för hur det ska gå till. Den här guiden tar dig igenom processen steg för steg.',
    sections: [
      {
        heading: 'Vad gäller för ett fordon i dödsbo?',
        body: 'Bilen tillhör dödsboet tills bouppteckningen är registrerad och boet är skiftat. Innan dess måste alla dödsbodelägare (arvingar) vara överens om vad som ska göras med bilen. Ingen enskild arvinge kan sälja bilen utan de andras samtycke.',
      },
      {
        heading: 'Vilka dokument behövs för att sälja?',
        body: 'Du behöver: registrerat bouppteckningsintyg från Skatteverket, samtycke från samtliga dödsbodelägare (skriftligt), fullmakt om en person sköter försäljningen på allas vägnar, och legitimation. Fordonets registreringsbevis ska finnas tillgängligt.',
      },
      {
        heading: 'Hur fungerar fullmakten?',
        body: 'Om en av delägarna sköter försäljningen behöver de en fullmakt undertecknad av samtliga övriga dödsbodelägare. Fullmakten ska specificera att den avser försäljning av det specifika fordonet (reg.nr, chassinummer) och vem som ges rätt att genomföra affären.',
      },
      {
        heading: 'Hur anmäls ägarbytet?',
        body: 'Ägarbytet anmäls till Transportstyrelsen av den som säljer, med stöd av bouppteckningsintyget och eventuell fullmakt. Vid digitalt ägarbyte behöver den siste registrerade ägaren ersättas av dödsboet som ny ägare, och sedan köparen. Transportstyrelsen har en särskild tjänst för dödsbon.',
      },
      {
        heading: 'Tips för att sälja snabbt och tryggt',
        body: 'Ha all dokumentation klar innan du annonserar – det skapar förtroende hos köparen. Bilto kan hjälpa dig få bud från handlare som är vana vid köp från dödsbon och som förstår den administrativa processen. Det minskar friktionen och ger ett snabbare avslut.',
      },
    ],
    faq: [
      {
        question: 'Kan en arvinge sälja dödsboets bil ensam?',
        answer: 'Nej. Alla dödsbodelägare måste samtycka. En person kan sköta praktiken men behöver fullmakt från alla övriga.',
      },
      {
        question: 'Vad är ett bouppteckningsintyg?',
        answer: 'Det är ett dokument från Skatteverket som styrker att bouppteckningen är registrerad och vem som är dödsbodelägare. Det krävs för att sälja boets tillgångar.',
      },
      {
        question: 'Kan man köra dödsboets bil?',
        answer: 'Ja, om den är påställd och försäkrad – men det bör göras med försiktighet och med samtliga delägares kännedom.',
      },
      {
        question: 'Hur lång tid tar det att sälja bilen?',
        answer: 'Det beror på hur snabbt ni har dokumentationen klar och på bilen. Med Bilto kan du ha bud inom 24–48 timmar när papperen är på plats.',
      },
    ],
  },
  {
    slug: 'salja-bil-som-inte-startar',
    title: 'Sälja bil som inte startar – dina alternativ',
    metaTitle: 'Sälja bil som inte startar – guide 2026 | Bilto',
    metaDescription: 'Vad gör du med en bil som inte går att köra? Lär dig om skrotningspremie, reservdelshandlare och hur du ändå kan få betalt.',
    category: 'Bilförsäljning',
    readingTime: '4 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-04-22',
    intro: 'En bil som inte startar känns som ett problem – men det finns köpare för nästan alla bilar, oavsett skick. Det handlar om att hitta rätt kanal och sätta rätt pris. Den här guiden ger dig en tydlig bild av alternativen.',
    sections: [
      {
        heading: 'Vad är bilen värd när den inte startar?',
        body: 'Värdet beror på orsaken till att den inte startar. En bil med ett enkelt startmotorproblem kan ha nästintill fullt marknadsvärde. En bil med ett totalt motorhaveri eller rostskada kan vara värd nästan ingenting – förutom som reservdelskälla eller skrot. Få en diagnos om möjligt, det stärker förhandlingspositionen.',
      },
      {
        heading: 'Alternativ 1: Reparera och sälj',
        body: 'Om reparationskostnaden är lägre än värdeökningen är det lönsamt att reparera. En bil som rullar säljs snabbare och till ett markant högre pris. Få en kalkyl från en verkstad innan du bestämmer dig – det tar bara någon timme och kostar vanligtvis 300–600 kr.',
      },
      {
        heading: 'Alternativ 2: Sälj som den är',
        body: 'Var ärlig i annonsen: ange felet tydligt, inkludera bilder och prissätt realistiskt. Det finns mekaniker, hantverkare och entusiaster som gärna köper ett projekt till rätt pris. Bilto kan hjälpa dig nå handlare som specialiserar sig på bilar i dåligt skick.',
      },
      {
        heading: 'Alternativ 3: Sälj för reservdelar',
        body: 'Populära bilmärken och modeller har ofta ett aktivt andrahandsmarknad för reservdelar. Du kan sälja bilen som reservdelskälla till en återförsäljare av begagnade reservdelar. Priset är lågt men du slipper annonsering och förhandling.',
      },
      {
        heading: 'Alternativ 4: Skrotningspremie',
        body: 'Bilar som är mer än 15 år gamla och skrotas ger en skrotningspremie om ca 3 000–4 000 kr. Kontakta ett godkänt skrotningsföretag. Tänk på att avregistrera fordonet hos Transportstyrelsen och avsluta försäkringen.',
      },
    ],
    faq: [
      {
        question: 'Kan man sälja en bil som inte startar?',
        answer: 'Ja. Det finns alltid köpare beroende på bilens skick – mekaniker, entusiaster eller reservdelshandlare.',
      },
      {
        question: 'Hur prissätter man en trasig bil?',
        answer: 'Utgå från bilens marknadsvärde i gott skick och dra av uppskattade reparationskostnader. Lägg till en marginal för att köparen tar en risk.',
      },
      {
        question: 'Vad är skrotningspremie?',
        answer: 'En ersättning på ca 3 000–4 000 kr du får när du lämnar in ett fordon för skrotning. Bilen måste vara minst 15 år gammal och inte ha gått mer än 10 000 mil det senaste året.',
      },
      {
        question: 'Kan Bilto hjälpa med trasiga bilar?',
        answer: 'Ja. Vi har handlare som hanterar bilar i alla skick och kan ge dig ett konkret bud utan att du behöver köra bilen.',
      },
    ],
  },
  {
    slug: 'vad-ar-min-elbil-vard',
    title: 'Vad är min elbil värd? Så påverkar batteriet priset',
    metaTitle: 'Vad är min elbil värd? Batterihälsa och andrahandsvärde 2026 | Bilto',
    metaDescription: 'Förstå vad som styr din elbils andrahandsvärde. Batterihälsa, räckvidd, miltal och märke – allt förklarat.',
    category: 'Bilförsäljning',
    readingTime: '6 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-05-06',
    intro: 'Elbilens andrahandsvärde påverkas av faktorer som inte finns hos bensin- eller dieselbilar. Batterihälsan är den viktigaste – men det finns fler. Den här guiden förklarar vad som styr priset och hur du maximerar vad du får när du säljer.',
    sections: [
      {
        heading: 'Varför tappar elbilar i värde snabbare?',
        body: 'Elbilar har historiskt tappat i värde snabbare än konventionella bilar, delvis på grund av teknisk utveckling – nya modeller med längre räckvidd lanseras kontinuerligt. Köpare vet att batteriet försämras med åren och priset reflekterar den osäkerheten. Räckvidden upplevs som bilens mest kritiska egenskap.',
      },
      {
        heading: 'Vad är State of Health (SoH)?',
        body: 'State of Health (SoH) är ett mått på hur mycket av batteriets ursprungliga kapacitet som finns kvar. 100% SoH är nytt batteri. 80% SoH innebär att bilen klarar 80% av ursprunglig räckvidd. De flesta elbilstillverkare garanterar minst 70% SoH under garantitiden (vanligtvis 8 år / 160 000 km). Hög SoH ger ett tydligt prisargument.',
      },
      {
        heading: 'Hur kontrollerar du och visar upp SoH?',
        body: 'För Tesla kan du se SoH-data direkt i appen eller via tredjepartsappar. För Kia, Hyundai och många andra märken krävs en OBD-diagnos med rätt programvara. Bilto kan hjälpa dig ta fram ett SoH-intyg som du kan visa köparen – det ökar förtroendet och motiverar ett högre pris.',
      },
      {
        heading: 'Vilka faktorer påverkar elbilens andrahandsvärde mest?',
        body: 'I rangordning: (1) Batterihälsa och garantistatus. (2) Märke och modell – premiumbilar håller värdet bättre. (3) Räckvidd på nytt laddat batteri. (4) Miltal – viktigt men sekundärt till batterihälsa. (5) Laddinfrastruktur – snabbladdningskapacitet (CCS, CHAdeMO, Supercharger) är viktigt. (6) Utrustning – värmepump, tillgång till gratis laddning.',
      },
      {
        heading: 'Hur maximerar du priset när du säljer?',
        body: 'Ladda batteriet till 100% inför visning. Ha ett SoH-dokument klart. Lista kvarstående garantitid tydligt i annonsen. Inkludera laddkablar och eventuell hemmaladdare i affären. Jämför med liknande bilar på marknaden – ett par tusen extra är ofta möjligt med rätt presentation.',
      },
    ],
    faq: [
      {
        question: 'Spelar miltal lika stor roll för elbil som för bensinbil?',
        answer: 'Miltal är viktigt, men batterihälsan väger tyngre. En elbil med 8 000 mil och 95% SoH kan vara mer värd än en med 4 000 mil och 82% SoH.',
      },
      {
        question: 'Hur kollar köparen batterihälsan?',
        answer: 'Via diagnostikverktyg och OBD-adaptern. Köpare av elbilar är ofta kunniga och vet vad de letar efter. Ha dokumentation klar.',
      },
      {
        question: 'Täcker garantin batteriet vid köp av begagnad elbil?',
        answer: 'Ja, om originalgarantin fortfarande gäller (vanligtvis 8 år / 160 000 km). Kontrollera exakt garantistatus hos tillverkaren.',
      },
      {
        question: 'Kan Bilto hjälpa mig sälja min elbil?',
        answer: 'Ja. Vi har handlare med specifik kunskap om elbilar och kan hjälpa dig dokumentera batterihälsan och nå köpare som vet värdet av det.',
      },
    ],
  },
  {
    slug: 'byta-in-bilen-eller-salja-forst',
    title: 'Byta in bilen eller sälja först? Så räknar du',
    metaTitle: 'Inbyte eller sälja privat – vad ger mest? Guide 2026 | Bilto',
    metaDescription: 'Inbyte hos handlare eller privat försäljning? Lär dig hur du räknar ut vilket alternativ som ger dig mest pengar.',
    category: 'Bilförsäljning',
    readingTime: '5 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-05-13',
    intro: 'Att sälja privat ger ofta ett högre pris – men det tar tid, kräver förhandling och kan vara stressigt. Inbyte hos handlare är smidigt men ger vanligtvis ett lägre pris. Vilket alternativ passar dig? Det beror mer på din situation än du kanske tror.',
    sections: [
      {
        heading: 'Hur fungerar inbyte hos handlare?',
        body: 'Du tar din gamla bil till handlaren i samband med att du köper en ny. Handlaren gör en värdering och erbjuder ett inbytespris som dras av från priset på den nya bilen. Det är smidigt och du undviker att ha två affärer igång parallellt – men handlaren behöver ta en marginal för att kunna sälja vidare.',
      },
      {
        heading: 'Hur mycket lägre är inbytespriset?',
        body: 'Typiskt sett 5–20% lägre än marknadsvärdet. Skillnaden är störst för bilar i hög efterfrågan och populära modeller. Handlaren tar in bilen till ett pris där de kan sälja vidare med marginal efter eventuell besiktning, klargörning och garantikostnader.',
      },
      {
        heading: 'Fördelarna med att sälja privat',
        body: 'Du kan normalt få 10–20% mer för din bil privat. Du är inte bunden till att köpa nästa bil från samma ställe. Du kan shoppa nytt mer fritt. Nackdelarna: det tar mer tid, du hanterar visningar och förhandling själv, och du riskerar bluffköpare.',
      },
      {
        heading: 'Räkneexempel',
        body: 'Din bil är värd 150 000 kr på den öppna marknaden. Inbyte ger 130 000 kr. Du sparar tid och krångel, men lämnar 20 000 kr på bordet. Fråga dig: är 20 000 kr värt ett par veckors arbete med annonsering, visningar och förhandling? Det är ett legitimt val åt endera hållet.',
      },
      {
        heading: 'Det bästa av två världar – sälj via Bilto',
        body: 'Via Bilto når du granskade handlare som lägger konkurrerande bud på din bil – utan att du behöver sälja privat. Du slipper visningar och förhandling men får ett bättre pris än ett traditionellt inbyte. Genomsnittskunden får 15–25% mer än ett direkt inbytesbud.',
      },
    ],
    faq: [
      {
        question: 'Är inbyte alltid sämre ekonomiskt?',
        answer: 'Inte alltid. Momsavdrag vid inbyte kan i vissa fall göra det fördelaktigt, och bekvämlighetsvärdet är reellt. Men rent monetärt är privat försäljning i regel mer lönsamt.',
      },
      {
        question: 'Kan jag förhandla inbytespriset?',
        answer: 'Ja, alltid. Ha ett kontrollerat marknadsvärde som referens. Visar du att du vet vad bilen är värd är det svårare för handlaren att erbjuda ett lågt pris.',
      },
      {
        question: 'Vad händer om min gamla bil inte är betald?',
        answer: 'Handlaren kan lösa kvarvarande skuld i samband med inbytet. Nettot (inbytespris minus skuld) dras av på den nya bilens pris.',
      },
      {
        question: 'Hur snabbt kan Bilto ge mig bud på min bil?',
        answer: 'Vanligtvis inom 24–48 timmar. Du slipper annonsera, möta privatpersoner och förhandla – handlarna konkurrerar om din bil.',
      },
    ],
  },
  {
    slug: 'hur-raiknar-handlaren-pa-inbyte',
    title: 'Så räknar handlaren på ditt inbyte (och hur du får mer)',
    metaTitle: 'Hur räknar handlaren på inbyte? Guide 2026 | Bilto',
    metaDescription: 'Förstå hur handlare värderar ditt inbyte och vilka kostnader de räknar in. Lär dig förhandla upp inbytespriset.',
    category: 'Förhandling',
    readingTime: '5 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-05-20',
    intro: 'Handlare gör inte inbytesvärderingar slumpmässigt. Det finns en tydlig kalkyl bakom – och om du förstår den kan du använda den till din fördel. Den här guiden avslöjar hur kalkylen ser ut och vad du kan göra för att förbättra ditt bud.',
    sections: [
      {
        heading: 'Kalkylen handlaren gör',
        body: 'Handlaren utgår från bilens förväntade försäljningspris på sin anläggning. Därifrån dras: klargöringskostnader (tvätt, polish: 1 000–3 000 kr), eventuell besiktning (800–1 200 kr), reparationer och däckbyte (varierar), garantikostnad (1 000–5 000 kr), och handelsmarginal (10–20%). Det som är kvar är ditt inbytespris.',
      },
      {
        heading: 'Var har handlaren mest marginal?',
        body: 'Handelsmarginal och garantikostnad är de två posterna med störst variationsbredd. En handlare som är angelägen att sälja kan trycka ned marginalen. Bilar i gott skick med service och lågt miltal ger lägre avdrag för reparationer.',
      },
      {
        heading: 'Hur du förbättrar ditt inbytespris',
        body: 'Boka en professionell tvätt och klargöring (500–1 000 kr) – det kan ge 2 000–5 000 kr mer i inbytespris. Se till att servicen är gjord och kvittona synliga. Fixa enkla skador. Visa upp komplett dokumentation. En välpresenterad bil sänker handlarens estimerade klargöringskostnad.',
      },
      {
        heading: 'Spela ut handlare mot varandra',
        body: 'Hämta inbytesoffert från minst 3 handlare. Berätta för handlaren att du har andra offerter. Det är ett av de effektivaste sätten att pressa upp priset. Via Bilto kan du automatisera det – vi hämtar konkurrerande bud och låter handlarna tävla.',
      },
      {
        heading: 'Vad händer om handlaren inte vill röra sig?',
        body: 'Fråga handlaren vad som krävs för att höja inbytespriset. Konkreta svar ("om du fixar däcken ger vi 3 000 mer") är ett gott tecken på en seriös förhandling. Svarar de bara nej är det troligen bättre att sälja bilen separat och köpa utan inbyte.',
      },
    ],
    faq: [
      {
        question: 'Hur vet jag om inbytespriset är rimligt?',
        answer: 'Jämför med liknande bilar på Blocket och Bilweb. Om handlarens offert är mer än 15% under marknadsvärdet finns utrymme att förhandla.',
      },
      {
        question: 'Ska man säga vilket inbytespris man vill ha?',
        answer: 'Nej. Låt handlaren lägga budet först. Vet du marknadsvärdet kan du sedan argumentera för ett högre pris med konkreta siffror.',
      },
      {
        question: 'Kan man förhandla inbyte och nybilspris separat?',
        answer: 'Ja, och det rekommenderas. Förhandla priset på den nya bilen klart, sedan separat inbytespriset. Det är svårare för handlaren att kompensera ett prisavdrag på ena sidan med det andra om du håller dem isär.',
      },
      {
        question: 'Hjälper Bilto med inbytet?',
        answer: 'Ja. Vi inhämtar konkurrerande bud på din bil från granskade handlare – det är det snabbaste sättet att ta reda på marknadsvärdet och pressa upp inbytespriset.',
      },
    ],
  },
  {
    slug: 'privatleasing-vs-kop',
    title: 'Privatleasing vs köp – vad kostar det egentligen?',
    metaTitle: 'Privatleasing vs köp – total kostnad 2026 | Bilto',
    metaDescription: 'Jämförelse av privatleasing och bilköp i total kostnad. Lär dig vilka faktorer som avgör vilket alternativ som passar dig.',
    category: 'Bilköp',
    readingTime: '6 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-05-27',
    intro: 'Privatleasing marknadsförs som ett enkelt och billigt alternativ – men den totala kostnaden är inte alltid lägre. Det beror på hur mycket du kör, vad bilen är värd om tre år, och hur du värderar flexibilitet. Den här guiden ger dig ett ärligt räkneexempel.',
    sections: [
      {
        heading: 'Hur fungerar privatleasing?',
        body: 'Du betalar en månatlig hyra för bilen under ett avtal på 24–48 månader. Leasingbolaget äger bilen. Du betalar för hur mycket du kör (milbegränsning), slitage och en eventuell fast månadsavgift. Vid avtalets slut lämnar du tillbaka bilen – du äger inget och har inget restvärde.',
      },
      {
        heading: 'Hur fungerar bilköp med lån?',
        body: 'Du köper bilen med ett lån och äger bilen. Du betalar månadsvis amortering och ränta. Bilen minskar i värde men du äger ett tillgång. Vid slutbetalning är bilen din och du kan sälja den eller behålla den. Du tar risken för prisutvecklingen.',
      },
      {
        heading: 'Räkneexempel: ny bil till 350 000 kr, 3 år',
        body: 'Leasing: 4 500 kr/mån × 36 mån = 162 000 kr. Du lämnar tillbaka bilen och har ingenting. Köp med lån (10% kontant, 4% ränta): 3 200 kr/mån × 36 mån = 115 200 kr + 35 000 kr kontant = 150 200 kr. Bilens restvärde efter 3 år är ca 200 000 kr. Nettoeffekt: du äger ett tillgång på 200 000 kr. Köp är vanligtvis billigare totalt sett.',
      },
      {
        heading: 'När är leasing fördelaktigt?',
        body: 'Leasing passar bäst om du: kör förutsägbart och inom milbegränsningen, vill ha alltid ny bil med full garanti, inte vill ta risk på restvärdet, eller om du är egenföretagare och kan göra momsavdrag. Det är ett val av bekvämlighet och förutsägbarhet snarare än ekonomisk optimering.',
      },
      {
        heading: 'Dolda kostnader du måste känna till',
        body: 'Milöverkörning: 1–3 kr/km extra. Skadebesiktning vid återlämning: tusentals kronor om bilen har skador. Förtida avslut: mycket dyrt. Ingen förmögenhetstillväxt. Läs alltid det finstilta i leasingavtalet noggrant – extra kilometer, däckbyte och försäkring är vanliga tillläggskostnader.',
      },
    ],
    faq: [
      {
        question: 'Är privatleasing alltid dyrare än att köpa?',
        answer: 'I de flesta fall ja, räknat på total kostnad. Men leasing ger förutsägbarhet och ingår ofta underhåll.',
      },
      {
        question: 'Kan man avsluta privatleasing i förtid?',
        answer: 'Ja, men det är dyrt. Du måste betala ut resterande leasingavgifter och eventuell restvärdesskillnad. Läs avtalet noga.',
      },
      {
        question: 'Vad händer om jag kör fler mil än avtalet tillåter?',
        answer: 'Du debiteras för varje extra kilometer, vanligtvis 1–3 kr/km. Det kan bli en stor kostnad om du kör mycket.',
      },
      {
        question: 'Kan Bilto hjälpa mig hitta bra leasingalternativ?',
        answer: 'Vi hjälper primärt med bilköp och försäljning, men våra rådgivare kan ge dig en opartisk bild av vad som passar dig ekonomiskt.',
      },
    ],
  },
  {
    slug: 'vanligaste-misstagen-bilkop-hos-handlare',
    title: 'Undvik de 7 vanligaste misstagen vid bilköp hos handlare',
    metaTitle: '7 misstag att undvika vid bilköp hos handlare 2026 | Bilto',
    metaDescription: 'Lär dig de 7 vanligaste och dyraste misstagen som konsumenter gör vid bilköp hos bilhandlare – och hur du undviker dem.',
    category: 'Bilköp',
    readingTime: '5 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-06-03',
    intro: 'Bilhandlare är proffs på att sälja bilar. De flesta konsumenter köper bil sällan och saknar erfarenhet av förhandling. Det ger upphov till sju återkommande misstag – samtliga undvikbara om du vet om dem i förväg.',
    sections: [
      {
        heading: 'Misstag 1: Gå till handlaren utan research',
        body: 'Vet du inte vad bilen är värd har du ingen förhandlingsposition. Kolla alltid marknadspriset på Bilweb, Blocket och Bytbil innan du bokar en visning. Ta med dig en utskrift av liknande annonser.',
      },
      {
        heading: 'Misstag 2: Förhandla pris och finansiering samtidigt',
        body: 'Handlaren tjänar pengar på finansieringen. Om du pratar pris och lån i samma andedrag är det lätt att tappa kontrollen. Förhandla priset klart. Säg sedan att du ska kolla finansieringen separat med din bank.',
      },
      {
        heading: 'Misstag 3: Låta dig stressas till ett beslut',
        body: '"Den här bilen är det enda exemplaret i Sverige" eller "vi har en annan intressent" – klassiska taktiker. Ta alltid minst 24 timmar på dig. En seriös handlare pressar inte dig till ett omedelbart beslut.',
      },
      {
        heading: 'Misstag 4: Inte provköra tillräckligt länge',
        body: 'En 10-minuters provkörning på en bekant väg räcker inte. Kör i 30–45 minuter på motorväg, i stad och på landsbygd. Testa start och stopp, klimatanläggning, ljud vid hög hastighet och hur bilen beter sig i kurvor.',
      },
      {
        heading: 'Misstag 5: Hoppa över oberoende besiktning',
        body: 'Handlarens egna besiktning är inte samma sak som en oberoende besiktning. Boka en extern besiktning (800–1 500 kr) innan köpet. Det är din bästa försäkring mot dolda fel.',
      },
      {
        heading: 'Misstag 6: Inte läsa kontraktet noga',
        body: 'Ta hem kontraktet och läs det utan tidspress. Kontrollera: miltal, registreringsnummer, chassinummer, garantivillkor, vad som ingår och vad som inte ingår. Saknar något – begär att det skrivs in.',
      },
      {
        heading: 'Misstag 7: Betala utan att ha fått bilen',
        body: 'Betala aldrig fullt pris i förskott om bilen levereras vid ett senare tillfälle. Betala en hanterbar handpenning och resterande vid leverans – det skyddar dig om handlaren inte håller vad de lovar.',
      },
    ],
    faq: [
      {
        question: 'Har man konsumentskydd vid bilköp hos handlare?',
        answer: 'Ja. Konsumentköplagen ger dig ett starkare skydd än vid privat köp – bl.a. reklamationsrätt i 3 år och omvänd bevisbörda det första året.',
      },
      {
        question: 'Vad är omvänd bevisbörda?',
        answer: 'Under det första året efter köpet antas fel som upptäcks ha funnits vid köptillfället om inte handlaren kan bevisa motsatsen.',
      },
      {
        question: 'Kan man häva ett bilköp hos handlare?',
        answer: 'Ja, om bilen har ett väsentligt fel och handlaren inte kan reparera det inom skälig tid kan du ha rätt till hävning eller prisavdrag.',
      },
      {
        question: 'Kan Bilto hjälpa mig navigera ett bilköp hos handlare?',
        answer: 'Ja. Vår tjänst inkluderar granskning av annons, kontroll av historik och prisförhandling med handlaren – precis för att undvika dessa misstag.',
      },
    ],
  },
  {
    slug: 'checklista-begagnad-elbil',
    title: 'Checklista: köpa begagnad elbil (batterihälsa, SoH, garanti)',
    metaTitle: 'Köpa begagnad elbil – checklista 2026 | Bilto',
    metaDescription: 'Komplett checklista för att köpa begagnad elbil tryggt. Kontrollera batterihälsa, SoH, laddinfrastruktur och garanti.',
    category: 'Bilköp',
    readingTime: '6 min',
    author: 'Biltos redaktion',
    publishedDate: '2026-06-10',
    intro: 'En begagnad elbil kan vara ett fantastiskt köp – eller en dyr besvikelse. Skillnaden avgörs av ett par kritiska kontroller som de flesta köpare missar. Den här checklistan tar dig igenom allt du behöver kolla innan du skriver på.',
    sections: [
      {
        heading: '1. Kontrollera State of Health (SoH)',
        body: 'SoH visar hur mycket av batteriets ursprungliga kapacitet som finns kvar. Under 80% SoH är ett varningstecken. Kontrollera via tillverkarens app, OBD-adapter eller begär ett diagnostikprotokoll. Har säljaren ingenting att visa upp – be om det eller gå vidare.',
      },
      {
        heading: '2. Verifiera garantistatus',
        body: 'De flesta tillverkare erbjuder 8 år / 160 000 km batterigaranti. Kontrollera exakt status hos tillverkaren med chassinumret. En elbil med kvarvarande batterigaranti är väsentligt tryggare att köpa.',
      },
      {
        heading: '3. Testa räckvidden',
        body: 'Ladda bilen till 100% och notera angiven räckvidd i displayen. Jämför med tillverkarens officiella räckvidd för den årsmodellen. En skillnad på mer än 20% signalerar ett batteri i dåligt skick.',
      },
      {
        heading: '4. Kontrollera laddinfrastrukturen',
        body: 'Kontrollera vilka laddstandards bilen stöder (CCS, CHAdeMO, Type 2). Stöder den snabbladdning? Med vilken effekt? En äldre elbil med begränsad snabbladdningskapacitet passar sämre om du kör långa sträckor.',
      },
      {
        heading: '5. Kolla laddhistorik och laddvanor',
        body: 'Frekventa snabbladdningar till 100% och urladdningar till 0% försämrar batteriet fortare. Be säljaren berätta om laddvanor. En elbil som laddats med hemmaladdare och hållits på 20–80% har troligen ett friskare batteri.',
      },
      {
        heading: '6. Övriga kontroller',
        body: 'Kontrollera: om bilen haft krockar (via Carfax eller Transportstyrelsen), servicehistorik, bromsskivor och däck (elbilar är tunga och sliter mer), och att alla programuppdateringar är installerade. Testa kyl- och värmesystemet för batteriet – det är kritiskt för batterilivslängden.',
      },
    ],
    faq: [
      {
        question: 'Hur kontrollerar jag SoH på en begagnad elbil?',
        answer: 'Via tillverkarens app (t.ex. Tesla), OBD-diagnostik med rätt programvara, eller via en verkstad som specialiserar sig på elbilar.',
      },
      {
        question: 'Vad innebär 80% SoH i praktiken?',
        answer: 'Det innebär att bilen klarar 80% av sin ursprungliga räckvidd. En bil som ny klarade 40 mil klarar nu 32 mil. Under 80% är en varningssignal.',
      },
      {
        question: 'Kan man byta batteri om det är dåligt?',
        answer: 'Ja, men det kostar 50 000–120 000 kr beroende på modell. Räkna alltid in den kostnaden i prisförhandlingen om SoH är låg.',
      },
      {
        question: 'Hjälper Bilto med kontroll av begagnad elbil?',
        answer: 'Ja. Vi kan hjälpa dig verifiera SoH, garantistatus och historik och säkerställa att du inte betalar för mycket för en elbil med dåligt batteri.',
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
