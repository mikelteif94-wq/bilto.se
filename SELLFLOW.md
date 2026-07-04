# Säljflödet – teknisk dokumentation

## 1. Hur SellCarPage nås

SellCarPage renderas **inte** via en URL-route. Den visas istället när App-state `publicRoute` sätts till `{ page: 'sell', regnummer, telefon?, miltal? }`. Det finns tre vägar dit:

### a) Från HowItWorks på startsidan (`/`)
- Användaren fyller i regnummer i HowItWorks-komponenten och klickar "Sälj".
- `onSell(reg)` → `setPublicRoute({ page: 'sell', regnummer: reg })`
- URL förblir `/` under hela flödet.

### b) Från `/salj-bil`
- URL `/salj-bil` renderar HowItWorks med `seoSlug="salj-bil"`.
- Samma `onSell`-callback, men URL pushas tillbaka till `/` när SellCarPage aktiveras.

### c) Direkt inkommande state (ovanligt)
- `publicRoute.telefon` och `publicRoute.miltal` kan skickas med om anroparen har dessa värden sedan tidigare (t.ex. från en kampanjlänk).

### Alla ingångspunkter i navigationen

| Plats | Element | Destination |
|---|---|---|
| Startsidan (`/`) | "Sälj"-knapp i HowItWorks | Sätter `publicRoute.page = 'sell'` |
| `/salj-bil` | "Sälj"-knapp i HowItWorks | Sätter `publicRoute.page = 'sell'`, URL → `/` |
| Footer | Länk "Sälj din bil" | Navigerar till `/salj-bil` |
| Mobilmeny | "Sälj bil" | Navigerar till `/salj-bil` |
| HowItWorks navbar | "Sälj bil"-knapp | Navigerar till `/salj-bil` |
| CompareCarsPage navbar | "Sälj bil"-knapp | Navigerar till `/salj-bil` |
| `/salj-bil-hjalp` | (redirect) | Redirectar till `/salj-bil` |

---

## 2. Steg-för-steg i flödet

Flödet består av 5 steg i fast ordning: `condition → equipment → images → contact → confirm`.

En progressbar visas i stegen 1–4 (döljs på steg 5). Varje steg har en "Tillbaka"-knapp som går ett steg bakåt; på steg 1 skickas användaren tillbaka till startsidan via `onBack()`.

---

### Steg 1 – Om din bil (`condition`)
**Komponent:** `CarConditionStep`

#### Fält

| Fält | Typ | Obligatoriskt | Validering |
|---|---|---|---|
| Registreringsnummer | Text (RegInput) | Ja (om inte inskickat) | Måste matcha `/^[A-Z0-9]{6}$/` |
| Märke | Select (POPULAR_BRANDS) | Ja | Får inte vara tomt |
| Modell | Text + datalist | Ja | Får inte vara tomt |
| Årsmodell | Select (1980–innevarande år) | Ja | Numerisk, 1980–nuvar. år |
| Miltal | Select (intervall 0–500 → 20 000+) | Ja | Måste välja ett intervall |
| Skick | 5 knappar (mycket_bra/bra/okej/slitet/skadat) | Ja | Måste väljas |
| Skickkommentar | Textarea, max 1 000 tecken | Nej | – |
| Bytbil (toggle) | Checkbox-liknande knapp | Nej | Döljer extra fält om ej vald |

#### Bytbil-underfält (visas om `showTradeIn=true` och användaren aktiverar toggle)

| Fält | Obligatoriskt |
|---|---|
| Märke på önskad bil | Nej |
| Modell på önskad bil | Nej |
| "Vet inte vilket märke/modell" (checkbox) | Nej – döljer märke/modell |
| Fritext – beskriv vad du söker | Nej |
| Max budget | Nej |
| Drivmedel (bensin/diesel/hybrid/el/spelar ingen roll) | Nej |
| Betalning (kontant/finansiering) | Nej |

> `showTradeIn` sätts till `true` om `onNavigateTrade`-prop skickats in – det sker från App.tsx-render av SellCarPage.

#### Regnummer-lookup
- `useVehicleLookup(reg)` anropas reaktivt när reg ändras (via edge function `lookup-vehicle`).
- Vid fynd: märke, modell, årsmodell och miltal fylls i automatiskt.
- Vid "not_found" visas ett varningsmeddelande; fälten är fortfarande manuellt redigerbara.

#### Klickbara element
- Alla 5 skick-knappar – väljer skick
- Bytbil-toggle – visar/döljer bytbil-fält
- "Vet inte vilket märke/modell"-knapp i bytbil
- Drivmedel-knappar (5 st)
- Betalning-knappar (Kontant / Finansiering)
- **"Nästa"** → validerar och går till steg 2

---

### Steg 2 – Utrustning och tillval (`equipment`)
**Komponent:** `CarEquipmentStep`

#### Fält

| Fält | Typ | Obligatoriskt |
|---|---|---|
| Utrustningsknappar (12 st) | Toggle-knappar | Nej |
| Fritext för övrig utrustning | Textarea (komma-separerat) | Nej |
| "Vet ej – hoppa över" | Toggle-knapp | Nej |

