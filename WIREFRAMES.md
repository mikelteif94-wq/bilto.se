# Bilto – Wireframes & Copy för alla sidor och flöden

> Detta dokument beskriver varje sida, dess layout (wireframe i text), alla element
> och den copy (text) som visas. Organiserat i: Offentliga sidor, Kundportal,
> Handlarportal, Admin-portalen, och Modaler/flöden.

---

## INNEHÅLL

1. [Offentliga sidor](#1-offentliga-sidor)
   - 1.1 Startsida (`/`)
   - 1.2 Köp bil (`/kop-bil`)
   - 1.3 Beställ bilköpshjälp (`/kop-bil/bestall`)
   - 1.4 Bilköpshjälpen landning (`/kop-bil-hjalp`)
   - 1.5 Sälj bil (`/salj-bil`)
   - 1.6 Så funkar det (`/sa-funkar-det`)
   - 1.7 Bilspara (`/bilspara`)
   - 1.8 Priser (`/priser`)
   - 1.9 Vanliga frågor (`/vanliga-fragor`)
   - 1.10 Guider (`/guider`, `/guider/[slug]`)
   - 1.11 Om oss (`/om-oss`)
   - 1.12 Integritetspolicy & Användarvillkor
   - 1.13 Webbplatskarta (`/webbplatskarta`)
   - 1.14 SEO-sidor (topic, stad, märke)
2. [Kundportal](#2-kundportal)
3. [Handlarportal](#3-handlarportal)
4. [Admin-portalen](#4-admin-portalen)
5. [Modaler & Wizards](#5-modaler--wizards)
6. [Globala element](#6-globala-element)

---

## 1. OFFENTLIGA SIDOR

---

### 1.1 Startsida (`/`)

**Komponent:** `HowItWorks` (seoSlug="home")

```
┌─────────────────────────────────────────────────────┐
│  [Bilto logo]   Sälj bil | Köp bil | Så funkar det   │
│                              [Logga in] [Kostnadsfri  │
│                                       konsultation]  │
├─────────────────────────────────────────────────────┤
│                                                       │
│         ┌──[Sälj bil]──┬──[Köp bil]──┐                │
│         │               │              │                │
│   Hero-bild i bakgrunden + mörk gradient              │
│                                                       │
│   Flik: SÄLJ BIL (standard)                           │
│   ┌───────────────────────────────┐                   │
│   │  Regnummer [ABC123]           │                   │
│   │  Telefon  [070-...]           │                   │
│   │  [Värdera bilen →]            │                   │
│   └───────────────────────────────┘                   │
│                                                       │
│   Flik: KÖP BIL                                       │
│   ┌───────────────────────────────┐                   │
│   │  Sök bil... [Tesla Model Y]   │                   │
│   │  [Sök]                        │                   │
│   │  Chips: Tesla Model Y | Volvo  │                   │
│   │  XC60 | BMW 3-serie | Kia EV6 │                   │
│   └───────────────────────────────┘                   │
│   "Vet inte vad du vill ha? Vi hjälper dig →"         │
│                                                       │
├─────────────────────────────────────────────────────┤
│  "Så funkar Bilto" – 3 steg                          │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 📞        │  │ ⚖️        │  │ 🤝        │            │
│  │ Din egen  │  │ Vi press-│  │ Vi hämtar│            │
│  │ expert    │  │ fram det │  │ eller    │            │
│  │ från dag  │  │ bästa    │  │ levererar│            │
│  │ ett       │  │ budet    │  │ bilen    │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Populära bilar (katalogkort)                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │Bild│ │Bild│ │Bild│ │Bild│ │Bild│ │Bild│          │
│  │Namn│ │Namn│ │Namn│ │Namn│ │Namn│ │Namn│          │
│  │pris│ │pris│ │pris│ │pris│ │pris│ │pris│          │
│  │[Btn]│ │[Btn]│ │[Btn]│ │[Btn]│ │[Btn]│ │[Btn]│          │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘          │
│                                                       │
├─────────────────────────────────────────────────────┤
│  "Sälj din bil" sektion med bilbyte-exempel           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │ Volvo XC60 │  │ BMW X3     │  │ Tesla      │      │
│  │            │  │            │  │ Model Y    │      │
│  │ [Byt bil]  │  │ [Byt bil]  │  │ [Byt bil]  │      │
│  └────────────┘  └────────────┘  └────────────┘      │
│                                                       │
├─────────────────────────────────────────────────────┤
│  FAQ-sektion (accordion)                              │
│  ▸ Vad kostar det att använda Bilto?                  │
│  ▸ Hur hjälper Bilto mig att köpa bil?               │
│  ▸ Hur stor besparing kan jag räkna med?             │
│  ▸ Kan ni hjälpa mig även om jag inte hittat en bil?  │
│  ▸ Vad händer om säljaren inte går med på förhandl.?  │
│  ▸ När betalar jag avgiften?                          │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Recensioner / Omdömen                                │
│  ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │ ⭐⭐⭐⭐⭐ │ │ ⭐⭐⭐⭐⭐ │ │ ⭐⭐⭐⭐⭐ │                         │
│  │ "..." │ │ "..." │ │ "..." │                         │
│  └──────┘ └──────┘ └──────┘                         │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Sticky CTA (visas vid scroll)                        │
│  ┌─────────────────────────────────────────┐         │
│  │ [Expert-foto] 🟢 Online  [Kostnadsfri    │         │
│  │                          konsultation]  │         │
│  └─────────────────────────────────────────┘         │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer (se §6.2)                                     │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Hero rubrik (sälj) | "Sälj din bil till bästa pris" |
| Hero undertext (sälj) | "Certifierade handlare konkurrerar om att ge dig bästa pris. Gratis värdering – ingen bindning." |
| Sälj-form placeholder | Regnummer: "ABC123" / Telefon: "070-000 00 00" |
| Sälj-form CTA | "Värdera bilen" |
| Hero rubrik (köp) | "Hitta rätt bil – vi förhandlar priset" |
| Köp-form placeholder | "Sök märke eller modell…" |
| Köp-form CTA | "Sök" |
| Köp-chips undertext | "Vet inte vad du vill ha? Vi hjälper dig →" |
| Steg 1 rubrik | "Din egen expert från dag ett" |
| Steg 1 text | "En dedikerad rådgivare tar hand om dig hela vägen – oavsett om du säljer, byter eller köper bil." |
| Steg 2 rubrik | "Vi pressar fram bästa budet" |
| Steg 2 text | "Vi inhämtar konkurrerande bud från granskade bilhandlare och presenterar bara det bästa. Du jämför, du väljer." |
| Steg 3 rubrik | "Vi hämtar eller levererar bilen" |
| Steg 3 text | "Tackar du ja ordnar vi upphämtning av din sålda bil eller leverans av den nya – var som helst i Sverige. Noll krångel." |
| Trust-badge | "Vi jobbar alltid för dig – aldrig för handlaren" |
| Nav CTA | "Kostnadsfri konsultation" |
| FAQ 1 Q | "Vad kostar det att använda Bilto?" |
| FAQ 1 A | "Det kostar 4 995 kr i fast avgift – det är allt du betalar. Inga dolda avgifter, noll provision. Avgiften täcker förhandling, granskning och all administration kring affären. Gäller privatpersoner." |
| FAQ 2 Q | "Hur hjälper Bilto mig att köpa bil?" |
| FAQ 2 A | "Du berättar vilken bil du är intresserad av – vi tar över härifrån. Vi kontaktar säljaren, verifierar annonsens riktighet, förhandlar pris, ränta och tillbehör, och ser till att du inte betalar mer än du måste." |
| FAQ 3 Q | "Hur stor besparing kan jag räkna med?" |
| FAQ 3 A | "Våra kunder sparar ofta mer än vad tjänsten kostar – räknat på prisnedförhandling, inbytesvärde, ränta och tillbehör. Vår avgift på 4 995 kr betalas dessutom bara om affären blir av." |
| FAQ 4 Q | "Kan ni hjälpa mig även om jag inte hittat en bil ännu?" |
| FAQ 4 A | "Absolut. Vi hjälper dig hitta rätt bil via vår bilmatch eller sökning, eller helt enkelt utifrån vad du berättar att du söker. Sen sköter vi resten." |
| FAQ 5 Q | "Vad händer om säljaren inte går med på förhandlingen?" |
| FAQ 5 A | "Då berättar vi det rakt ut och ger dig vår opartiska bedömning – är bilen rätt prissatt eller inte. Du bestämmer alltid om du vill gå vidare." |
| FAQ 6 Q | "När betalar jag avgiften?" |
| FAQ 6 A | "Avgiften på 4 995 kr betalas när vi påbörjar förhandlingen åt dig. Om affären inte går igenom på grund av att säljaren avböjer, hör du av dig till oss så löser vi det." |

---

### 1.2 Köp bil (`/kop-bil`)

**Komponent:** `KopBilConcierge`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]  Sälj bil | Köp bil | Om oss  [Konsultation] │
├─────────────────────────────────────────────────────┤
│                                                       │
│  HERO (fullskärmsbild av bil)                         │
│                                                       │
│  "Köp bil –                                           │
│   med en expert på din sida"                          │
│   "4 995 kr om affären blir av · Söker hela          │
│    marknaden · Noll bindning"                         │
│                                                       │
│  ┌───────────────────────────────┐                   │
│  │ KÖP BIL MED EXPERT             │                   │
│  │ ✓ Söker i hela marknaden       │                   │
│  │ ✓ Förhandlar pris, ränta, val   │                   │
│  │ ✓ Granskar historik och skick   │                   │
│  │ ✓ Koordinerar hemleverans       │                   │
│  │                                │                   │
│  │ [Få prishjälp →]               │                   │
│  │ "Fast pris 4 995 kr – betalas   │                   │
│  │  bara om affären blir av"       │                   │
│  │ [Ring oss: 08-5555 0200]        │                   │
│  └───────────────────────────────┘                   │
│  🛡️ "Vi jobbar alltid för dig – aldrig för handlaren" │
│                                                       │
├─────────────────────────────────────────────────────┤
│  "Vad vi förhandlar fram" (blå box)                   │
│  "Spara 15 000 kr eller mer på din nästa bil"        │
│  [Läs mer – hur räknar vi? ▾]                        │
│                                                       │
│  (expanderbar:)                                       │
│  ✓ Prisförhandling på bilen    8 000–12 000 kr       │
│  ✓ Ränterabatt på finansiering 3 000–6 000 kr        │
│  ✓ Däck & tillval               2 000–4 000 kr        │
│  Total besparing per affär:    13 000–22 000 kr      │
│                                                       │
├─────────────────────────────────────────────────────┤
│  "Vad som ingår" – 6 kort                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │Sökning │ │Pris-    │ │Historik-│                   │
│  │i hela  │ │förhandl.│ │kontroll│                   │
│  │marknaden│ │        │ │        │                   │
│  └────────┘ └────────┘ └────────┘                   │
│  ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │Ränte-  │ │Inbytes-│ │Leverans│                   │
│  │förhandl│ │värdering│ │hem     │                   │
│  └────────┘ └────────┘ └────────┘                   │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Populära bilar (katalogkort)                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘          │
│                                                       │
├─────────────────────────────────────────────────────┤
│  FAQ (accordion)                                      │
│  ▸ Kostar det något att använda Biltos köptjänst?     │
│  ▸ Kan ni hjälpa mig om jag redan hittat en bil?      │
│  ▸ Hur lång tid tar det?                              │
│  ▸ Vad händer om ingen bil passar mig?               │
│  ▸ Kan ni hjälpa till med inbytesbil?                 │
│                                                       │
├─────────────────────────────────────────────────────┤
│  CTA-sektion                                          │
│  "Redo att köpa bil med en expert?"                   │
│  [Starta din förfrågan →]                             │
│  [Ring oss: 08-5555 0200]                             │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Hero rubrik | "Köp bil – med en expert på din sida" |
| Hero undertext | "4 995 kr om affären blir av · Söker hela marknaden · Noll bindning" |
| Box rubrik | "KÖP BIL MED EXPERT" |
| Box punkt 1 | "Söker i hela marknaden, inte bara ett handlares lager" |
| Box punkt 2 | "Förhandlar pris, ränta och tillval åt dig" |
| Box punkt 3 | "Granskar historik och skick före köp" |
| Box punkt 4 | "Koordinerar hemleverans om du vill" |
| Box CTA | "Få prishjälp" |
| Box undertext | "Fast pris 4 995 kr – betalas bara om affären blir av" |
| Spar-box rubrik | "Spara 15 000 kr eller mer på din nästa bil" |
| Spar-box text | "Oavsett om du leasar eller köper förhandlar Biltos experter pris, ränta och tillval åt dig – du sparar tid och pengar." |
| Spar-expand knapp | "Läs mer – hur räknar vi?" |
| Spar-rad 1 | "Prisförhandling på bilen" – "8 000–12 000 kr" – "Vi vet vad handlaren betalat och var marginalen finns – och utnyttjar det." |
| Spar-rad 2 | "Ränterabatt på finansiering" – "3 000–6 000 kr" – "Vi jämför och förhandlar räntan mot flera finansaktörer och pressar den nedåt." |
| Spar-rad 3 | "Däck & tillval" – "2 000–4 000 kr" – "Vinterdäck, golvmattor och service tas med i paketet – utan extrakostnad." |
| Spar-total | "Typisk total besparing per affär: 13 000–22 000 kr" |
| Spar-disclaimer | "Baserat på genomsnitt från genomförda affärer. Besparingen varierar beroende på bil och handlare. Biltos avgift är 4 995 kr och betalas endast om affären blir av." |
| Ingår 1 | "Sökning i hela marknaden" – "Vi letar på alla plattformar – inte bara ett handlares lager." |
| Ingår 2 | "Prisförhandling" – "Vi vet vad handlaren betalt för bilen och var marginalen finns." |
| Ingår 3 | "Historikkontroll" – "Ägarhistorik, skador, miltal och service – granskat innan erbjudande." |
| Ingår 4 | "Ränteförhandling" – "Vi jämför finansiering och pressar räntan mot flera aktörer." |
| Ingår 5 | "Inbytesvärdering" – "Om du byter in en bil hämtar vi konkurrerande bud." |
| Ingår 6 | "Leverans hem" – "Vi kan koordinera hemleverans utan att du behöver besöka handlaren." |
| FAQ 1 Q | "Kostar det något att använda Biltos köptjänst?" |
| FAQ 1 A | "Ja – tjänsten kostar 4 995 kr och betalas bara om affären faktiskt blir av. Inget köp, ingen kostnad. Snittbesparingen vi förhandlar fram är 18 000 kr per affär, så de flesta kunder tjänar mångfalt mer än de betalar." |
| FAQ 2 Q | "Kan ni hjälpa mig om jag redan hittat en bil?" |
| FAQ 2 A | "Absolut. Det är faktiskt ett av de vanligaste fallen. Du skickar länken, vi granskar historik, kontrollerar att priset är rimligt och förhandlar sedan med säljaren åt dig." |
| FAQ 3 Q | "Hur lång tid tar det?" |
| FAQ 3 A | "De flesta kunder har ett klart erbjudande inom 3–7 dagar. Om du redan hittat en specifik bil kan det gå snabbare, ibland inom 24 timmar." |
| FAQ 4 Q | "Vad händer om ingen bil passar mig?" |
| FAQ 4 A | "Ingenting. Det finns inga förpliktelser. Du tackar enkelt nej – och om du vill fortsöka justerar vi kriterierna. Du betalar inget om ingen affär görs." |
| FAQ 5 Q | "Kan ni hjälpa till med inbytesbil?" |
| FAQ 5 A | "Ja. Vi hanterar hela bytesaffären – värderar din bil, inhämtar konkurrerande bud från handlare och säkerställer att inbytesvärdet är marknadsmässigt." |
| CTA rubrik | "Redo att köpa bil med en expert?" |
| CTA primär | "Starta din förfrågan" |
| CTA sekundär | "Ring oss: 08-5555 0200" |

---

### 1.3 Beställ bilköpshjälp (`/kop-bil/bestall`)

**Komponent:** `BuyCarPage` – flerstegs-wizard

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                         [Kostnadsfri    │
│                                       konsultation]  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Progress bar: [████░░░░░░] 2/4                       │
│                                                       │
│  STEG 1: VAD BEHÖVER DU HJÄLP MED?                    │
│  ┌──────────────────────┐ ┌──────────────────────┐   │
│  │ Jag har hittat en bil │ │ Jag vet vilken jag   │   │
│  │                       │ │ vill ha              │   │
│  └──────────────────────┘ └──────────────────────┘   │
│  ┌──────────────────────┐ ┌──────────────────────┐   │
│  │ Jag letar efter en    │ │ Jag vill byta bil   │   │
│  │ bil                   │ │                     │   │
│  └──────────────────────┘ └──────────────────────┘   │
│  ┌──────────────────────┐                            │
│  │ Vet inte – vi guidar │ → (öppnar guidance-modal)  │
│  └──────────────────────┘                            │
│                                                       │
│  FAQ (BuyFlowFAQ accordion)                           │
│                                                       │
│  ─── STEG 2: BERÄTTA OM BILEN/SÖKET ───              │
│  Märke/modell: [_______________]                     │
│  Budget: [_______________]                            │
│  Länk till annons: [_______________]                 │
│  Övrigt: [_______________]                           │
│  [Tillbaka]  [Nästa →]                               │
│                                                       │
│  ─── STEG 3: INBYTESBIL ───                           │
│  Har du inbytesbil? [Ja] [Nej]                       │
│  (om Ja: RegInput + låne-fråga)                      │
│  [Tillbaka]  [Nästa →]                               │
│                                                       │
│  ─── STEG 4: DINA UPPGIFTER ───                      │
│  Namn: [_______________]                             │
│  Telefon: [_______________]                          │
│  E-post: [_______________]                           │
│  Önskad tid: [välj ▾]                                │
│  [Tillbaka]  [Skicka förfrågan]                      │
│                                                       │
│  ─── BEKRÄFTELSE ───                                  │
│  "Tack! Vi hör av oss inom 24 timmar."               │
│  [Expert-kort med foto]                              │
│  [Ring oss direkt: 08-5555 0200]                     │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Floating "Ring oss" pill (vid scroll)               │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Steg 1 rubrik | "Vad behöver du hjälp med?" |
| Steg 1 alt 1 | "Jag har hittat en bil" |
| Steg 1 alt 2 | "Jag vet vilken bil jag vill ha" |
| Steg 1 alt 3 | "Jag letar efter en bil" |
| Steg 1 alt 4 | "Jag vill byta bil" |
| Steg 1 alt 5 | "Vet inte – vi guidar dig" |
| Steg 2 rubrik | "Berätta om bilen" / "Berätta om söket" |
| Steg 3 rubrik | "Inbytesbil" |
| Steg 3 fråga | "Har du en bil du vill byta in?" |
| Steg 4 rubrik | "Dina uppgifter" |
| Steg 4 CTA | "Skicka förfrågan" |
| Bekräftelse | "Tack! Vi hör av oss inom 24 timmar." |
| Bekräftelse CTA | "Ring oss direkt: 08-5555 0200" |
| Floating CTA | "Ring oss" |

**Guidance-modal (när man väljer "Vet inte"):**

```
┌───────────────────────────────┐
│  Vi ringer dig upp        ✕   │
│                               │
│  Namn: [_______________]      │
│  Telefon: [_______________]   │
│  E-post: [_______________] (friv.)│
│                               │
│  [Ring upp mig]               │
│                               │
│  (efter submit:)              │
│  "Tack! Vi ringer dig snart." │
│  [Klar]                       │
└───────────────────────────────┘
```

---

### 1.4 Sälj bil (`/salj-bil`)

**Komponent:** `HowItWorks` (seoSlug="salj-bil")

Samma layout som startsidan men med sälj-fliken som aktiv och SEO-rubrik anpassad.

**Copy:**

| Element | Text |
|---------|------|
| Sidtitel | "Sälj din bil snabbt – handlare konkurrerar om priset \| Bilto" |
| Meta-beskrivning | "Sälj bilen via Bilto och få bud från granskade bilhandlare. Gratis värdering, fri upphämtning och pengarna direkt på kontot." |
| Hero rubrik | "Sälj din bil till bästa pris" |
| CTA | "Värdera bilen" |

---

### 1.5 Sälj-flödet (`/` → `SellCarPage`)

**Komponent:** `SellCarPage` – 5-stegs formulär

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                         [Kostnadsfri    │
│                                       konsultation]  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ← Tillbaka                                           │
│  Progress: [██████░░░░] 3/5                          │
│                                                       │
│  STEG 1: OM DIN BIL                                   │
│  Regnummer: [ABC123]                                 │
│  Märke: [Volvo]                                      │
│  Modell: [XC60]                                     │
│  Årsmodell: [2020]                                  │
│  Miltal: [____]                                      │
│  Skick: [välj ▾] (Som ny / Bra / Godkänt / Sliten)  │
│  Skick-kommentar: [_______________]                  │
│  Vill du byta in? [Ja] [Nej]                         │
│  [Nästa →]                                           │
│                                                       │
│  STEG 2: UTRUSTNING OCH TILLVAL                       │
│  Checkboxar:                                          │
│  ☐ Dragkrok  ☐ GPS  ☐ Värme i säten                  │
│  ☐ Panoramatatak  ☐ Läder  ☐ Apple CarPlay           │
│  ☐ Adaptiv farthållare  ☐ Parkeringsassist           │
│  ...fler...                                           │
│  [Tillbaka]  [Nästa →]                               │
│                                                       │
│  STEG 3: BILDER AV BILEN                              │
│  [Ladda upp bilder]                                  │
│  Fotoguide (klicka för tips)                         │
│  [Tillbaka]  [Nästa →]                               │
│                                                       │
│  STEG 4: DINA UPPGIFTER                              │
│  Namn: [_______________]                             │
│  Telefon: [_______________]                          │
│  E-post: [_______________]                           │
│  [Tillbaka]  [Nästa →]                               │
│                                                       │
│  STEG 5: BEKRÄFTA                                     │
│  Sammanfattning av bil + uppgifter                   │
│  [Tillbaka]  [Skicka in]                             │
│                                                       │
│  (efter submit:)                                      │
│  "Tack! Din bil är nu registrerad."                  │
│  "Vi skickar bud från handlare inom 24h."            │
│  [Gå hem]                                            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Steg 1 rubrik | "Om din bil" |
| Steg 2 rubrik | "Utrustning och tillval" |
| Steg 3 rubrik | "Bilder av bilen" |
| Steg 4 rubrik | "Dina uppgifter" |
| Steg 5 rubrik | "Bekräfta" |
| Bekräftelse | "Tack! Din bil är nu registrerad. Vi skickar bud från handlare inom 24 timmar." |

---

### 1.6 Så funkar det (`/sa-funkar-det`)

**Komponent:** `HowItWorks` (seoSlug="sa-funkar-det")

Samma layout som startsidan men med SEO-titel anpassad.

**Copy:**

| Element | Text |
|---------|------|
| Sidtitel | "Så funkar Bilto – sälj eller köp bil med expert" |
| Meta-beskrivning | "Se hur Bilto hjälper dig sälja bilen till bästa pris eller köpa rätt bil med en dedikerad expert. Gratis värdering – ingen bindning." |

---

### 1.7 Bilspara (`/bilspara`)

**Komponent:** `BilsparaPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]  Sälj bil | Bilköpshjälpen | Priser | Bilspara│
│                                    [Kostnadsfri      │
│                                     konsultation]    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  HERO                                                 │
│  "Bilspara – bilar med stor besparing"              │
│  [Sök kampanjbilar...] [Sök]                         │
│                                                       │
│  Quick picks:                                         │
│  [El-boom] [Miljöklipp] [Familjebil] [Lyxdeal] [Blixt]│
│                                                       │
├─────────────────────────┬───────────────────────────┤
│  FILTERPANEL             │  RESULTAT                 │
│                          │                           │
│  Mode: [Alla|Köp|Leasing]│  Sortera: [▾]             │
│                          │                           │
│  Minsta besparing         │  ┌──────┐ ┌──────┐       │
│  [━━━●━━] 30 000 kr      │  │ Bil  │ │ Bil  │       │
│                          │  │ bild │ │ bild │       │
│  ☐ Visa bara elbilar     │  │ Namn │ │ Namn │       │
│  ☐ Ingår i köpet         │  │ Spar │ │ Spar │       │
│                          │  │ [CTA]│ │ [CTA]│       │
│  Kampanjtyp:             │  └──────┘ └──────┘       │
│  [Demobil] [Lagerrensning]│  ┌──────┐ ┌──────┐       │
│  [Nybilskampanj]         │  │ ...  │ │ ...  │       │
│                          │  └──────┘ └──────┘       │
│  Märken:                 │                           │
│  [Sök märke...]          │                           │
│  [Volvo] [BMW] [Audi]    │                           │
│  [Visa alla (N)]         │                           │
│                          │                           │
│  Drivmedel:              │                           │
│  [El] [Hybrid] [Laddhyb.]│                           │
│  [Bensin] [Diesel]       │                           │
│                          │                           │
│  Karosseri:              │                           │
│  [SUV] [Kombi] [Sedan]   │                           │
│  [Hatchback] [Cab]       │                           │
│                          │                           │
│  Maxpris:                │                           │
│  [━━━●━━] 500 000 kr     │                           │
│                          │                           │
│  [Rensa]                 │                           │
│                          │                           │
├─────────────────────────┴───────────────────────────┤
│  🔔 [Spara sökavisering]                              │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Hero rubrik | "Bilspara – bilar med stor besparing" |
| Sök placeholder | "Sök kampanjbilar…" |
| Quick pick 1 | "El-boom" |
| Quick pick 2 | "Miljöklipp" |
| Quick pick 3 | "Familjebil" |
| Quick pick 4 | "Lyxdeal" |
| Quick pick 5 | "Blixt" |
| Filter mode | "Alla / Köp / Leasing" |
| Filter label 1 | "Minsta besparing" |
| Filter label 2 | "Visa bara elbilar" |
| Filter label 3 | "Ingår i köpet" |
| Filter label 4 | "Kampanjtyp" |
| Filter label 5 | "Märken" |
| Filter label 6 | "Drivmedel" |
| Filter label 7 | "Karosseri" |
| Filter label 8 | "Maxpris" |
| Rensa | "Rensa" / "Rensa alla filter" |
| Visa alla | "Visa alla (N)" / "Visa färre" |
| Spara avisering | "Spara sökavisering" |

---

### 1.8 Priser (`/priser`)

**Komponent:** `PriserPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]  Sälj bil | Bilköpshjälpen | Priser | Bilspara│
│                                    [Kostnadsfri      │
│                                     konsultation]    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Priser"                                             │
│  "En fast avgift. Inga överraskningar."              │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │  Privatperson                    │                 │
│  │  4 995 kr                        │                 │
│  │  "Betalas bara om affären blir av"│                 │
│  │  ✓ Förhandling                   │                 │
│  │  ✓ Granskning                    │                 │
│  │  ✓ All administration            │                 │
│  │  [Kom igång →]                   │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │  Bilhandlare                     │                 │
│  │  "Bli en granskad Bilto-handlare"│                 │
│  │  ✓ Tillgång till budgivning      │                 │
│  │  ✓ Egna kampanjer                 │                 │
│  │  ✓ Statistik & CRM               │                 │
│  │  [Registrera dig →]              │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Sidtitel | "Priser" |
| Undertext | "En fast avgift. Inga överraskningar." |
| Privat kort | "4 995 kr" / "Betalas bara om affären blir av" |
| Privat punkter | "Förhandling", "Granskning", "All administration" |
| Privat CTA | "Kom igång" |
| Handlare kort | "Bli en granskad Bilto-handlare" |
| Handlare punkter | "Tillgång till budgivning", "Egna kampanjer", "Statistik & CRM" |
| Handlare CTA | "Registrera dig" |

---

### 1.9 Vanliga frågor (`/vanliga-fragor`)

**Komponent:** `VanligaFragorPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]  Sälj bil | Bilköpshjälpen | Priser | Bilspara│
│                                    [Kostnadsfri      │
│                                     konsultation]    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Vanliga frågor"                                     │
│                                                       │
│  Grupp 1: Om Bilto                                    │
│  ▸ Vad är Bilto?                                      │
│  ▸ Vad kostar det?                                    │
│  ▸ Hur funkar det?                                    │
│  ▸ Är ni opartiska?                                   │
│  ▸ Vad händer om jag inte är nöjd?                    │
│                                                       │
│  Grupp 2: Sälja bil                                   │
│  ▸ Hur säljer jag min bil?                            │
│  ▸ När får jag buden?                                 │
│  ▸ Vad händer om inget bud är bra?                    │
│  ▸ Måste jag sälja?                                   │
│                                                       │
│  Grupp 3: Köpa bil                                    │
│  ▸ Kan ni hjälpa mig hitta en bil?                    │
│  ▸ Hur lång tid tar det?                              │
│  ▸ Kan ni förhandla på en bil jag hittat?            │
│  ▸ Vad händer om säljaren säger nej?                  │
│  ▸ Kan ni hjälpa till med inbyte?                     │
│                                                       │
├─────────────────────────────────────────────────────┤
│  CTA: "Hittade du inte svaret?"                      │
│  [Kostnadsfri konsultation]                           │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Sidtitel | "Vanliga frågor" |
| CTA rubrik | "Hittade du inte svaret?" |
| CTA knapp | "Kostnadsfri konsultation" |

---

### 1.10 Guider (`/guider`, `/guider/[slug]`)

**Komponent:** `GuidePage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]  Sälj bil | Bilköpshjälpen | Priser | Bilspara│
├─────────────────────────────────────────────────────┤
│                                                       │
│  LISTA:                                               │
│  "Guider"                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │ Guide 1│ │ Guide 2│ │ Guide 3│                   │
│  │ bild   │ │ bild   │ │ bild   │                   │
│  │ titel  │ │ titel  │ │ titel  │                   │
│  │ [Läs]  │ │ [Läs]  │ │ [Läs]  │                   │
│  └────────┘ └────────┘ └────────┘                   │
│                                                       │
│  ENSKILD GUIDE:                                       │
│  ← Tillbaka till guider                              │
│  [Rubrik]                                             │
│  [Brödtext...]                                        │
│  [CTA: Kostnadsfri konsultation]                     │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

---

### 1.11 Om oss (`/om-oss`)

**Komponent:** `AboutPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]  Sälj bil | Bilköpshjälpen | Priser | Bilspara│
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Om Bilto"                                           │
│  [Berättelse om företaget]                           │
│                                                       │
│  Grundare-sektion:                                    │
│  ┌──────────────┐                                    │
│  │ [Foto]        │                                    │
│  │ Alexander (VD)│                                    │
│  │ Citat         │                                    │
│  └──────────────┘                                    │
│                                                       │
│  CTA: [Kom igång] / [Kontakta oss]                   │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

---

### 1.12 Integritetspolicy & Användarvillkor

**Komponenter:** `PrivacyPage`, `TermsPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]                                               │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Integritetspolicy" / "Användarvillkor"             │
│  [Juridisk brödtext...]                              │
│  ← Tillbaka hem                                       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 1.13 Webbplatskarta (`/webbplatskarta`)

**Komponent:** `WebbplatskartaPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto]                                               │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Webbplatskarta"                                     │
│  Lista över alla sidor och länkar                    │
│  ← Tillbaka                                            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 1.14 SEO-sidor

#### Topic-sidor (`/forhandla-bil`, `/bilkopshjalp`, `/spara-pengar-bilkop`, etc.)

**Komponent:** `SeoTopicPage`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto nav]                                           │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [SEO-rubrik för topic]                               │
│  [SEO-brödtext]                                       │
│                                                       │
│  Sälj-form:                                           │
│  Regnummer [___]  [Värdera →]                        │
│                                                       │
│  CTA: [Kostnadsfri konsultation]                     │
│  ← Tillbaka                                            │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

7 topic-sidor: `forhandla-bil`, `bilkopshjalp`, `spara-pengar-bilkop`, `sank-manadskostnad-bil`, `byta-bil`, `bilradgivare`, `gratis-bilvardering`.

#### Stad-sidor (`/salj-din-bil-i-[stad]`)

**Komponent:** `SeoLandingPage` (type=city)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto nav]                                           │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Sälj din bil i [Stad]"                             │
│  [Lokal SEO-text]                                     │
│  Regnummer [___]  [Värdera →]                        │
│  ← Tillbaka                                            │
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

