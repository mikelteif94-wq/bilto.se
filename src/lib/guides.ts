export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  readingTime: string;
  intro: string;
  sections: GuideSection[];
}

export interface GuideSection {
  heading: string;
  body: string;
}

export const GUIDES: Guide[] = [
  {
    slug: 'kopa-begagnad-bil',
    title: 'Så köper du begagnad bil tryggt – steg för steg',
    metaTitle: 'Köpa begagnad bil – guide 2024 | Bilto',
    metaDescription: 'Lär dig hur du köper begagnad bil tryggt. Komplett guide med checklista, förhandlingstips och vanliga fällor att undvika.',
    category: 'Bilköp',
    readingTime: '6 min',
    intro: 'Att köpa begagnad bil kan spara dig hundratusentals kronor jämfört med nytt – men det ställer krav på att du vet vad du letar efter. Den här guiden tar dig igenom hela processen, från att bestämma budget till att skriva under kontraktet.',
    sections: [
      {
        heading: '1. Sätt en realistisk budget',
        body: 'Börja med att fastställa din totala budget, inklusive försäkring, skatt, drivmedel och eventuell finansiering. En tumregel är att driftkostnaderna (inklusive avbetalning) inte bör överstiga 15–20% av din nettoinkomst. Glöm inte att räkna in en buffert för oförutsedda reparationer.',
      },
      {
        heading: '2. Välj rätt biltyp för ditt behov',
        body: 'Definiera hur du ska använda bilen. Pendlar du ensam i stan? En kompakt hybrid eller elbil sänker driftkostnaderna. Har du familj och hund? Kombi eller SUV ger mer plats. Kör du lång sträcka? Diesel kan fortfarande vara motiverat. En enkel behovsanalys sparar dig från att köpa fel bil.',
      },
      {
        heading: '3. Kontrollera fordonets historia',
        body: 'Sök alltid på registreringsnumret i Transportstyrelses register och i tjänster som Carfax eller UC Biluppgifter. Kontrollera: antal ägare (färre är bättre), om bilen haft krockar, om servicen är gjord i tid, om det finns utestående skulder och om kilometerräknaren stämmer mot servicehistoriken.',
      },
      {
        heading: '4. Provkör och besikta noga',
        body: 'Testa bilen i olika hastigheter och situationer. Lyssna efter oljud från motor, bromsar och växellåda. Kontrollera att alla elektroniska funktioner fungerar. Boka gärna en oberoende besiktning (ca 800–1 500 kr) – det är en liten investering som kan rädda dig från en stor kostnad. Fråga alltid om besiktningsprotokoll.',
      },
      {
        heading: '5. Förhandla priset',
        body: 'Utgångspriset är sällan det slutliga priset. Använd historikproblem, slitage och kommande kostnader som argument. Jämför priset mot Bilweb och Blocket för liknande bilar. Biltos experter kan förhandla åt dig om du vill ha professionellt stöd – genomsnittskunden sparar 12 000–35 000 kr på en affär.',
      },
      {
        heading: '6. Skriv ett korrekt kontrakt',
        body: 'Kontraktet ska alltid innehålla: bilens reg.nr, chassis-nr, miltal vid överlåtelse, köpeskillingen, datum, och båda parters personnummer/organisationsnummer. Köper du av en handlare har du konsumentköplagen på din sida – det ger ett starkare skydd än privat köp. Spara alltid kopia av köpekontraktet.',
      },
    ],
  },
  {
    slug: 'forhandla-bilpris',
    title: 'Förhandla ned bilpriset – 7 beprövade tekniker',
    metaTitle: 'Förhandla bilpris – tekniker som fungerar | Bilto',
    metaDescription: 'Lär dig förhandla ned bilpriset med 7 konkreta tekniker. Genomsnittskunden sparar 12 000–35 000 kr med rätt strategi.',
    category: 'Förhandling',
    readingTime: '5 min',
    intro: 'De flesta betalar mer för sin bil än de behöver. Anledningen är enkel: handlare förhandlar dagligen, de flesta köpare gör det sällan. Den här guiden ger dig de tekniker som faktiskt fungerar – och som Biltos egna förhandlare använder varje dag.',
    sections: [
      {
        heading: '1. Gör din research innan du sätter foten i butiken',
        body: 'Kolla priset på identiska bilar (årsmodell, miltal, utrustning) på Blocket, Bytbil och Bilweb. Det ger dig ett konkret referenspris att hänvisa till. En handlare som vet att du vet marknadspriset vet att de inte kan ta ut överpris.',
      },
      {
        heading: '2. Var aldrig den som nämner en siffra först',
        body: 'Låt handlaren lägga det första budet. Säg: "Vad är ert bästa pris?" – och lyssna sedan. Säger handlaren ett pris du kan acceptera, be ändå om lite mer. Det kostar ingenting att fråga och handlaren förväntar sig det.',
      },
      {
        heading: '3. Använd verkliga brister som argument',
        body: 'Hitta faktiska fel och brister under provkörning och besiktning. Slitage på däck (ca 2 000–3 000 kr att byta), kommande service, repor, defekter i elektroniken – varje brist är ett argument för prisavdrag. Var konkret: "Däcken behöver bytas till hösten, det är 2 800 kr. Kan vi ta av det på priset?"',
      },
      {
        heading: '4. Kombinera och förhandla hela paketet',
        body: 'Handlare har ofta mer rörelseutrymme på kringtjänster (garanti, service, tillbehör) än på grundpriset. Fråga efter fri vinterdäcksförvaring, förlängd garanti, dubbdäck på köpet eller gratis service. Paketförhandling ger ofta mer totalt värde än enbart prisrabatt.',
      },
      {
        heading: '5. Visa att du är redo att gå',
        body: 'Handlare vill inte förlora en kund som är nära att köpa. Säg lugnt: "Det är över min budget. Tack för visningen." och börja röra dig mot utgången. Det är förvånansvärt ofta som handlaren ropar tillbaka med ett bättre pris. Ha på dig och agera genuint – det märks om det är bluff.',
      },
      {
        heading: '6. Förhandla finansieringen separat',
        body: 'Blanda inte ihop prisförhandlingen med finansieringen. Förhandla priset klart först. Handlarens finansiering är ofta dyrare än bankens – jämför alltid med din bank eller ett finansieringsbolag innan du skriver under. Ränteskillnaden på ett fyraårigt lån kan vara 20 000–50 000 kr.',
      },
      {
        heading: '7. Låt en expert förhandla åt dig',
        body: 'Om du inte är bekväm med att förhandla, eller om det är mycket pengar på spel, kan Biltos rådgivare ta över förhandlingen åt dig. Genomsnittskunden sparar 12 000–35 000 kr per affär – ofta mer än vad man trodde var möjligt.',
      },
    ],
  },
  {
    slug: 'salja-bil-basta-pris',
    title: 'Sälja bil till bästa pris – komplett guide',
    metaTitle: 'Sälja bil till bästa pris – guide 2024 | Bilto',
    metaDescription: 'Maximera priset när du säljer din bil. Steg-för-steg guide om förberedelser, värdering, var du säljer och hur du undviker vanliga misstag.',
    category: 'Bilförsäljning',
    readingTime: '7 min',
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
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