**12 förinställda alternativ:** Dragkrok, Skinnklädsel, Glas-/panoramatak, Navigator, Backkamera, Dubbla nycklar, Parkeringssensorer, Adaptiv farthållare, Värmare / motorvärmare, Elektrisk baklucka, Head-up display, Premium ljudsystem.

Om "Vet ej" aktiveras inaktiveras alla övriga knappar och fritexton; en tom utrustningslista skickas vidare.

#### Klickbara element
- 12 utrustningsknappar
- "Vet ej – hoppa över"-knapp
- **"Nästa"** → ingen validering, sparar urval och går till steg 3

---

### Steg 3 – Bilder av bilen (`images`)
**Komponent:** `ImageUploadForm`

#### Regler
- Minimum 3 bilder för att aktivera "Nästa"-knappen.
- Maximum 8 bilder.
- Bilder komprimeras klientsidigt (max 1 MB, max 1 920 px, konverteras till JPEG) via `browser-image-compression`.
- Uppladdning till Supabase storage sker **inte** i detta steg – bilderna lagras som `File`-objekt i React-state tills steg 5.

#### Klickbara element
- "Ta foto" → öppnar kamera (capture="environment")
- "Välj från bibliotek" → öppnar galleriet (multiple)
- Ta-bort-knapp (×) på varje thumbnail
- **"Nästa"** → aktiveras när ≥ 3 bilder valts; sparar och går till steg 4
- **"Hoppa över – vi tar det med er direkt"** → skickar vidare med tom bildlista (inga bilder sparas)

---

### Steg 4 – Dina uppgifter (`contact`)
**Komponent:** `CustomerForm`

#### Fält

| Fält | Typ | Obligatoriskt | Validering |
|---|---|---|---|
| Fullständigt namn | Text | Ja | Får inte vara tomt |
| Telefonnummer | Tel | Ja | `validateSwedishPhone()` – svensk format |
| E-postadress | Text (inputMode email) | Ja | Enkel regex `[^\s@]+@[^\s@]+\.[^\s@]+` |

> Lösenordsfält renderas **inte** i säljflödet (`requirePassword={false}`). Det visas bara om `requirePassword=true`, vilket används i andra sammanhang.

#### Klickbara element
- **"Nästa"** → validerar alla tre fält och går till steg 5

---

### Steg 5 – Bekräfta (`confirm`)
**Komponent:** `ConfirmationForm`

Visar en sammanfattning av all insamlad data: regnummer, märke, modell, årsmodell, miltal, skick, utrustning, skickkommentar, antal bilder, bytbil-detaljer (om valda), kontaktuppgifter.

#### Tillkommande val på detta steg

| Fält | Typ | Obligatoriskt |
|---|---|---|
| "När kan du tänka dig att göra affär?" | Radioknappar (3 val) | Nej |

De tre alternativen: "Redo att göra affär nu" (`ready_now`), "Inom en månad" (`within_month`), "Jag har precis börjat kolla" (`just_looking`).

#### Klickbara element
- De 3 deal-readiness-knapparna
- **"Skicka in och få bud"** → startar submit-sekvensen (se avsnitt 3)

---

## 3. Vad händer vid submit

Submit sker i fyra sekventiella steg med en progressiv statustext i knappen.

### Steg A – Skapa customer
- Läser ut eventuell inloggad Supabase-session (`auth.getSession()`).
- Genererar ett UUID klientsidigt (`crypto.randomUUID()`).
- Infogar i **`customers`**:

| Kolumn | Värde |
|---|---|
| `id` | Genererat UUID |
| `namn` | `customer.namn` |
| `telefon` | `customer.telefon` |
| `mejl` | `customer.mejl` |
| `user_id` | Inloggad users ID, annars `null` |

### Steg B – Skapa car
- Genererar ett access token (32-tecken slumpmässig alfanumerisk sträng).
- Genererar ett UUID för bilen.
- Infogar i **`cars`**:

| Kolumn | Värde |
|---|---|
| `id` | Genererat UUID |
| `regnummer` | Versaler, trimmat |
| `marke` | `car.marke` |
| `modell` | `car.modell` |
| `ar` | `car.ar` eller innevarande år |
| `miltal` | Mittpunkt för valt miltal-intervall |
| `skick` | `car.skick` |
| `skick_kommentar` | `car.skickKommentar` |
| `utrustning` | Array av strängar |
| `customer_id` | ID från steg A |
| `access_token` | Genererat token |
| `sales_type` | `'auction'` |
| `status` | `'ny'` |
| `trade_in_interest` | `true` om bytbil valdes |
| `trade_target_brand` | Bytbils märke |
| `trade_target_model` | Bytbils modell |
| `trade_target_free` | Fritext från bytbil |
| `trade_target_budget` | Budget som heltal (kr) |
| `trade_target_fuel` | Drivmedel |
| `trade_target_payment` | `'cash'` eller `'finance'` |
| `deal_readiness` | Valt alternativ eller tom sträng |