#### Märke-sidor (`/salj-din-[marke]`)

**Komponent:** `SeoLandingPage` (type=brand)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto nav]                                           │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Sälj din [Märke]"                                   │
│  [Märkes-specifik SEO-text]                          │
│  Regnummer [___]  [Värdera →]                        │
│  ← Tillbaka                                            │
│  Footer                                               │
└─────────────────────────────────────────────────────┘
```

---

## 2. KUNDPORTAL

### 2.1 Kundlogin (`/logga-in`)

**Komponent:** `CustomerLogin`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Logga in"                                           │
│  E-post: [_______________]                           │
│  Lösenord: [_______________]                         │
│  [Logga in]                                           │
│  [Glömt lösenord?]                                   │
│  ← Tillbaka till startsidan                          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Rubrik | "Logga in" |
| Fält 1 | "E-post" |
| Fält 2 | "Lösenord" |
| CTA | "Logga in" |
| Länk | "Glömt lösenord?" |
| Tillbaka | "Tillbaka till startsidan" |

---

### 2.2 Kundöversikt (`/mina-bilar`)

**Komponent:** `CustomerDashboard`

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                              [Logga ut] │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Mina bilar"                                         │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │ [Bil-bild]                       │                 │
│  │ Volvo XC60 2020                  │                 │
│  │ Status: Bud inkomna (3 st)       │                 │
│  │ Högsta bud: 285 000 kr           │                 │
│  │ [Visa bud →]                     │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │ [Bil-bild]                       │                 │
│  │ BMW 3-serie 2019                │                 │
│  │ Status: Såld                     │                 │
│  │ Slutpris: 220 000 kr             │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │ Förfrågan: Köp av Tesla Model Y │                 │
│  │ Status: Expert arbetar          │                 │
│  │ [Visa förfrågan →]               │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Rubrik | "Mina bilar" |
| Bil-kort CTA | "Visa bud" / "Visa förfrågan" |
| Logga ut | "Logga ut" |

---

### 2.3 Min bil (`/min-bil/[token]`)

**Komponent:** `MyCarPage` (token-autentiserad)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ← Tillbaka                                            │
│                                                       │
│  "Volvo XC60 2020"                                   │
│  Reg: ABC123 · 12 000 mil                            │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │ Bud från handlare                 │                 │
│  │                                   │                 │
│  │ 1. Bilfirma AB     285 000 kr  ✓  │                 │
│  │ 2. Motor AB        270 000 kr     │                 │
│  │ 3. Auto AB         265 000 kr     │                 │
│  │                                   │                 │
│  │ [Acceptera bud] [Avböj]          │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
│  [Expert-kort: foto + namn]                          │
│  [Ring expert: 08-5555 0200]                         │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 2.4 Min förfrågan (`/min-forfragan/[token]`)

**Komponent:** `MyQuotePage` (token-autentiserad)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ← Tillbaka                                            │
│                                                       │
│  "Min förfrågan"                                      │
│  "Köp av Tesla Model Y"                              │
│                                                       │
│  Status: Expert arbetar åt dig                       │
│                                                       │
│  ┌─────────────────────────────────┐                 │
│  │ Erbjudande 1                      │                 │
│  │ Tesla Model Y 2023                │                 │
│  │ Pris: 459 000 kr                  │                 │
│  │ [Acceptera] [Avböj]              │                 │
│  └─────────────────────────────────┘                 │
│                                                       │
│  [Expert-kort: foto + namn]                          │
│  [Ring: 08-5555 0200]                                │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 2.5 Portal callback (`/portal`)

**Komponent:** `PortalCallbackPage`

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  "Verifierar..."                                      │
│  (vid framgång → omdirigering till /mina-bilar)      │
│  (vid fel → "Något gick fel" + [Tillbaka])           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 2.6 Välj lösenord (`/valj-losenord`)

**Komponent:** `SetPasswordPage` (recovery-läge för kunder)

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  "Välj nytt lösenord"                                 │
│  Nytt lösenord: [_______________]                   │
│  Bekräfta: [_______________]                        │
│  [Spara]                                              │
│  → omdirigering till /mina-bilar                     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 3. HANDLARPORTAL

### 3.1 Handlare login (`/handlare/logga-in`)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Logga in som handlare"                              │
│  E-post: [_______________]                           │
│  Lösenord: [_______________]                         │
│  [Logga in]                                           │
│  [Registrera dig]                                     │
│  ← Tillbaka                                           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Rubrik | "Logga in som handlare" |
| CTA | "Logga in" |
| Länk | "Registrera dig" |
| Tillbaka | "Tillbaka" |

---

### 3.2 Handlare registrering (`/handlare/registrera`)

**Komponent:** `DealerRegister` (mode=landing)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Bli en Bilto-handlare"                              │
│  "Få tillgång till budgivning och kunder"           │
│                                                       │
│  ✓ Tillgång till auktioner och bud                   │
│  ✓ Egna kampanjer och erbjudanden                    │
│  ✓ Statistik och CRM-verktyg                         │
│  ✓ Integrationer med Blocket m.m.                   │
│                                                       │
│  [Ansök nu →]                                         │
│  ← Tillbaka                                           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 3.3 Handlare ansökan (`/handlare/ansok`)

**Komponent:** `DealerRegister` (mode=form)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Företagsuppgifter:                                   │
│  Företagsnamn: [_______________]                    │
│  Org.nr: [_______________]                           │
│  Adress: [_______________]                           │
│  Stad: [_______________]                             │
│  Postnr: [_______________]                           │
│                                                       │
│  Kontaktperson:                                       │
│  Namn: [_______________]                             │
│  Telefon: [_______________]                          │
│  E-post: [_______________]                           │
│                                                       │
│  [Skicka ansökan]                                     │
│  ← Tillbaka                                           │
│                                                       │
│  (efter submit:)                                      │
│  "Tack! Vi granskar din ansökan och hör av oss      │
│   inom 24 timmar."                                    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 3.4 Handlare-portalen (inloggad)

Alla sidor delar `DealerShell` med sidomeny.

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  INNEHÅLL                                 │
│          │                                            │
│ Översikt │                                            │
│ Bilar    │                                            │
│ Kampanjer│                                            │
│ Leads    │                                            │
│ Statistik│                                            │
│ Integrat.│                                            │
│ Profil   │                                            │
│ ───────  │                                            │
│ Logga ut │                                            │
└──────────┴──────────────────────────────────────────┘
```

