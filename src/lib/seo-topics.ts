export interface SeoTopic {
  slug: string;
  canonical: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  keywords: string[];
  intent: 'buy' | 'sell' | 'general';
  benefits: { heading: string; body: string }[];
  steps: { n: string; heading: string; body: string }[];
  faqs: { q: string; a: string }[];
  ctaHeading: string;
  ctaBody: string;
  ctaLabel: string;
  ctaPath: string;
}

export const SEO_TOPICS: SeoTopic[] = [
  {
    slug: 'forhandla-bil',
    canonical: 'https://bilto.se/forhandla-bil',
    title: 'Förhandla bil – Expert sänker priset åt dig | Bilto',
    description: 'Låt Biltos experter förhandla din bilaffär. Vi pressar priser, kontrollerar avtal och ser till att du aldrig betalar för mycket. Gratis och utan bindning.',
    h1: 'Förhandla bil – vi pressar priset åt dig',
    intro: 'Att förhandla bil är en konst de flesta privatpersoner saknar träning i. Bilhandlare förhandlar varje dag — du kanske vart femte år. Bilto ger dig en erfaren bilrådgivare som förhandlar direkt med säljaren, kontrollerar avtalets alla delar och ser till att du aldrig betalar mer än nödvändigt. Genomsnittskunden sparar 12 000–35 000 kr per bilaffär.',
    keywords: ['förhandla bil', 'bilförhandling', 'förhandla ner bilpriset', 'bilexpert förhandla', 'hjälp förhandla bil', 'pressa bilpriset', 'förhandla bilpris'],
    intent: 'buy',
    benefits: [
      { heading: 'Erfaren förhandlare på din sida', body: 'Vår expert har förhandlat hundratals bilaffärer och vet exakt vilka argument och tidpunkter som ger bäst resultat.' },
      { heading: 'Fullständig avtalsgranskning', body: 'Vi läser igenom hela kontraktet — finansiering, garantier, tillägg — och flaggar allt som är till din nackdel.' },
      { heading: 'Spara 12 000–35 000 kr i snitt', body: 'Genomsnittskunden sparar fem siffror jämfört med att förhandla på egen hand. Bilto är alltid gratis för dig som köpare.' },
    ],
    steps: [
      { n: '01', heading: 'Boka kostnadsfri konsultation', body: 'Berätta vilken bil du tittar på, vilket pris säljaren begär och vad du redan vet. Det tar 5 minuter.' },
      { n: '02', heading: 'Vi analyserar och förbereder', body: 'Vår expert kontrollerar marknadspris, fordonets historia och leasingrestkostnader — och tar fram din förhandlingsstrategi.' },
      { n: '03', heading: 'Vi förhandlar – du sitter tillbaka', body: 'Bilto kontaktar säljaren, pressar priset och ser till att villkoren är rättvisa. Du godkänner det slutliga budet.' },
    ],
    faqs: [
      { q: 'Vad kostar det att anlita Bilto för bilförhandling?', a: 'Ingenting. Bilto är alltid gratis för dig som köpare. Vi finansieras av en liten ersättning från handlaren när affären genomförs.' },
      { q: 'Kan ni förhandla bilar från privatpersoner?', a: 'Ja, vi hjälper dig förhandla oavsett om du köper av en handlare, via Blocket eller en privat säljare.' },
      { q: 'Hur mycket kan jag spara genom att låta Bilto förhandla?', a: 'Genomsnittskunden sparar mellan 12 000 och 35 000 kronor per bilaffär jämfört med att förhandla på egen hand.' },
      { q: 'Kan ni hjälpa mig kontrollera om priset är rimligt?', a: 'Ja! Skicka oss annonsens länk och ditt registreringsnummer så gör vi en gratis marknadsanalys inom 24 timmar.' },
      { q: 'Vad händer om säljaren inte vill sänka priset?', a: 'Vi förhandlar alltid om mer än bara priset — finansieringsvillkor, garanti, fria services och utrustning är alla delar av affären vi kan förbättra.' },
    ],
    ctaHeading: 'Redo att spara tiotusentals kronor?',
    ctaBody: 'Boka din kostnadsfria konsultation — vår expert ringer dig inom en dag.',
    ctaLabel: 'Boka gratis konsultation',
    ctaPath: '/gratis-konsultation',
  },

  {
    slug: 'bilkopshjalp',
    canonical: 'https://bilto.se/bilkopshjalp',
    title: 'Bilköpshjälp – Expert hittar rätt bil åt dig | Bilto',
    description: 'Professionell bilköpshjälp från experter. Vi hittar, granskar och förhandlar bilen åt dig — så att du aldrig köper fel bil eller betalar för mycket. Helt gratis.',
    h1: 'Bilköpshjälp – din personliga bilexpert',
    intro: 'Att köpa bil är för de flesta den största affären efter bostaden. Ändå görs den ofta utan professionell hjälp. Biltos bilköpshjälp ger dig en dedikerad expert som söker, granskar och förhandlar hela bilköpet åt dig — från första annonskollen till nycklarna i handen. Gratis, tryggt och utan krångel.',
    keywords: ['bilköpshjälp', 'hjälp med bilköp', 'bilexpert köp', 'köpa bil med hjälp', 'bilrådgivare köpa bil', 'professionell bilköp', 'bilköp hjälp'],
    intent: 'buy',
    benefits: [
      { heading: 'Vi hittar bilen du vill ha', body: 'Berätta vad du söker — modell, budget, mil — så letar vi i hela Sverige tills vi hittar rätt fordon. Du slipper timmar på blocket.' },
      { heading: 'Teknisk besiktning och historikkoll', body: 'Våra experter kontrollerar fordonets status, servicehistorik och eventuella dolda fel innan du ens sätter dig i bilen.' },
      { heading: 'Förhandling och avtalshjälp', body: 'Vi förhandlar priset, granskar finansieringen och ser till att kontraktet är rättvist. Inget lirk, inget konstigt.' },
    ],
    steps: [
      { n: '01', heading: 'Berätta vad du söker', body: 'Fyll i biltyp, budget, önskade egenskaper och tidsram. Ju mer du berättar, desto bättre kan vi söka.' },
      { n: '02', heading: 'Vi söker och presenterar alternativ', body: 'Inom 24–48 timmar presenterar vi tre till fem noggrant utvalda bilar som matchar dina krav.' },
      { n: '03', heading: 'Du väljer — vi fixar resten', body: 'Välj din favorit. Vi bokar provkörning, förhandlar pris och hanterar all kommunikation med säljaren.' },
    ],
    faqs: [
      { q: 'Vad ingår i Biltos bilköpshjälp?', a: 'Vi söker bilar åt dig, granskar alternativ, bokar provkörning, förhandlar pris, kontrollerar kontrakt och ser till att affären är trygg från start till slut.' },
      { q: 'Kostar bilköpshjälpen något?', a: 'Nej, Biltos tjänst är alltid gratis för dig som köpare. Vi tar en liten ersättning från säljaren när affären är klar.' },
      { q: 'Kan ni hjälpa mig hitta en specifik bil jag redan sett?', a: 'Absolut. Skicka länken till annonsen och vi kontrollerar bilen, förhandlar priset och granskar kontraktet åt dig.' },
      { q: 'Hur lång tid tar det att hitta rätt bil?', a: 'De flesta kunder har ett bra alternativ att titta på inom 24–72 timmar. Hur snabbt det går beror på hur specifika kraven är.' },
      { q: 'Vad händer om jag inte gillar de bilar ni presenterar?', a: 'Inget problem — vi fortsätter söka tills du är nöjd, utan extra kostnad.' },
    ],
    ctaHeading: 'Låt oss hitta din nästa bil',
    ctaBody: 'Berätta vad du söker och vi återkommer med alternativ inom 24 timmar.',
    ctaLabel: 'Starta gratis bilköpshjälp',
    ctaPath: '/kop-bil-hjalp',
  },

  {
    slug: 'spara-pengar-bilkop',
    canonical: 'https://bilto.se/spara-pengar-bilkop',
    title: 'Spara pengar på bilköp – 5 sätt att sänka kostnaden | Bilto',
    description: 'Lär dig spara pengar på ditt nästa bilköp. Bilto hjälper dig förhandla, jämföra finansiering och undvika dyra misstag. Genomsnittskunden sparar 20 000 kr.',
    h1: 'Spara pengar på bilköp – så gör du det',
    intro: 'Bilköp är ett av livets dyraste inköp — och de flesta betalar mer än de behöver. Med rätt strategi kan du spara tiotusentals kronor på samma bil. Biltos experter hjälper dig förhandla priset, jämföra finansiering och undvika de vanligaste kostnadsfällorna. Genomsnittskunden sparar 20 000 kr per bilaffär.',
    keywords: ['spara pengar bilköp', 'spara på bilköp', 'bilköp tips', 'bilköp kostnad', 'bilköp bättre pris', 'spara pengar bil'],
    intent: 'buy',
    benefits: [
      { heading: 'Förhandla alltid priset', body: 'Listpris är sällan slutpris. En skicklig förhandlare kan sänka priset med 5–15 % — och Biltos experter förhandlar åt dig utan kostnad.' },
      { heading: 'Jämför finansiering noggrant', body: 'Handlarfinansieringen är sällan bäst. Vi hjälper dig jämföra lån och hitta rätt ränta — det kan spara dig tusentals kronor extra.' },
      { heading: 'Undvik onödiga tillägg', body: 'Handlare tjänar stora pengar på tilläggsprodukter. Vi lär dig vilka som är värda pengarna och vilka du säkert kan tacka nej till.' },
    ],
    steps: [
      { n: '01', heading: 'Boka en gratis genomgång', body: 'Berätta om bilen du tittar på — pris, märke, miltal. Vi analyserar om priset är rimligt och vad som är möjligt att pressa.' },
      { n: '02', heading: 'Få din sparplan', body: 'Vi presenterar konkreta åtgärder: förhandlingsargument, finansieringsjämförelse och en lista på tillägg du kan hoppa över.' },
      { n: '03', heading: 'Vi genomför — du sparar', body: 'Vill du ha ännu mer hjälp? Vi förhandlar hela affären åt dig. De flesta kunder sparar 12 000–35 000 kr.' },
    ],
    faqs: [
      { q: 'Hur mycket kan jag spara på ett bilköp?', a: 'Det beror på bilen och situationen. I genomsnitt sparar Biltos kunder 12 000–35 000 kronor per affär jämfört med att göra det på egen hand.' },
      { q: 'Är det möjligt att förhandla på begagnade bilar?', a: 'Ja, och ofta med ännu bättre resultat än på nya bilar. Vi vet exakt hur marknaden ser ut och vad som är rimligt att begära.' },
      { q: 'Hur jämför man finansiering på bästa sätt?', a: 'Titta på den effektiva räntan (ER), inte bara månadsbeloppet. Bilto hjälper dig räkna ut den totala kostnaden för olika alternativ.' },
      { q: 'Vilka tillägg kan man skippa vid ett bilköp?', a: 'Lacklaminering, "hjulförsäkring" och de flesta tillbehörspaket är ofta starkt överprisade. Kontakta oss för specifik rådgivning.' },
    ],
    ctaHeading: 'Spara tiotusentals kronor på ditt nästa bilköp',
    ctaBody: 'Boka en gratis genomgång — vi berättar exakt vad din bil borde kosta.',
    ctaLabel: 'Boka gratis genomgång',
    ctaPath: '/gratis-konsultation',
  },

  {
    slug: 'sank-manadskostnad-bil',
    canonical: 'https://bilto.se/sank-manadskostnad-bil',
    title: 'Sänk månadskostnaden för bil – expert hjälper dig | Bilto',
    description: 'Betalar du för mycket varje månad för din bil? Bilto hjälper dig sänka månadskostnaden — ny finansiering, bättre leasingavtal eller byte till rätt bil. Gratis rådgivning.',
    h1: 'Sänk månadskostnaden för din bil',
    intro: 'Många bilägare betalar hundratals kronor för mycket varje månad — utan att veta om det. Höga räntor, dåligt förhandlade leasingavtal och fel bil för din körprofil kostar pengar varje månad. Biltos experter analyserar din situation och presenterar konkreta sätt att sänka din totala bilkostnad — ofta med 500–2 000 kr per månad.',
    keywords: ['sänk månadskostnad bil', 'sänk bilkostnader', 'minska bilkostnader', 'lägre månadskostnad bil', 'bilkostnad per månad', 'spara bil månad', 'sänk leasingkostnad'],
    intent: 'general',
    benefits: [
      { heading: 'Analysera din nuvarande kostnad', body: 'Många vet inte vad deras bil faktiskt kostar per månad. Vi räknar fram totalbeloppet inklusive ränta, försäkring, drivmedel och service.' },
      { heading: 'Bättre finansiering', body: 'Hög ränta är det vanligaste problemet. Vi hjälper dig jämföra refinansiering och hitta ett lån som kan spara hundratals kronor i månaden.' },
      { heading: 'Rätt bil för rätt livssituation', body: 'Kör du lite? Kanske är leasing eller en billigare modell bättre för dig. Vi hjälper dig räkna på alternativen.' },
    ],
    steps: [
      { n: '01', heading: 'Dela din situation', body: 'Berätta om din bil, nuvarande finansiering och hur mycket du kör. Tar 5 minuter.' },
      { n: '02', heading: 'Vi analyserar och räknar', body: 'Vår expert identifierar var du betalar för mycket och presenterar konkreta alternativ för att sänka kostnaden.' },
      { n: '03', heading: 'Genomför förändringen', body: 'Vi hjälper dig refinansiera, förhandla om leasingen eller hitta en ny bil som passar bättre — beroende på vad som ger störst besparing.' },
    ],
    faqs: [
      { q: 'Hur mycket kan jag sänka månadskostnaden för min bil?', a: 'Det beror på din nuvarande situation. Kunder som har höga räntor eller fel finansieringsform kan ofta spara 500–2 000 kronor per månad.' },
      { q: 'Kan man förhandla om ett befintligt leasingavtal?', a: 'Ja, det är möjligt att omförhandla leasingvillkor i förtid, särskilt om bilens restvärde har förändrats. Bilto hjälper dig se vad som är möjligt.' },
      { q: 'Är det billigare att äga eller leasa en bil?', a: 'Det beror helt på din körsträcka, skattesituation och hur länge du planerar att ha bilen. Bilto räknar ut det åt dig utan kostnad.' },
      { q: 'Vad är den totala månadskostnaden för en genomsnittlig bil?', a: 'För en genomsnittlig begagnad bil i Sverige inkluderat lån, försäkring och drivmedel är kostnaden ofta 4 000–8 000 kr per månad — men varierar mycket.' },
    ],
    ctaHeading: 'Sänk din bilkostnad idag',
    ctaBody: 'Boka en gratis konsultation och ta reda på hur mycket du kan spara per månad.',
    ctaLabel: 'Boka gratis analys',
    ctaPath: '/gratis-konsultation',
  },

  {
    slug: 'byta-bil',
    canonical: 'https://bilto.se/byta-bil',
    title: 'Byta bil – smidigt inbyte med bästa villkor | Bilto',
    description: 'Ska du byta bil? Bilto hjälper dig sälja din gamla bil till rätt pris och hitta din nästa – ett smidigt bilbyte utan krångel. Gratis värdering och rådgivning.',
    h1: 'Byta bil – vi hanterar hela bytet',
    intro: 'Bilbyte kan vara krångligt: du ska sälja din gamla bil till rätt pris, hitta nästa, förhandla och se till att tidpunkterna stämmer. Bilto tar hand om hela processen — vi värderar och säljer din gamla bil, hittar din nya och förhandlar villkoren. Ett smidigt, tryggt bilbyte från start till slut.',
    keywords: ['byta bil', 'bilbyte', 'inbyte bil', 'byta in bil', 'sälja och köpa bil', 'bilbyte hjälp', 'byta bil smidigt'],
    intent: 'general',
    benefits: [
      { heading: 'Sälj din gamla bil till bästa pris', body: 'Vi konkurrensbjuder ut din gamla bil till granskade handlare och ser till att du får det högsta budet — inte det som handlaren håller på.' },
      { heading: 'Hitta rätt ny bil', body: 'Berätta vad du vill ha. Vår expert söker i hela Sverige och presenterar matchande alternativ så att du slipper timmar på annonssidor.' },
      { heading: 'Koordinerat byte utan stress', body: 'Vi koordinerar tidpunkterna för köp och försäljning så att du aldrig är utan bil — och aldrig betalar för dubbla bilar.' },
    ],
    steps: [
      { n: '01', heading: 'Värdera din gamla bil', body: 'Ange registreringsnummer och vi skickar en gratis värdering inom 24 timmar.' },
      { n: '02', heading: 'Berätta om nästa bil', body: 'Berätta vad du söker — märke, modell, utrustning, budget. Vi börjar söka parallellt.' },
      { n: '03', heading: 'Vi koordinerar bytet', body: 'Sälj den gamla, köp den nya — vi ser till att allt faller på plats utan stress och utan att du är utan bil.' },
    ],
    faqs: [
      { q: 'Kan Bilto hjälpa mig byta bil?', a: 'Ja! Vi hanterar hela bilbytet — värdering och försäljning av din gamla bil samt hjälp att hitta och köpa nästa.' },
      { q: 'Är inbyte hos handlare ett bra alternativ?', a: 'Sällan. Handlaren tjänar på att ge ett lågt inbytespris. Bilto ser till att du jämför inbytesbudet mot marknaden och aldrig säljer för billigt.' },
      { q: 'Hur lång tid tar ett bilbyte via Bilto?', a: 'De flesta bilbyten genomförs inom 5–14 dagar. Det beror på hur snabbt du hittar nästa bil och hur länge din gamla är ute på marknaden.' },
      { q: 'Kostar bilbytet hos Bilto något?', a: 'Nej. Biltos tjänst är gratis för privatpersoner. Vi finansieras av ett arvode från handlaren.' },
    ],
    ctaHeading: 'Dags att byta bil?',
    ctaBody: 'Starta med en gratis värdering av din gamla bil — ta sedan nästa steg i din takt.',
    ctaLabel: 'Värdera min bil gratis',
    ctaPath: '/',
  },

  {
    slug: 'bilradgivare',
    canonical: 'https://bilto.se/bilradgivare',
    title: 'Gratis bilrådgivare – Expert på din sida | Bilto',
    description: 'Biltos gratis bilrådgivare hjälper dig köpa, sälja och byta bil med trygghet. Vi ger opartiska råd, förhandlar och ser till att du gör rätt val. Boka idag.',
    h1: 'Gratis bilrådgivare – oberoende experthjälp',
    intro: 'En bra bilrådgivare kan vara skillnaden mellan en fantastisk bilaffär och en kostsam besvikelse. Bilto erbjuder gratis, oberoende bilrådgivning — vi jobbar för din skull, inte handlarens. Oavsett om du köper, säljer eller byter bil ger vi dig de råd och verktyg du behöver för att ta rätt beslut.',
    keywords: ['bilrådgivare', 'gratis bilrådgivning', 'bilexpert råd', 'oberoende bilrådgivare', 'bilrådgivning Sverige', 'bilrådgivare köpa bil'],
    intent: 'general',
    benefits: [
      { heading: '100 % oberoende råd', body: 'Vi är inte bundna till någon handlare eller märke. Våra råd baseras uteslutande på ditt bästa — inte provision.' },
      { heading: 'Bred expertis', body: 'Från teknisk bedömning och historikkoll till finansieringsjämförelse och juridisk granskning av köpeavtal.' },
      { heading: 'Personlig kontakt', body: 'Du pratar med en riktig bilexpert — inte ett chatbot. Vi lär känna din situation och ger råd som passar just dig.' },
    ],
    steps: [
      { n: '01', heading: 'Boka ett samtal', body: 'Välj en tid som passar och berätta kort om vad du behöver hjälp med. Vi förbereder oss inför samtalet.' },
      { n: '02', heading: 'Genomgång med experten', body: 'Under samtalet går vi igenom din situation, identifierar risker och möjligheter, och lägger upp en plan.' },
      { n: '03', heading: 'Vi stödjer dig hela vägen', body: 'Vår rådgivare finns tillgänglig under hela processen — via telefon och mejl — tills affären är klar och du är nöjd.' },
    ],
    faqs: [
      { q: 'Vad gör en bilrådgivare?', a: 'En bilrådgivare hjälper dig navigera bilmarknaden — de analyserar annonser, kontrollerar prisnivåer, granskar kontrakt och förhandlar på dina vägnar.' },
      { q: 'Kostar bilrådgivningen hos Bilto något?', a: 'Nej, Biltos bilrådgivning är kostnadsfri för privatpersoner som köper eller säljer bil.' },
      { q: 'Är Biltos bilrådgivare oberoende?', a: 'Ja. Vi är inte knutna till någon specifik handlare eller märke och ger alltid råd utifrån din situation.' },
      { q: 'Kan en bilrådgivare hjälpa mig med leasing?', a: 'Absolut. Vi jämför leasingalternativ, förklarar villkoren och ser till att du inte binder dig till ett ofördelaktigt avtal.' },
    ],
    ctaHeading: 'Prata med en bilrådgivare idag',
    ctaBody: 'Gratis, oberoende och utan bindning. Vi hjälper dig göra rätt val.',
    ctaLabel: 'Boka gratis rådgivning',
    ctaPath: '/gratis-konsultation',
  },

  {
    slug: 'gratis-bilvardering',
    canonical: 'https://bilto.se/gratis-bilvardering',
    title: 'Gratis bilvärdering – Vad är din bil värd? | Bilto',
    description: 'Få en gratis bilvärdering på under 24 timmar. Bilto jämför bud från granskade handlare så att du vet exakt vad din bil är värd på marknaden idag.',
    h1: 'Gratis bilvärdering – ta reda på vad din bil är värd',
    intro: 'Vad är din bil faktiskt värd? Inte vad du hoppas på — utan vad marknaden betalar idag. Bilto ger dig en gratis, realistisk bilvärdering baserad på bud från riktiga handlare. Inga gissningar, inga vilseledande "bokförda värden" — bara vad din bil faktiskt kan inbringa.',
    keywords: ['gratis bilvärdering', 'värdera bil gratis', 'vad är min bil värd', 'bilvärdering online', 'bilens värde', 'värdera begagnad bil'],
    intent: 'sell',
    benefits: [
      { heading: 'Riktiga bud från handlare', body: 'Till skillnad från algoritmbaserade värderingsverktyg får du faktiska köpbud från granskade handlare — det är vad din bil är värd på riktigt.' },
      { heading: 'Ingen bindning', body: 'En gratis värdering innebär inte att du måste sälja. Ta informationen, jämför och besluta i din egen takt.' },
      { heading: 'Svar inom 24 timmar', body: 'Fyll i formuläret och du har bud i handen nästa dag. Snabbt, enkelt och helt kostnadsfritt.' },
    ],
    steps: [
      { n: '01', heading: 'Ange din bil', body: 'Fyll i registreringsnummer och berätta om skick och miltal. Det tar 2 minuter.' },
      { n: '02', heading: 'Vi kontaktar handlare', body: 'Bilto skickar ut din bil till granskade handlare i nätverket som lämnar anonyma köpbud.' },
      { n: '03', heading: 'Du får ditt marknadsvärde', body: 'Inom 24 timmar presenterar vi de bästa buden. Sälj om du vill — eller använd värderingen som kunskap.' },
    ],
    faqs: [
      { q: 'Hur gör Bilto sin bilvärdering?', a: 'Vi samlar in faktiska köpbud från handlare i hela Sverige. Det är ett mer exakt sätt att värdera en bil än automatiserade verktyg som bara tittar på statistik.' },
      { q: 'Måste jag sälja om jag begär en värdering?', a: 'Nej. En värdering är helt gratis och utan förpliktelse. Du bestämmer själv om och när du vill sälja.' },
      { q: 'Hur snabbt får jag mitt värde?', a: 'De flesta bilar värderas inom 24 timmar. Ovanligare fordon kan ta lite längre tid.' },
      { q: 'Stämmer Biltos värdering med vad man hittar på blocket?', a: 'Det beror på. Annonserade priser på Blocket är vad säljare hoppas få — Biltos värdering visar vad köpare faktiskt betalar.' },
    ],
    ctaHeading: 'Vad är din bil värd?',
    ctaBody: 'Ange registreringsnumret — vi har ett svar till dig inom 24 timmar.',
    ctaLabel: 'Värdera min bil gratis',
    ctaPath: '/',
  },
];

export function slugToTopic(slug: string): SeoTopic | undefined {
  return SEO_TOPICS.find(t => t.slug === slug);
}