### Steg C – Ladda upp bilder
- Varje bild laddas upp till Supabase Storage bucket **`car-images`** med path `{car_id}/{timestamp}_{index}.jpg`.
- För varje bild som lyckas infogas en rad i **`car_images`**:

| Kolumn | Värde |
|---|---|
| `car_id` | Bilens ID |
| `storage_url` | Publik URL från storage |
| `ordning` | Ordningsindex (0 = huvudbild) |

Om upload-steget misslyckas på en enskild bild avbryts hela submit och ett felmeddelande visas. Redan skapade customer/car-rader finns kvar i databasen (ingen rollback).

### Steg D – E-postnotiser (fire-and-forget)
Två edge functions anropas parallellt med `void fetch(...)` – misslyckanden ignoreras.

| Edge function | Mottagare | Innehåll |
|---|---|---|
| `notify-customer-submitted` | Kundens e-postadress | Bekräftelse med tracking-URL och länk att skapa/logga in på konto |
| `notify-new-car` | Admin (`ADMIN_EMAIL`, default `hej@bilto.se`) | Lead-mejl med bil- och säljaruppgifter + länk till admin |

### Steg E – Bytbil-quote (om bytbil valdes)
- Infogar i **`quote_requests`** med `source='sell-flow-trade-in'` och `linked_sell_car_id`.
- Anropar edge function `notify-quote-request` (fire-and-forget).

---

## 4. Vad kunden ser efter submit

En success-skärm visas med:

1. **"Följ din bil live"-knapp** → navigerar till `/min-bil/{access_token}` (Tracking portal för sälj).
2. **Blått kort** – "Vår expert ringer dig" med maskerat telefonnummer.
3. **Tidslinje** – tre steg: Bilen inskickad → Expertrådgivning → Auktion.
4. **Sammanfattningsruta** – regnummer och mejladress som buden skickas till.
5. **Gul banner** – påminnelse att bekräftelsemejl har skickats; be dem kolla skräppost.
6. **Portal-länk sälj** – direktlänk till `/min-bil/{access_token}` med "Öppna"-knapp.
7. **Portal-länk köp** (om bytbil) – direktlänk till `/min-forfragan/{quoteToken}` med grön "Öppna"-knapp.
8. **"Gå till startsidan"-länk** → anropar `onGoHome()` → återgår till startsidan.

---

## 5. Vad händer om användaren laddar om sidan mitt i flödet

All state lever i React-minnet. Det finns ingen URL-parameter, localStorage-cache eller query string som återställer läget.

- **Steg 1–4:** Omladdning tömmer all data. Användaren hamnar på startsidan (eller `/salj-bil`) och måste börja om från steg 1.
- **Steg 5 (before submit):** Detsamma – all inmatad data försvinner.
- **Under pågående submit (steg A–C):** Omladdning avbryter uppladdningen. Eventuellt redan skapad `customer`- eller `car`-rad ligger kvar i databasen men bilder kan vara halvt uppladdade. Ingen rensning sker automatiskt.
- **Efter submit:** Success-skärmen försvinner, men data är sparad i databasen. Kunden har fått sitt bekräftelsemejl med tracking-URL, som de kan använda för att nå portalen direkt.

---

## 6. E-post och notiser

### Till kunden – `notify-customer-submitted`
- **Trigger:** Anropas direkt från frontend efter lyckad databas-submit.
- **Mottagare:** Kundens e-postadress (`customers.mejl`).
- **Avsändare:** `RESEND_FROM_EMAIL` (default `Bilto <hej@bilto.se>`).
- **Ämne:** `Tack {förnamn}! Vi ringer dig snart`
- **Innehåll:**
  - Välkomsttext med förnamn.
  - Registreringsnummer.
  - Information om att en expert ringer inom kort.
  - Två CTA-knappar: "Jag har inget konto – Skapa konto" och "Jag har ett konto – Logga in" (med `?mejl=` förifyllt).
- **Felhantering:** Skrivs till `notifications_log` med status `failed` om Resend misslyckas. Frontend ignorerar felet (fire-and-forget).

### Till admin – `notify-new-car`
- **Trigger:** Anropas direkt från frontend efter lyckad databas-submit.
- **Mottagare:** `ADMIN_EMAIL` (default `hej@bilto.se`).
- **Ämne:** `LEAD Direktbud: {märke modell regnummer}` (eller "LEAD Förmedling" om `sales_type=brokerage`).
- **Innehåll:**
  - Märke, modell, årsmodell, miltal, skick.
  - Säljarens namn, telefon och mejl.
  - Direktlänk till admin-sidan för bilen: `/admin/bilar/{car_id}`.
- **Felhantering:** Frontend ignorerar felet (fire-and-forget).

### Vid bytbil – `notify-quote-request`
- Anropas separat om kunden valde bytbil-alternativet.
- Notifierar om den nyss skapade `quote_request` med `source=sell-flow-trade-in`.

### SMS / push
Det skickas inga SMS eller push-notiser i säljflödet.