#### 3.4.1 Översikt (`/handlare/oversikt`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  "Översikt"                               │
│          │                                            │
│ ●Översikt│  Statistik-kort:                          │
│  Bilar   │  ┌──────┐ ┌──────┐ ┌──────┐             │
│  Kampanj │  │ Aktiva│ │ Vunna│ │ Intäk│             │
│  Leads   │  │ bilar │ │ bud  │ │ ter   │             │
│  Stat.   │  │  12   │ │  3   │ │ 85k  │             │
│  Integ.  │  └──────┘ └──────┘ └──────┘             │
│  Profil  │                                            │
│          │  "Mina aktiva bilar"                      │
│ Logga ut │  ┌────────────────────────────┐           │
│          │  │ [Bild] Volvo XC60 2020     │           │
│          │  │ Bud: 3 st  Högsta: 285k   │           │
│          │  │ [Öppna →]                  │           │
│          │  └────────────────────────────┘           │
│          │                                            │
│          │  [+ Lägg till bil]                         │
│          │  [Lager-sync] [Inställningar]             │
└──────────┴──────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Rubrik | "Översikt" |
| Stat 1 | "Aktiva bilar" |
| Stat 2 | "Vunna bud" |
| Stat 3 | "Intäkter" |
| Lista rubrik | "Mina aktiva bilar" |
| CTA 1 | "Lägg till bil" |
| CTA 2 | "Lager-sync" |
| CTA 3 | "Inställningar" |

