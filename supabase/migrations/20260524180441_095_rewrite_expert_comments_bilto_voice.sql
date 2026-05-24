/*
  # Rewrite expert_comment — Bilto editorial voice

  Replaces all auto-generated template texts with honest, sharp Bilto-style
  assessments. Tone: direct, knowledgeable, no marketing speak. One to two
  sentences that tell the buyer something real — tradeoffs, hidden costs,
  who it actually suits, what to watch out for.

  Logic is driven by (fuel_types, segment, body_type, make) combinations.
  Premium/luxury brands get a depreciation warning. Value brands get a
  running-cost note. Sports cars get a practicality caveat. EVs get an honest
  range/charging comment instead of the old "kräver laddvana" cliché.
*/

UPDATE car_catalog
SET expert_comment = CASE

  /* ── ELECTRIC ─────────────────────────────────────────────────────────── */

  /* EV luxury/premium */
  WHEN 'el' = ANY(fuel_types) AND segment IN ('luxury','premium') AND body_type = 'suv'
    THEN make || ' ' || model || ' imponerar med lång räckvidd och snabb laddning — men räkna med kraftig värdeminskning år ett och två. Begagnad är nästan alltid bättre affär.'

  WHEN 'el' = ANY(fuel_types) AND segment IN ('luxury','premium') AND body_type IN ('sedan','kombi')
    THEN make || ' ' || model || ' kombinerar elbilsprestanda med genuint lyxig interiör. Priset är högt och faller snabbt — köp gärna ett år gammalt för halva nedskrivningen.'

  /* EV sports */
  WHEN 'el' = ANY(fuel_types) AND segment = 'sports'
    THEN make || ' ' || model || ' är snabb utan att diskutera saken. Räckvidden räcker för de flesta — men planera laddningen på längre resa.'

  /* EV midsize SUV mainstream */
  WHEN 'el' = ANY(fuel_types) AND segment = 'midsize' AND body_type = 'suv'
    THEN make || ' ' || model || ' är en trygg vardags-SUV med rimlig räckvidd. Driftkostnaderna är låga, men andrahandsvärdet varierar — kolla modellåret noga.'

  /* EV midsize sedan/kombi */
  WHEN 'el' = ANY(fuel_types) AND segment = 'midsize' AND body_type IN ('sedan','kombi')
    THEN make || ' ' || model || ' är ett konkurrenskraftigt elbilsalternativ i mellanklass. Räckvidden är acceptabel för pendling och kortare resor — motorvägskörning äter batteri snabbare.'

  /* EV compact */
  WHEN 'el' = ANY(fuel_types) AND segment = 'compact'
    THEN make || ' ' || model || ' passar stadsmiljö bra — räckvidden räcker för det mesta inom tätort. Tänk på att laddinfrastruktur hemma gör stor skillnad i vardagen.'

  /* EV budget/value */
  WHEN 'el' = ANY(fuel_types) AND segment IN ('budget','value')
    THEN make || ' ' || model || ' är en av de billigare elbilarna på marknaden. Räkna med kortare räckvidd och enklare utrustning — men för korta dagliga sträckor fungerar det utmärkt.'

  /* Generic EV fallback */
  WHEN 'el' = ANY(fuel_types)
    THEN make || ' ' || model || ' är ett helelektriskt alternativ med låga löpande kostnader. Räkna noggrant på laddmöjligheter och räckvidd för din körprofil innan köp.'

  /* ── LADDHYBRID ───────────────────────────────────────────────────────── */

  WHEN 'laddhybrid' = ANY(fuel_types) AND segment IN ('luxury','premium')
    THEN make || ' ' || model || ' marknadsförs som miljöbil — men fungerar bara om du faktiskt laddar regelbundet. Med tomt batteri är förbrukningen hög och affären sämre.'

  WHEN 'laddhybrid' = ANY(fuel_types) AND segment IN ('midsize','compact') AND body_type = 'suv'
    THEN make || ' ' || model || ' kan vara ett klokt val om du pendlar kort och laddar hemma varje natt. Kör du mest motorväg med tomt batteri betalar du premie utan nytta.'

  WHEN 'laddhybrid' = ANY(fuel_types) AND body_type IN ('kombi','sedan')
    THEN make || ' ' || model || ' är praktisk och flexibel — men laddhybridpremiet lönar sig bara om du faktiskt utnyttjar eldriften. Kör du lite och laddar ofta är det smart; annars inte.'

  WHEN 'laddhybrid' = ANY(fuel_types)
    THEN make || ' ' || model || ' kombinerar el och bensin. Nyttan beror helt på ditt körvanor — korta pendlare tjänar på det, långdistansförare gör sig troligen bättre med ren diesel eller bensin.'

  /* ── HYBRID (mild/fullhybrid) ─────────────────────────────────────────── */

  WHEN 'hybrid' = ANY(fuel_types) AND segment IN ('budget','value','compact')
    THEN make || ' ' || model || ' har en hybriddrivlina som sänker förbrukningen i stadstrafik märkbart. Inga laddbekymmer — systemet sköter sig självt.'

  WHEN 'hybrid' = ANY(fuel_types) AND segment IN ('midsize','premium','luxury')
    THEN make || ' ' || model || ' är en väl beprövad hybrid som levererar låg förbrukning utan kompromiss på komfort. Driftkostnaderna är stabila och andrahandsvärdet ofta bra.'

  WHEN 'hybrid' = ANY(fuel_types)
    THEN make || ' ' || model || ' har en hybriddrivlina som fungerar bäst i blandad körning och stad. Bättre bränsleekonomi utan krav på laddning — ett pragmatiskt mellanalternativ.'

  /* ── DIESEL ───────────────────────────────────────────────────────────── */

  WHEN 'diesel' = ANY(fuel_types) AND segment IN ('luxury','premium')
    THEN make || ' ' || model || ' med diesel passar den som kör mycket och långt. Låg förbrukning på motorväg — men service och AdBlue adderar kostnader som glöms bort i kalkylen.'

  WHEN 'diesel' = ANY(fuel_types) AND body_type = 'suv' AND segment IN ('midsize','fullsize')
    THEN make || ' ' || model || ' är i sitt esse på motorväg med dieselmotorn — lång räckvidd och riktigt låg förbrukning på väg. Kortpendlare i stad betalar onödigt för tekniken.'

  WHEN 'diesel' = ANY(fuel_types) AND body_type IN ('kombi','sedan') AND segment = 'midsize'
    THEN make || ' ' || model || ' med diesel är gjord för körsträckor. Räkna minst 1 500 mil per år för att dra nytta av dieselpremiet mot bensin — annars är kalkylen tveksam.'

  WHEN 'diesel' = ANY(fuel_types)
    THEN make || ' ' || model || ' kör på diesel — effektivt vid hög körsträcka, men dyrare i underhåll. Stämmer körmönstret är det ett vettigt val; stämmer det inte, kolla bensinalternativet.'

  /* ── BENSIN — Sports ──────────────────────────────────────────────────── */

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'sports' AND body_type IN ('coupe','cab')
    THEN make || ' ' || model || ' offrar praktikalitet för körupplevelse — och gör det utan ursäkt. Hög förbrukning och dyra tillval hör till, men den som söker körglädje hittar den här.'

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'sports'
    THEN make || ' ' || model || ' är en prestanda­bil förpackad i vardagskläder. Rolig att köra, dyrare att försäkra och tanka — räkna med det i kalkylen.'

  /* ── BENSIN — Luxury/Premium ──────────────────────────────────────────── */

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'luxury'
    THEN make || ' ' || model || ' erbjuder toppkvalitet och hög status — men tappa aldrig bort att värdeminskningen det första året kan överstiga 200 000 kr. Begagnat år två ger nästan samma upplevelse till hälften.'

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'premium' AND body_type = 'suv'
    THEN make || ' ' || model || ' är en välgjord premium-SUV. Dyr i inköp och service — men håller sig relativt väl på andrahandsmarknaden jämfört med lyxsegmentet.'

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'premium'
    THEN make || ' ' || model || ' levererar premiumkänsla och bra körupplevelse. Tillvalslistan kan snabbt fördubbla grundpriset — var disciplinerad vid konfigurationen.'

  /* ── BENSIN — Midsize ─────────────────────────────────────────────────── */

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'midsize' AND body_type = 'suv'
    THEN make || ' ' || model || ' är en välbeprövad mellanstor SUV. Bensinalternativet funkar fint för blandad körning — välj diesel om du kör mer än 2 000 mil per år.'

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'midsize' AND body_type IN ('kombi','sedan')
    THEN make || ' ' || model || ' är ett klassiskt mellanklasspick. Pålitlig, praktisk och rimlig att äga — utan att sätta prägel på garagen.'

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'midsize'
    THEN make || ' ' || model || ' är en solid bil i mellanklass. Inga uppseendeväckande fördelar men heller inga stora bekymmer — ett tryggt och okomplicerat val.'

  /* ── BENSIN — Compact ─────────────────────────────────────────────────── */

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'compact' AND body_type = 'suv'
    THEN make || ' ' || model || ' är en kompakt SUV som är lätt att leva med. Praktisk i stan, okej på motorväg — men glöm äventyr utanför asfalten.'

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'compact'
    THEN make || ' ' || model || ' är en okomplicerad kompaktbil för vardagsbruk. Låg skatt och servicekostnad — välj rätt utrustningsnivå så är kalkylen enkel.'

  /* ── BENSIN — Budget/Value ────────────────────────────────────────────── */

  WHEN 'bensin' = ANY(fuel_types) AND segment IN ('budget','value')
    THEN make || ' ' || model || ' är ärligt prisvärd — inga onödiga krusiduller, men heller inget som imponerar. Köper du den för pengarna är det ett vettigt val; förväntar du dig premiumkänsla letar du fel.'

  /* ── BENSIN — Fullsize ────────────────────────────────────────────────── */

  WHEN 'bensin' = ANY(fuel_types) AND segment = 'fullsize'
    THEN make || ' ' || model || ' är en stor bil med stor motor — och en driftkostnad som matchar. Räkna på försäkring, skatt och tankning innan du slår till.'

  /* ── FALLBACK ─────────────────────────────────────────────────────────── */

  ELSE
    make || ' ' || model || ' är ett solitt val i sin klass. Kolla totalkalkylen noga — inköpspris är bara en del av vad bilen kostar att äga.'

END,
updated_at = now()
WHERE expert_comment IS NOT NULL;