---

#### 3.4.2 Bilar (`/handlare/bilar`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  "Mina bilar"                             │
│          │                                            │
│  Översikt│  [+ Lägg till bil]                         │
│ ●Bilar   │                                            │
│  Kampanj │  Tabell:                                   │
│  Leads   │  ┌──────┬──────┬──────┬──────┐           │
│  ...     │  │ Bild │ Namn │ Bud  │ Status│           │
│          │  ├──────┼──────┼──────┼──────┤           │
│          │  │ [img]│ XC60 │ 3 st │ Aktiv │           │
│          │  │ [img]│ BMW  │ 0 st │ Ny   │           │
│          │  └──────┴──────┴──────┴──────┘           │
│          │  [Öppna bil →]                            │
└──────────┴──────────────────────────────────────────┘
```

---

#### 3.4.3 Lägg till bil (`/handlare/bilar/ny`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  "Lägg till bil"                          │
│          │                                            │
│          │  Regnummer: [ABC123]                      │
│          │  Märke: [_______________]                  │
│          │  Modell: [_______________]                 │
│          │  Årsmodell: [____]                        │
│          │  Miltal: [____]                           │
│          │  Pris: [____]                             │
│          │  Bilder: [Ladda upp]                      │
│          │  [Spara]  ← Tillbaka                       │
│          │                                            │
└──────────┴──────────────────────────────────────────┘
```

---

#### 3.4.4 Bil-detalj (`/handlare/bilar/[id]`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  ← Tillbaka                                │
│          │                                            │
│          │  [Bil-bild galleri]                        │
│          │  "Volvo XC60 2020"                        │
│          │  Reg: ABC123 · 12 000 mil                 │
│          │  Pris: 295 000 kr                         │
│          │                                            │
│          │  Bud-historik:                             │
│          │  ┌──────────────────────────┐             │
│          │  │ Motor AB   270 000 kr    │             │
│          │  │ Auto AB    265 000 kr    │             │
│          │  └──────────────────────────┘             │
│          │                                            │
│          │  [Redigera] [Ta bort]                    │
└──────────┴──────────────────────────────────────────┘
```

---

#### 3.4.5 Kampanjer (`/handlare/kampanjer`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  "Kampanjer"                               │
│          │                                            │
│          │  [+ Ny kampanj]                            │
│          │  [Kostnadsbyggare]                        │
│          │                                            │
│          │  Aktiva kampanjer:                         │
│          │  ┌──────────────────────┐                 │
│          │  │ "Sommarrea elbilar"   │                 │
│          │  │ 5 bilar · aktiv       │                 │
│          │  └──────────────────────┘                 │
│          │  ┌──────────────────────┐                 │
│          │  │ "Lagerrensning"       │                 │
│          │  │ 12 bilar · aktiv      │                 │
│          │  └──────────────────────┘                 │
└──────────┴──────────────────────────────────────────┘
```

---

#### 3.4.6 Leads (`/handlare/leads-b`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  "Leads"                                  │
│          │                                            │
│          │  Tabell:                                   │
│          │  ┌──────┬──────┬──────┬──────┐           │
│          │  │ Namn │ Bil  │ Datum│ Status│           │
│          │  ├──────┼──────┼──────┼──────┤           │
│          │  │ Anna │ XC60 │ 2/8  │ Ny    │           │
│          │  │ Erik │ BMW  │ 1/8  │ Kont. │           │
│          │  └──────┴──────┴──────┴──────┘           │
│          │  [Öppna lead →]                          │
└──────────┴──────────────────────────────────────────┘
```

---

#### 3.4.7 Statistik (`/handlare/statistik`)

```
┌──────────┬──────────────────────────────────────────┐
│ SIDOMENY │  "Statistik"                               │
│          │                                            │
│          │  ┌──────┐ ┌──────┐ ┌──────┐             │
│          │  │ Bud  │ │ Vinst│ │ Konv │             │
│          │  │ rate │ │      │ │ rate │             │
│          │  └──────┘ └──────┘ └──────┘             │
│          │                                            │
│          │  [Diagram: bud över tid]                  │
│          │  [Diagram: vunna/förlorade]               │
└──────────┴──────────────────────────────────────────┘
```

---

#### 3.4.8 Övriga handlar-sidor

| Sida | Sökväg | Innehåll |
|------|--------|---------|
| Inställningar | `/handlare/installningar` | Företagsuppgifter, notifikationer, lösenord |
| Lager-sync | `/handlare/lager` | Integration med Blocket, auto-sync inställningar |
| Integrationer | `/handlare/integrationer` | API-nycklar, Blocket, export |
| Profil | `/handlare/profil` | Offentlig profil, logga, beskrivning |
| Värderings-leads | `/handlare/vardering-leads` | Inkomna värderingsförfrågningar |
| Godkännanden | `/handlare/godkannanden` | Väntande medlemmar som behöver godkännas |
| Åtgärder | `/handlare/atgarder` | Att-göra-lista för handlaren |
| Ärenden | `/handlare/arenden` | Aktiva ärenden/kundfrågor |
| Mitt lager | `/handlare/mitt-lager` | Lageröversikt med filtrering |
| Ekonomi | `/handlare/ekonomi` | Fakturor, intäkter, kostnader |
| Provisioner | `/handlare/provisioner` | Provisionsspecifikationer |

---

## 4. ADMIN-PORTALEN

### 4.1 Admin login (`/admin`)

```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]                                          │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Admin-logga in"                                     │
│  E-post: [_______________]                           │
│  Lösenord: [_______________]                         │
│  [Logga in]                                           │
│  ← Tillbaka                                           │
│                                                       │
│  (om ej admin:)                                       │
│  "Ingen behörighet"                                   │
│  "Ditt konto har inte administratörsrättigheter."    │
│  [Logga ut]                                           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Copy:**

| Element | Text |
|---------|------|
| Rubrik | "Admin-logga in" |
| Ej behörighet rubrik | "Ingen behörighet" |
| Ej behörighet text | "Ditt konto har inte administratörsrättigheter." |

---

### 4.2 Admin-portalen (inloggad)

Alla sidor delar admin-navigation.

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  INNEHÅLL                                 │
│          │                                            │
│ Översikt │                                            │
│ Leads    │                                            │
│ Handlare │                                            │
│ Katalog  │                                            │
│ Bokningar│                                            │
│ Handlarp.│                                            │
│          │                                            │
│ Logga ut │                                            │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.1 Översikt (`/admin/oversikt`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  "Översikt"                                │
│          │                                            │
│ ●Översikt│  KPI-kort:                                 │
│  Leads   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  Handlare│  │ Nya  │ │ Akti-│ │ Vänt │ │ Intäk│    │
│  Katalog │  │ leads│ │ va   │ │ ande │ │ ter   │    │
│  Bokning │  │  23  │ │ bilar│ │ handl│ │ 1.2M │    │
│  Handl.p.│  └──────┘ └──────┘ └──────┘ └──────┘    │
│          │                                            │
│          │  Senaste aktivitet:                        │
│          │  ┌──────────────────────────────┐         │
│          │  │ Ny bil: Volvo XC60 · 2 min   │         │
│          │  │ Ny lead: Anna · 1 tim        │         │
│          │  │ Ny handlare: Motor AB · 2h  │         │
│          │  └──────────────────────────────┘         │
│          │                                            │
│          │  [Öppna bil] [Öppna lead]                │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.2 Leads / Lead Command Center (`/admin/leads`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  "Lead Command Center"                    │
│          │                                            │
│  Översikt│  Filter: [Alla] [Nya] [Aktiva] [Stängda]  │
│ ●Leads   │                                            │
│  Handlare│  Tabell:                                   │
│  Katalog │  ┌──────┬──────┬──────┬──────┬──────┐    │
│  ...     │  │ Namn │ Typ  │ Bil  │ Datum│ Status│    │
│          │  ├──────┼──────┼──────┼──────┼──────┤    │
│          │  │ Anna │ Sälj │ XC60 │ 2/8  │ Ny    │    │
│          │  │ Erik │ Köp  │ BMW  │ 1/8  │ Aktiv │    │
│          │  │ ...  │      │      │      │       │    │
│          │  └──────┴──────┴──────┴──────┴──────┘    │
│          │  [Öppna lead →]                           │
│          │                                            │
│          │  CRM-aktivitet panel                      │
│          │  Påminnelser & uppgifter                  │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.3 Bilar (`/admin/bilar`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  "Bilar"                                   │
│          │                                            │
│  Översikt│  [+ Ny bil] [Bulk-uppladdning] [Katalog]  │
│ ●Bilar   │                                            │
│  Handlare│  Tabell:                                   │
│  Katalog │  ┌──────┬──────┬──────┬──────┬──────┐    │
│  ...     │  │ Bild │ Namn │ Kund │ Bud  │ Status│    │
│          │  ├──────┼──────┼──────┼──────┼──────┤    │
│          │  │ [img]│ XC60 │ Anna │ 3 st │ Aktiv │    │
│          │  │ [img]│ BMW  │ Erik │ 0 st │ Ny    │    │
│          │  └──────┴──────┴──────┴──────┴──────┘    │
│          │  [Öppna bil →]                            │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.4 Bil-detalj admin (`/admin/bilar/[id]`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  ← Tillbaka                                │
│          │                                            │
│  Översikt│  [Bil-bild galleri]                        │
│ ●Bilar   │  "Volvo XC60 2020"                        │
│  Handlare│  Reg: ABC123 · 12 000 mil                 │
│  ...     │  Kund: Anna Andersson                     │
│          │                                            │
│          │  Bud:                                     │
│          │  ┌──────────────────────────────┐         │
│          │  │ Motor AB   285 000 kr  [Godk]│         │
│          │  │ Auto AB    270 000 kr        │         │
│          │  └──────────────────────────────┘         │
│          │                                            │
│          │  [+ Nytt förslag till handlare]           │
│          │  [Redigera] [Ta bort]                     │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.5 Förfrågan-detalj (`/admin/forfragningar/[id]`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  ← Tillbaka                                │
│          │                                            │
│  Översikt│  "Förfrågan: Köp av Tesla Model Y"        │
│ ●Leads   │  Kund: Erik Eriksson                      │
│  Handlare│  Status: Aktiv                            │
│  ...     │                                            │
│          │  [Nytt erbjudande →]                      │
│          │  [Konvertera till bil →]                  │
│          │                                            │
│          │  Erbjudanden:                              │
│          │  ┌──────────────────────────┐             │
│          │  │ Erbjudande 1 · 459 000 kr│             │
│          │  └──────────────────────────┘             │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.6 Erbjudande-editor (`/admin/erbjudanden/[id]`, `/admin/erbjudanden/nytt/[id]`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  "Redigera erbjudande"                     │
│          │                                            │
│          │  Bil: [välj ▾]                            │
│          │  Pris: [_______]                          │
│          │  Inbytesvärde: [_______]                 │
│          │  Ränta: [_______]                        │
│          │  Kommentarer: [_______________]           │
│          │                                            │
│          │  [Spara]  ← Tillbaka                       │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.7 Handlare (`/admin/handlare`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  "Handlare"                                │
│          │                                            │
│  Översikt│  Filter: [Alla] [Godkända] [Väntande]     │
│  Leads   │                                            │
│ ●Handlare│  Tabell:                                   │
│  Katalog │  ┌──────────┬──────┬──────┬──────┐       │
│  ...     │  │ Företag  │ Stad │ Bilar│ Status│       │
│          │  ├──────────┼──────┼──────┼──────┤       │
│          │  │ Motor AB │ Sthlm│ 12   │ Godk. │       │
│          │  │ Auto AB  │ Gbg  │ 5    │ Vänt. │       │
│          │  └──────────┴──────┴──────┴──────┘       │
│          │  [Öppna handlare →]                       │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.8 Handlare-detalj (`/admin/handlare/[id]`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  ← Tillbaka                                │
│          │                                            │
│  Översikt│  "Motor AB"                                │
│  Leads   │  Org.nr: 556677-8899                      │
│ ●Handlare│  Status: [Godkänd ✓] / [Godkänn]          │
│  Katalog │                                            │
│  ...     │  Statistik:                                │
│          │  Aktiva bilar: 12                          │
│          │  Vunna bud: 8                              │
│          │  Intäkter: 850 000 kr                      │
│          │                                            │
│          │  Medlemmar:                                │
│          │  ┌──────────────────────┐                 │
│          │  │ erik@motorab.se  Ägare│                 │
│          │  │ sara@motorab.se  Medl │                 │
│          │  └──────────────────────┘                 │
│          │                                            │
│          │  [Godkänn handlare] [Inaktivera]           │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.9 Katalog (`/admin/katalog`)

```
┌──────────┬──────────────────────────────────────────┐
│ NAV      │  "Bilkatalog"                              │
│          │                                            │
│  Översikt│  [Importera] [Uppdatera priser]           │
│  Leads   │                                            │
│  Handlare│  Sök: [Sök märke/modell...]               │
│ ●Katalog │                                            │
│  Bokning │  Tabell:                                   │
│  ...     │  ┌──────┬──────┬──────┬──────┐           │
│          │  │ Märke│ Modell│ Pris │ Bild │           │
│          │  ├──────┼──────┼──────┼──────┤           │
│          │  │ Volvo│ XC60 │ 499k │ [img]│           │
│          │  │ Tesla│ M Y  │ 549k │ [img]│           │
│          │  └──────┴──────┴──────┴──────┘           │
└──────────┴──────────────────────────────────────────┘
```

---

#### 4.2.10 Övriga admin-sidor

| Sida | Sökväg | Innehåll |
|------|--------|---------|
| Ny bil | `/admin/bilar/ny` | Formulär för att lägga till bil manuellt |
| Bulk-uppladdning | `/admin/uppladdning` | CSV-uppladdning av flera bilar |
| Katalog-import | `/admin/katalog/importera` | Importera bilkatalog från fil/API |
| Prisuppdatering | `/admin/katalog/priser` | Massuppdatera priser i katalogen |
| Quiz-svar | `/admin/quiz` | Inkomna bilmatch-svar från kunder |
| Bokningar | `/admin/bokningar` | Konsultationsbokningar |
| Handlarpool | `/admin/handlarpool` | Hantering av handlarpoolen |
| Förslag-editor | `/admin/bilar/[id]/forslag/nytt` | Skapa förslag till handlare för en bil |

---

## 5. MODALER & WIZARDS

### 5.1 BuyDrawer – Köp-wizard

Öppnas från bilsidor, bilkatalog, och flera CTA:er.

```
┌─────────────────────────────────────────────────────┐
│  Köp bil med expert                            ✕     │
│  [Expert-foto] "Vi hjälper dig hela vägen"          │
│                                                       │
│  STEG 1: Vad behöver du hjälp med?                    │
│  ┌──────────────────────┐ ┌──────────────────────┐   │
│  │ Jag har hittat en bil │ │ Jag letar efter en   │   │
│  └──────────────────────┘ └──────────────────────┘   │
│  ┌──────────────────────┐ ┌──────────────────────┐   │
│  │ Jag vill byta bil     │ │                     │   │
│  └──────────────────────┘ └──────────────────────┘   │
│                                                       │
│  STEG 2: Berätta om bilen                             │
│  [Formulär fält]                                     │
│  [Nästa →]                                           │
│                                                       │
│  STEG 3: Dina uppgifter                               │
│  Namn/telefon/e-post                                 │
│  [Skicka förfrågan]                                  │
│                                                       │
│  Bekräftelse:                                        │
│  "Tack! Vi hör av oss inom 24 timmar."               │
│  [Ring oss: 08-5555 0200]                            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 5.2 ConsultationDrawer – Kostnadsfri konsultation

Öppnas globalt via alla länkar till `/gratis-konsultation`.

```
┌─────────────────────────────────────────────────────┐
│  Kostnadsfri konsultation                      ✕     │
│  [Expert-foto]                                       │
│                                                       │
│  "Boka en kostnadsfri konsultation"                  │
│  "Vi ringer dig upp och hjälper dig komma vidare."   │
│                                                       │
│  Namn: [_______________]                             │
│  Telefon: [_______________]                          │
│  E-post: [_______________]                           │
│  Önskad tid: [välj ▾]                                │
│                                                       │
│  [Boka konsultation]                                  │
│                                                       │
│  (efter submit:)                                      │
│  "Tack! Vi hör av oss snart."                        │
│  [Klar]                                               │
└─────────────────────────────────────────────────────┘
```

---

### 5.3 CarDetailSheet – Bildetaljer

Öppnas från "Läs mer" på bilkort.

```
┌─────────────────────────────────────────────────────┐
│  [Bil-bild]                                      ✕   │
│  "Volvo XC60 2020"                                   │
│  12 000 mil · Automat · Diesel                       │
│                                                       │
│  Specifikationer:                                     │
│  ┌──────────────────────┐                            │
│  │ Miltal      12 000    │                            │
│  │ Drivmedel   Diesel    │                            │
│  │ Växellåda   Automat   │                            │
│  │ Karosseri   SUV       │                            │
│  │ Effekt       190 hk   │                            │
│  └──────────────────────┘                            │
│                                                       │
│  Expertbetyg: ⭐⭐�⭐⭐ (4/5)                         │
│  "Bra familjebil med låg driftskostnad"             │
│                                                       │
│  [Förhandla pris →]                                  │
│  [Starta bilmatch]                                   │
│  ← Tillbaka                                           │
└─────────────────────────────────────────────────────┘
```

---

### 5.4 SearchAlertModal – Spara sökavisering

```
┌───────────────────────────────────┐
│  Spara sökavisering           ✕   │
│                                   │
│  "Få notiser när nya bilar        │
│   matchar din sökning"            │
│                                   │
│  E-post: [_______________]        │
│                                   │
│  [Spara avisering]                │
│                                   │
│  (efter submit:)                  │
│  "Klart! Du får mail när nya      │
│   bilar matchar."                 │
└───────────────────────────────────┘
```

---

### 5.5 CarFitQuiz – Bilmatch

```
┌─────────────────────────────────────────────────────┐
│  Bilmatch                                       ✕     │
│  "Hitta rätt bil på 2 minuter"                      │
│                                                       │
│  Fråga 1/5: Vad är viktigast för dig?                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Pris      │ │ Säkerhet │ │ Miljö    │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐                          │
│  │ Utrymme  │ │ Körkänsla│                          │
│  └──────────┘ └──────────┘                          │
│                                                       │
│  [Tillbaka]  [Nästa →]                               │
│                                                       │
│  ...fler frågor...                                    │
│                                                       │
│  RESULTAT:                                            │
│  ┌──────────────────────────────┐                   │
│  │ [Bild] Volvo XC60             │                   │
│  │ 92% match                     │                   │
│  │ [Beställ →]  [Läs mer]       │                   │
│  └──────────────────────────────┘                   │
│  ┌──────────────────────────────┐                   │
│  │ [Bild] Kia EV6               │                   │
│  │ 87% match                     │                   │
│  │ [Beställ →]  [Läs mer]       │                   │
│  └──────────────────────────────┘                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 5.6 CompareDrawer – Jämför bilar

```
┌─────────────────────────────────────────────────────┐
│  Jämför bilar                              (2 valda) ✕ │
│                                                       │
│  ┌──────────┬──────────┬──────────┐                  │
│  │          │ Volvo XC60│ Kia EV6 │                  │
│  ├──────────┼──────────┼──────────┤                  │
│  │ Pris     │ 499 000  │ 459 000  │                  │
│  │ Miltal   │ 12 000   │ 5 000    │                  │
│  │ Drivmedel│ Diesel   │ El       │                  │
│  │ Effekt   │ 190 hk   │ 204 hk   │                  │
│  │ Bagage   │ 505 L    │ 490 L    │                  │
│  │ TCO/år   │ 42 000   │ 38 000   │                  │
│  └──────────┴──────────┴──────────┘                  │
│                                                       │
│  [Förhandla Volvo]  [Förhandla Kia]                  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 5.7 TcoCompareBar – TCO-jämförelse

```
┌─────────────────────────────────────────────────────┐
│  (flytande i botten av skärmen)                      │
│  ┌─────────────────────────────────────────┐         │
│  │ 2 bilar valda för TCO                    │         │
│  │ [Jämför driftskostnad →]  [✕ Volvo] [✕ Kia]│      │
│  └─────────────────────────────────────────┘         │
│                                                       │
│  (vid klick, expanderar till full TCO-vy:)            │
│  ┌─────────────────────────────────────────┐         │
│  │ TCO-jämförelse                           │         │
│  │ Bränsle:     18 000  vs  8 000           │         │
│  │ Försäkring:  8 000   vs  7 000           │         │
│  │ Service:     5 000   vs  4 000           │         │
│  │ Värdefall:   35 000  vs  45 000          │         │
│  │ ────────────────────────────────        │         │
│  │ Total/år:    66 000  vs  64 000          │         │
│  └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

---

## 6. GLOBALA ELEMENT

### 6.1 Navigation (Header)

**Startsidan-variant:**
```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]  Sälj bil | Köp bil | Så funkar det    │
│                              [Logga in] [Kostnadsfri │
│                                       konsultation] │
└─────────────────────────────────────────────────────┘
```

**Standard-variant (på undersidor):**
```
┌─────────────────────────────────────────────────────┐
│ [Bilto logo]  Sälj bil | Bilköpshjälpen | Priser |  │
│               Bilspara        [Kostnadsfri           │
│                              konsultation] [☰]      │
└─────────────────────────────────────────────────────┘
```

**Färg:** Blå bakgrund `#0e6efe`, vit text. Loggan klickbar → `/`.

**MobileMenu (hamburger):**
```
┌───────────────────┐
│  Meny         ✕   │
│                   │
│ Sälj bil          │
│ Bilköpshjälpen    │
│ Priser            │
│ Bilspara          │
│ Guider            │
│ Vanliga frågor    │
│ Om oss            │
│ Så funkar det     │
└───────────────────┘
```

---

### 6.2 Footer

```
┌─────────────────────────────────────────────────────┐
│  Mörk bakgrund (#060e1e)                             │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Bilto    │ │ Tjänster │ │ Sälj &   │             │
│  │ Om oss   │ │ Köp bil  │ │ Köp     │             │
│  │ Priser   │ │ Sälj bil │ │ Guider  │             │
│  │          │ │ Bilspara │ │ Vanliga │             │
│  │          │ │          │ │ frågor  │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                       │
│  ┌──────────────────────────────────────┐           │
│  │ Integritetspolicy | Användarvillkor  │           │
│  │ Webbplatskarta | [Admin-länk]        │           │
│  └──────────────────────────────────────┘           │
│                                                       │
│  © 2026 Bilto                                        │
└─────────────────────────────────────────────────────┘
```

**Footer-länkar:**

| Kolumn | Länk | Destination |
|--------|------|-------------|
| Bilto | Om oss | `/om-oss` |
| Bilto | Priser | `/priser` |
| Tjänster | Köp bil | `/kop-bil` |
| Tjänster | Sälj bil | `/salj-bil` |
| Tjänster | Bilspara | `/bilspara` |
| Sälj & Köp | Guider | `/guider` |
| Säll & Köp | Vanliga frågor | `/vanliga-fragor` |
| Botten | Integritetspolicy | `/integritetspolicy` |
| Botten | Användarvillkor | `/anvandarvillkor` |
| Botten | Webbplatskarta | `/webbplatskarta` |
| Botten | Admin | `/admin` |

---

## ÖVERGRIPANDE FLÖDEN

### Flöde A: Sälja bil

```
Startsida (/)
  → Flik "Sälj bil"
  → Regnummer + telefon → "Värdera bilen"
  → SellCarPage (5-stegs formulär)
    1. Om bilen (märke, modell, miltal, skick)
    2. Utrustning (checkboxar)
    3. Bilder (uppladdning)
    4. Kontaktuppgifter
    5. Bekräfta → skicka
  → Bekräftelseskärm
  → (admin ser bilen, skickar till handlare)
  → Handlare budgerar
  → Kund får länk: /min-bil/[token]
  → Kund accepterar bud
  → Avtalssida: /avtal/[token]
  → Klart!
```

### Flöde B: Köpa bil

```
Startsida (/)
  → Flik "Köp bil"
  → Sök bil ELLER klicka chip
  → /kop-bil (KopBilConcierge)
    → Läs om tjänsten
    → [Få prishjälp] → öppnar BuyDrawer
  ELLER
  → /kop-bil/bestall (BuyCarPage wizard)
    1. Vad behöver du hjälp med?
    2. Berätta om bilen
    3. Inbytesbil?
    4. Dina uppgifter → skicka
  → Bekräftelse: "Vi hör av oss inom 24h"
  → (expert tar över, letar/förhandlar)
  → Kund får länk: /min-forfragan/[token]
  → Kund accepterar erbjudande
  → Klart!
```

### Flöde C: Bilmatch (Quiz)

```
Startsida eller /kop-bil
  → "Vet inte vad du vill ha?" / "Starta bilmatch"
  → CarFitQuiz modal
    → 5 frågor (prioriteringar, bilstorlek, drivmedel, etc.)
    → Resultat: matchande bilar med procent
    → [Beställ] → BuyDrawer
    → [Läs mer] → CarDetailSheet
```

### Flöde D: Kostnadsfri konsultation

```
Vilken sida som helst
  → Klicka "Kostnadsfri konsultation" (i nav, footer eller CTA)
  → ConsultationDrawer öppnas
  → Fyll i namn, telefon, e-post, önskad tid
  → [Boka konsultation]
  → "Tack! Vi hör av oss snart."
  → (admin ser bokningen i /admin/bokningar)
```

### Flöde E: Handlare registrera och budgera

```
/handlare/registrera (landning)
  → [Ansök nu]
  → /handlare/ansok (ansökningsformulär)
  → Skicka in
  → "Vi granskar inom 24h"
  → (admin godkänner i /admin/handlare/[id])
  → Handlare får e-post → sätter lösenord
  → /handlare/logga-in
  → /handlare/oversikt
  → Se bilar som är öppna för bud
  → Lägg bud på bil
  → (kund får bud, accepterar/avböjer)
```

### Flöde F: Bilspara (kampanjbilar)

```
/bilspara
  → Filtrera på besparing, märke, drivmedel, etc.
  → Se kampanjbilar med besparingsuppskattning
  → [Förhandla pris] → BuyDrawer
  → 🔔 [Spara sökavisering] → SearchAlertModal
```

---

*Dokumentet täcker alla sidor och flöden i Bilto baserat på källkoden.*
*Genererat från App.tsx routing, SITEMAP.md, och sidkomponenter.*
