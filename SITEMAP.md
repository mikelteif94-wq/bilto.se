# Bilto – Full Click Inventory (SITEMAP.md)

> Built by reading App.tsx, CompareCarsPage.tsx, HomePage.tsx, BuyCarPage.tsx,
> KopBilConcierge.tsx, VanligaFragorPage.tsx, BilsparaFilterPanel.tsx,
> BilsparaPage.tsx (partial), HowItWorks.tsx (partial), and the full session history.
> "VERIFIED" = read directly from code in this session.
> "INFERRED" = derived from routing/import analysis.
>
> **Legend:**
> - 🔴 DEAD LINK – target route has no handler
> - 🟡 EMPTY TARGET – click does nothing / no-op
> - 🔵 DUPLICATE – same destination as another element on same page
> - 👻 ORPHANED – page exists in code but no nav/link reaches it

---

## 1. ALL ROUTES (from App.tsx — VERIFIED)

| URL | Component | Type |
|-----|-----------|------|
| `/` | `HowItWorks` (seoSlug="home") | Public, SSR |
| `/kop-bil` | `CompareCarsPage` | Public, CSR |
| `/kop-bil/bestall` | `BuyCarPage` | Public, CSR |
| `/kop-bil-hjalp` | `KopBilConcierge` | Public, CSR |
| `/nya-bilar` | `NyaBilarPage` | Public, CSR |
| `/sa-funkar-det` | `HowItWorks` | Public, SSR |
| `/salj-bil` | `HowItWorks` (seoSlug="salj-bil") | Public, SSR |
| `/salj-din-bil` | `HowItWorks` (showSeo) | Public, SSR |
| `/salj-bil-hjalp` | `SaljBilMedHjalp` | Public, CSR |
| `/om-oss` | `AboutPage` | Public, CSR |
| `/integritetspolicy` | `PrivacyPage` | Public, CSR |
| `/anvandarvillkor` | `TermsPage` | Public, CSR |
| `/vanliga-fragor` | `VanligaFragorPage` | Public, CSR |
| `/priser` | `PriserPage` | Public, CSR |
| `/bilspara` | `BilsparaPage` | Public, CSR |
| `/guider` | `GuidePage` | Public, CSR |
| `/guider/[slug]` | `GuidePage` with article | Public, CSR |
| `/webbplatskarta` | `WebbplatskartaPage` | Public, CSR |
| `/kontakt` | `FreeConsultationPage` | Public, CSR |
| `/gratis-konsultation` | Opens `ConsultationDrawer` (no page render) | Modal trigger |
| `/forhandla-bil` | `SeoTopicPage` | Public, SSR |
| `/bilkopshjalp` | `SeoTopicPage` | Public, SSR |
| `/spara-pengar-bilkop` | `SeoTopicPage` | Public, SSR |
| `/sank-manadskostnad-bil` | `SeoTopicPage` | Public, SSR |
| `/byta-bil` | `SeoTopicPage` | Public, SSR |
| `/bilradgivare` | `SeoTopicPage` | Public, SSR |
| `/gratis-bilvardering` | `SeoTopicPage` | Public, SSR |
| `/salj-din-bil-i-[stad]` | `SeoLandingPage` (type=city) | Public, SSR |
| `/salj-din-[marke]` | `SeoLandingPage` (type=brand) | Public, SSR |
| `/logga-in` | `CustomerLogin` | Auth, CSR |
| `/mina-bilar` | `CustomerDashboard` | Auth-required, CSR |
| `/portal` | `PortalCallbackPage` | Auth, CSR |
| `/min-bil/[token]` | `MyCarPage` | Token-auth, CSR |
| `/min-forfragan/[token]` | `MyQuotePage` | Token-auth, CSR |
| `/handlare/registrera` | `DealerRegister` (landing) | Public, CSR |
| `/handlare/ansok` | `DealerRegister` (form) | Public, CSR |
| `/handlare/logga-in` | `DealerLogin` | Auth, CSR |
| `/handlare/oversikt` | `DealerOverview` | Dealer-auth, CSR |
| `/handlare/bilar` | `DealerCarsList` | Dealer-auth, CSR |
| `/handlare/bilar/ny` | `DealerAddCar` | Dealer-auth, CSR |
| `/handlare/bilar/[id]` | `DealerCarDetail` | Dealer-auth, CSR |
| `/handlare/lager` | `DealerInventorySync` | Dealer-auth, CSR |
| `/handlare/installningar` | `DealerSettings` | Dealer-auth, CSR |
| `/handlare/kampanjer` | `DealerCampaigns` | Dealer-auth, CSR |
| `/handlare/ny` | `DealerNewCampaign` | Dealer-auth, CSR |
| `/handlare/bygg` | `DealerCostBuilder` | Dealer-auth, CSR |
| `/handlare/leads-b` | `DealerLeadsPage` | Dealer-auth, CSR |
| `/handlare/statistik` | `DealerStats` | Dealer-auth, CSR |
| `/handlare/profil` | `DealerProfile` | Dealer-auth, CSR |
| `/handlare/integrationer` | `DealerIntegrationer` | Dealer-auth, CSR |
| `/handlare/vardering-leads` | `DealerValuationLeads` | Dealer-auth, CSR |
| `/handlare/lager-b` | 🔴 Silently falls through → `DealerCarsList` | Bug |
| `/handlare/mallar` | 🔴 Silently falls through → `DealerCarsList` | Bug |
| `/handlare/motbud` | 🔴 Silently falls through → `DealerCarsList` | Bug |
| `/admin` | `AdminLogin` / `AdminOverview` | Admin-auth, CSR |
| `/admin/oversikt` | `AdminOverview` | Admin-auth, CSR |
| `/admin/leads` | `AdminLeadCommandCenter` | Admin-auth, CSR |
| `/admin/bilar` | `AdminCars` | Admin-auth, CSR |
| `/admin/bilar/ny` | `AdminAddCar` | Admin-auth, CSR |
| `/admin/bilar/[id]` | `AdminCarDetail` | Admin-auth, CSR |
| `/admin/bilar/[id]/forslag/nytt` | `AdminDealerProposalEditor` | Admin-auth, CSR |
| `/admin/handlare` | `AdminDealers` | Admin-auth, CSR |
| `/admin/handlare/[id]` | `AdminDealerDetail` | Admin-auth, CSR |
| `/admin/forfragningar/[id]` | `AdminQuoteDetail` | Admin-auth, CSR |
| `/admin/erbjudanden/[id]` | `AdminOfferEditor` | Admin-auth, CSR |
| `/admin/erbjudanden/nytt/[id]` | `AdminOfferEditor` (new) | Admin-auth, CSR |
| `/admin/uppladdning` | `AdminBulkUpload` | Admin-auth, CSR |
| `/admin/quiz` | `AdminQuizSubmissions` | Admin-auth, CSR |
| `/admin/katalog` | `AdminCarCatalog` | Admin-auth, CSR |
| `/admin/katalog/importera` | `AdminCatalogImport` | Admin-auth, CSR |
| `/admin/katalog/priser` | `AdminPriceUpdate` | Admin-auth, CSR |
| `/admin/bokningar` | `AdminConsultationBookings` | Admin-auth, CSR |
| `/valj-losenord` | `SetPasswordPage` (customer) | Recovery, CSR |
| `/handlare/valj-losenord` | `SetPasswordPage` (dealer) | Recovery, CSR |
| **Redirects** | | |
| `/hitta-bil` | → `/kop-bil` (replaceState) | Redirect |
| `/forhandling` | → `/kop-bil` (replaceState) | Redirect |
| `/formedlingskalkylator` | → `/` (navigate) | Redirect |
| `/formedla` | → `/` (navigate) | Redirect |
| `/salj` | → `/kop-bil` (navigate) | Redirect |
| `/handlare` | → `/handlare/logga-in` (navigate) | Redirect |
| `/admin/forfragningar` | → `/admin/leads` (navigate) | Redirect |

---

## 2. NAVIGATION SYSTEMS

### 2a. Desktop Header — VARIES BY PAGE

**HomePage** (VERIFIED):
| Element | Destination |
|---------|------------|
| Bilto logo (img) | `/` (href="/")|
| Bilköpshjälpen | `/kop-bil` |
| Sälj bil | Scrolls to hero top, sets tab='salj' |
| Så funkar det | `/sa-funkar-det` (href) |
| Logga in | `/logga-in` (href) |
| Kostnadsfri konsultation | `/gratis-konsultation` → opens ConsultationDrawer |

**BilsparaPage / VanligaFragorPage / PriserPage / GuidePage / AboutPage** (VERIFIED from VanligaFragorPage):
- navItems = `['Sälj bil', 'Bilköpshjälpen', 'Priser', 'Bilspara']`

| Element | Destination |
|---------|------------|
| Bilto logo | `onBackHome()` → `/` |
| Sälj bil | `onBackHome()` → `/` |
| Bilköpshjälpen | `/kop-bil` |
| Priser | `/priser` |
| Bilspara | `/bilspara` |
| Kostnadsfri konsultation | `/gratis-konsultation` → ConsultationDrawer |
| ☰ (mobile hamburger) | Opens MobileMenu |

**BuyCarPage** (VERIFIED):
| Element | Destination |
|---------|------------|
| Bilto logo | `onBack()` → caller-defined |
| Kostnadsfri konsultation | `/gratis-konsultation` → ConsultationDrawer |

### 2b. MobileMenu — INFERRED from imports & route maps

The `MobileMenuItem` union includes: `'Sälj bil' | 'Bilköpshjälpen' | 'Priser' | 'Bilspara' | 'Guider' | 'Vanliga frågor' | 'Hitta bil' | 'Om oss' | 'Så funkar det'`

Route mapping (VERIFIED from VanligaFragorPage & BilsparaPage):
| Menu item | Destination |
|-----------|------------|
| Sälj bil | `onBackHome()` → `/` |
| Bilköpshjälpen | `/kop-bil` |
| Priser | `/priser` |
| Bilspara | `/bilspara` |
| Guider | `/guider` |
| Vanliga frågor | `/vanliga-fragor` |
| Hitta bil | `/kop-bil` 🔵 DUPLICATE of Bilköpshjälpen |
| Om oss | `/om-oss` |
| Så funkar det | `/sa-funkar-det` |

### 2c. SiteFooter — INFERRED from session summary

> The footer was confirmed to have a "Sälj & Köp" column with Guider + Vanliga frågor links.
> Footer background: `#060e1e`, has admin link at bottom.

| Element | Destination |
|---------|------------|
| Guider | `/guider` |
| Vanliga frågor | `/vanliga-fragor` |
| Admin link (hidden/small text) | `/admin` |
| Integritetspolicy | `/integritetspolicy` (INFERRED) |
| Användarvillkor | `/anvandarvillkor` (INFERRED) |

---

## 3. PUBLIC PAGES — DETAILED CLICK INVENTORY

---

### 3.1 `/` — Startsidan (HowItWorks, seoSlug="home")

**Type:** Public, server-rendered shell, CSR hydrated

**Hero tab: Sälj bil (default)**
| Element | Destination |
|---------|------------|
| RegInput (regnummer field) | Updates regnummer state |
| Telefon input | Updates telefon state |
| "Värdera bilen" (submit) | Submits lead → `SellCarPage` via `onNavigate()` |
| Sticky ring CTA (mobile) | Opens ConsultationDrawer or `SellCarPage` (INFERRED) |
| Expert photo (sticky ring) | `/Man_in_car_showroom_portrait copy.png` image only |

**Hero tab: Köp bil (Hitta bil)**
| Element | Destination |
|---------|------------|
| Search input | Updates `carQuery` state, shows autocomplete dropdown |
| Sök button | → `/kop-bil?q=[carQuery]` (VERIFIED) |
| Autocomplete dropdown items | → `/kop-bil/bestall?bil=[make+model]&typ=found` (via handleCarSelect) |
| Tesla Model Y chip | → `/kop-bil/bestall?bil=Tesla+Model+Y&typ=found` (VERIFIED) |
| Volvo XC60 chip | → `/kop-bil/bestall?bil=Volvo+XC60&typ=found` (VERIFIED) |
| BMW 3-serie chip | → `/kop-bil/bestall?bil=BMW+3-serie&typ=found` (VERIFIED) |
| Kia EV6 chip | → `/kop-bil/bestall?bil=Kia+EV6&typ=found` (VERIFIED) |
| "Vet inte vad du vill ha? Vi hjälper dig →" | → `/kop-bil?quiz=start` (VERIFIED) |

**Tab switcher:**
| Element | Destination |
|---------|------------|
| "Sälj bil" tab | Sets `heroTab='salj'` |
| "Köp bil" tab | Sets `heroTab='hitta'` |

**Sticky CTA section (HowItWorks ~line 1157):**
| Element | Destination |
|---------|------------|
| Expert avatar img | Display only |
| Green online dot | Display only |

---

### 3.2 `/kop-bil` — Köp bil med hjälp (CompareCarsPage)

**Type:** Public, CSR

**Header nav** (standard Bilto pill): see §2a.

**Hero — Three "Vägval" cards** (INFERRED from code structure):
| Element | Destination |
|---------|------------|
| "Jag har hittat en bil" card | Opens `BuyDrawer` with `track='found'` |
| "Jag letar efter bil" card | Opens `BuyDrawer` with `track='searching'` OR → `/kop-bil/bestall?typ=searching` |
| "Jag vill byta bil" card | Opens `BuyDrawer` with `track='trade'` |

**Category filter chips** (VERIFIED):
| Element | Destination |
|---------|------------|
| Alla | Sets `activeCategory='alla'`, clears search |
| Populärast | Sets `activeCategory='popular'` |
| Elbilar | Sets `activeCategory='el'` |
| SUV | Sets `activeCategory='suv'` |
| Hybrid | Sets `activeCategory='hybrid'` |
| Sedan / Kombi | Sets `activeCategory='sedan'` |

**Catalog search** (VERIFIED):
| Element | Destination |
|---------|------------|
| Search input "Sök märke eller modell…" | Sets `carSearchQuery`, filters catalog |
| ✕ clear button | Clears `carSearchQuery` |

**Bilspara campaign match banner** (VERIFIED, new):
| Element | Destination |
|---------|------------|
| Campaign banner (green) | → `/bilspara` |

**Car cards (CompactCarCard / ElCarCard)** (VERIFIED):
| Element | Destination |
|---------|------------|
| "Förhandla pris" / "Beställ" button | Opens `BuyDrawer` with car name |
| Detail / "Läs mer" button | Opens `CarDetailSheet` modal |
| Compare checkbox | Adds to compare set (up to 4) |
| "Bilmatch" / quiz button | Opens `CarFitQuiz` modal |
| TCO compare | Adds/removes from `TcoCompareBar` |

**Empty state (when search = no results)** (VERIFIED, new):
| Element | Destination |
|---------|------------|
| "Beställ prishjälp" | Opens `BuyDrawer` with search term |
| "Testa bilmatch" | Scrolls to quiz section, starts quiz |

**"Hittar du inte bilen?" banner** (VERIFIED):
| Element | Destination |
|---------|------------|
| Banner button | Opens `BuyDrawer` with `track='found'` |

**Budget brackets** (INFERRED, 6 cards):
| Element | Destination |
|---------|------------|
| Budget bracket card (e.g. "Under 3 000 kr/mån") | Sets `activeBudget` filter, filters catalog |

**"Populära elbilar" section** (INFERRED):
| Element | Destination |
|---------|------------|
| Elbil card | Opens `BuyDrawer` or `CarDetailSheet` |

**AI-sök chat** (VERIFIED from code):
| Element | Destination |
|---------|------------|
| Chat input | Updates `chatInput` state |
| Send button | Triggers `handleChatSubmit()` → shows scored results |
| Reformulation chips | Calls `handleChatSubmit(chip)` with preset query |
| Result car cards in chat | Opens `BuyDrawer` with car name |

**Quiz section** (VERIFIED from state):
| Element | Destination |
|---------|------------|
| "Starta bilmatch" | Sets `quizStep='active'` |
| Quiz question answers | Advances quiz steps |
| "Tillbaka" in quiz | Goes to previous quiz step |
| Quiz results car card | Opens `BuyDrawer` or `CarDetailSheet` |
| "Beställ hjälp" on quiz result | Opens `BuyDrawer` |

**Bilbyte hero section** (INFERRED):
| Element | Destination |
|---------|------------|
| RegInput + CTA | Opens `BuyDrawer` with `track='trade'`, reg pre-filled |

**"Spara sökning / Alert" button** (VERIFIED from imports):
| Element | Destination |
|---------|------------|
| Bell / "Spara sökning" | Opens `SearchAlertModal` |

**TcoCompareBar** (VERIFIED from imports):
| Element | Destination |
|---------|------------|
| TcoCompareBar | Floating bottom bar when 2 cars selected for TCO |
| "Jämför" | Opens full TCO comparison view |

**CompareDrawer** (VERIFIED from state):
| Element | Destination |
|---------|------------|
| Opens when ≥2 cars selected | Side drawer with comparison table |
| "Förhandla" in drawer | Opens `BuyDrawer` |

**BuyDrawer** (opened from many CTAs):
See §6.1 for full BuyDrawer wizard.

---

### 3.3 `/kop-bil/bestall` — Beställ bilköpshjälp (BuyCarPage)

**Type:** Public, CSR. Accepts query params: `bil`, `typ`, `reg`, `source`.

**Header:** Bilto logo → `onBack()` (→ `/kop-bil`), "Kostnadsfri konsultation" → ConsultationDrawer.

**Progress bar:** display only.

**Step: "track" — Vad behöver du hjälp med?** (INFERRED, BuyTrackStep):
| Element | Destination |
|---------|------------|
| "Jag har hittat en bil" | Sets `track='found'`, → step `details` |
| "Jag vet vilken bil jag vill ha" | Sets `track='know'`, → step `details` |
| "Jag letar efter en bil" | Sets `track='searching'`, → step `details` |
| "Jag vill byta bil" | Sets `track='trade'`, → step `details` |
| "Vet inte – vi guidar dig" | Opens guidance modal (phone callback) |

**Guidance modal** (VERIFIED from BuyCarPage):
| Element | Destination |
|---------|------------|
| Namn input | Updates `guidanceName` |
| Telefon input | Updates `guidancePhone` |
| E-post input | Updates `guidanceEmail` (optional) |
| "Ring upp mig" | Submits lead → shows confirmation |
| ✕ close | Closes modal |
| "Klar" (after submit) | Closes modal |

**Step: "details" — Berätta om bilen/söket** (INFERRED, BuyDetailsStep):
| Element | Destination |
|---------|------------|
| Form fields (model, budget, etc.) | Updates `details` state |
| "Nästa" | → step `tradeIn` |
| "Tillbaka" | → step `track` (or `onBack()`) |

**Step: "tradeIn" — Inbytesbil** (INFERRED, BuyTradeInStep):
| Element | Destination |
|---------|------------|
| "Ja / Nej" toggle | Sets `hasTradeIn` |
| RegInput | Sets `tradeInReg` |
| Loan toggle | Sets `hasLoan` |
| "Nästa" | → step `contact` |
| "Tillbaka" | → step `details` |

**Step: "contact" — Dina uppgifter** (INFERRED, BuyContactStep):
| Element | Destination |
|---------|------------|
| Name/phone/email fields | Updates `contact` state |
| Preferred time select | Updates `preferredTime` |
| "Skicka förfrågan" | Submits to Supabase → step `done` |
| "Tillbaka" | → step `tradeIn` |

**Step: "done" — Tack!**
| Element | Destination |
|---------|------------|
| Expert card (Marcus Holm) | Display only |
| "Ring oss direkt: 08-5555 0200" | `tel:+46855550200` |

**Floating "Ring oss" CTA** (VERIFIED — appears when scrolled):
| Element | Destination |
|---------|------------|
| "Ring oss" pill | `tel:+46855550200` |

**BuyFlowFAQ** (shown on track step):
| Element | Destination |
|---------|------------|
| FAQ accordion items | Expand/collapse inline |

---

### 3.4 `/kop-bil-hjalp` — Bilköpshjälpen landning (KopBilConcierge)

**Type:** Public, CSR

**Header:** Standard pill nav (Sälj bil, Bilköpshjälpen, Priser, Bilspara) + Kostnadsfri konsultation.

**Expert cards** (INFERRED from EXPERTS array):
| Element | Destination |
|---------|------------|
| Marcus Holm card | Display only |
| Sofia Lindgren card | Display only |

**Steps section:** Display only (no clicks).

**CTAs** (INFERRED):
| Element | Destination |
|---------|------------|
| "Starta din förfrågan" / main CTA | → `onNavigateBuy()` → `/kop-bil/bestall` |
| FAQ accordion | Expand/collapse inline |

**ChevronDown accordions in FAQ** (INFERRED):
| Element | Destination |
|---------|------------|
| FAQ question | Toggles open/closed |

---

### 3.5 `/bilspara` — Bilspara (BilsparaPage)

**Type:** Public, CSR. Loads `campaign_cars` from Supabase.

**Header:** Standard pill nav.

**Hero search bar** (INFERRED from BilsparaPage code):
| Element | Destination |
|---------|------------|
| Search input | Filters campaign cards |
| Sök button | Applies filter |

**Quick picks row** (VERIFIED from BilsparaFilterPanel):
| Element | Destination |
|---------|------------|
| El-boom chip | Sets `drivmedel=['El']` filter |
| Miljöklipp chip | Sets `drivmedel=['El','Hybrid','Laddhybrid'], minSavings=30000` |
| Familjebil chip | Sets `karosser=['SUV','Kombi'], minSavings=20000` |
| Lyxdeal chip | Sets `marken=['Volvo','BMW','Audi'], minSavings=50000` |
| Blixt chip | Sets `minSavings=40000, mode='kop'` |
| "Rensa filter" (when active) | Resets to DEFAULT_FILTERS |

**Filter panel** (VERIFIED from BilsparaFilterPanel):
| Element | Destination |
|---------|------------|
| "Alla / Köp / Leasing" segmented | Sets `mode` |
| Minsta besparing slider (0–100k) | Sets `minSavings` |
| "Visa bara elbilar" toggle | Sets `drivmedel=['El']` or `[]` |
| "Ingår i köpet" toggle | Sets `bonusOnly` |
| Kampanjtyp chips (Demobil/Lagerrensning/Nybilskampanj) | Toggles `kampanjtyper[]` |
| Märke chips + search | Toggles `marken[]` |
| "Visa alla (N)" / "Visa färre" | Expands/collapses make list |
| Drivmedel chips (5 options) | Toggles `drivmedel[]` |
| Karosseri chips (5 options) | Toggles `karosser[]` |
| Maxpris slider (250k–700k, hidden in leasing mode) | Sets `maxPrice` |
| "Rensa" (desktop) | Resets filters |
| "Rensa alla filter" (mobile) | Resets filters |

**Sort selector** (INFERRED):
| Element | Destination |
|---------|------------|
| Sort dropdown (4 options) | Sets `sortKey` state |

**Campaign car cards** (INFERRED):
| Element | Destination |
|---------|------------|
| Campaign car card | Opens detail modal or → `/kop-bil/bestall?bil=[make+model]` |
| "Förhandla pris" / CTA button | → `/kop-bil/bestall` with car pre-filled |

**"Spara sökavisering" / Bell** (INFERRED from SearchAlertModal import):
| Element | Destination |
|---------|------------|
| Alert button | Opens `SearchAlertModal` |

**Mobile filter toggle:**
| Element | Destination |
|---------|------------|
| "Filter" button (mobile) | Shows/hides filter panel |

---

### 3.6 `/` (root) & `/sa-funkar-det` — Så funkar det (HowItWorks)

**Type:** Public, SSR

**Header nav:** Standard (see §2a HomePage variant with transparent→white scroll).

**Sell form** (on home):
| Element | Destination |
|---------|------------|
| RegInput | Updates regnummer |
| Telefon input | Updates telefon |
| Email input | Updates email |
| "Värdera bilen" | Submits → `SellCarPage` via `onNavigate()` |

**"Hur funkar det" steps:** Display only.

**Sticky ring CTA (mobile, ~line 1157)** (VERIFIED):
| Element | Destination |
|---------|------------|
| Expert avatar | Display only |
| Green status dot | Display only |
| CTA button (INFERRED) | Opens ConsultationDrawer or → sell flow |

**Nav CTAs:**
| Element | Destination |
|---------|------------|
| "Kostnadsfri konsultation" | `/gratis-konsultation` → ConsultationDrawer |
| "Köp bil med hjälp" | `/kop-bil` |
| "Sälj bilen" / "Värdera bilen" | Scroll-to-top + focus sell form |

---

### 3.7 `/vanliga-fragor` — Vanliga frågor (VanligaFragorPage)

**Type:** Public, CSR. VERIFIED (full file read).

**Header:** Standard pill nav (Sälj bil, Bilköpshjälpen, Priser, Bilspara) + mobile hamburger.
- navItems used: `['Sälj bil', 'Bilköpshjälpen', 'Priser', 'Bilspara']`

**FAQ accordion (3 groups, 14 questions total):**
| Element | Destination |
|---------|------------|
| Each question button | Toggles open/closed inline. Only one open at a time. |

**Footer CTA:**
| Element | Destination |
|---------|------------|
| "Kostnadsfri konsultation" | `/gratis-konsultation` → ConsultationDrawer |

**JSON-LD schema:** Injected (SEO, no click).

---

### 3.8 `/priser` — Priser (PriserPage)

**Type:** Public, CSR (not fully read — INFERRED from imports).

**Header:** Standard pill nav.
**Content:** Pricing table / comparison (INFERRED).

**CTAs** (INFERRED):
| Element | Destination |
|---------|------------|
| "Kom igång" / main CTA | → `/kop-bil/bestall` or ConsultationDrawer |
| Handlare signup CTA | → `/handlare/registrera` |

---

### 3.9 `/guider` & `/guider/[slug]` — Guider (GuidePage)

**Type:** Public, CSR (not fully read — INFERRED).

**Header:** Standard pill nav.

**Article list / grid** (INFERRED):
| Element | Destination |
|---------|------------|
| Guide article card | → `/guider/[slug]` |

**Individual guide article:**
| Element | Destination |
|---------|------------|
| "Tillbaka" | → `/guider` |
| In-article CTAs | → ConsultationDrawer or sell flow (INFERRED) |

---

### 3.10 `/om-oss` — Om oss (AboutPage)

**Type:** Public, CSR (partially read — line 52 only).

**Header:** Standard pill nav.
- navItems updated to `['Sälj bil', 'Bilköpshjälpen', 'Priser', 'Bilspara']`

**Founders section:**
| Element | Destination |
|---------|------------|
| Alexander (VD) founder card — photo `/Man_in_car_showroom_portrait copy.png` | Display only |

**CTAs** (INFERRED):
| Element | Destination |
|---------|------------|
| "Kom igång" | → ConsultationDrawer or sell flow |
| "Kontakta oss" | → ConsultationDrawer |

---

### 3.11 `/kontakt` — Kontakt (FreeConsultationPage)

**Type:** Public, CSR. 👻 **ORPHANED** — no nav or footer link points here.

**Content** (INFERRED): Contact form, advisor info, phone link.

---

### 3.12 `/nya-bilar` — Nya bilar (NyaBilarPage)

**Type:** Public, CSR. 👻 **LIKELY ORPHANED** — not found in any nav from code read.

**CTAs** (INFERRED from App.tsx props):
| Element | Destination |
|---------|------------|
| Car navigation | `onNavigateBuy(bil)` → `/kop-bil/bestall?bil=...&source=Nya bilar sida` |
| Consultation CTA | `onNavigateConsultation()` → ConsultationDrawer |
| Back | `onBack()` → `/` |

---

### 3.13 `/salj-bil-hjalp` — Sälj bil med hjälp (SaljBilMedHjalp)

**Type:** Public, CSR. 👻 **LIKELY ORPHANED** — not found in any nav from code read.

**Back:** `onBackHome()` → `/`

---

### 3.14 SEO Pages — `/forhandla-bil`, `/bilkopshjalp`, etc.

**Type:** Public, SSR. INFERRED from App.tsx routing.

Seven topic pages render `SeoTopicPage`. Linked from:
- `sitemap.xml` (SEO discovery)
- Possibly footer (not confirmed from read code)

| Element | Destination |
|---------|------------|
| CTA buttons | `onNavigateConsultation()` → ConsultationDrawer |
| Sell form | `onSell(reg)` → `/` + SellCarPage |

---

### 3.15 SEO City/Brand Pages — `/salj-din-bil-i-[stad]`, `/salj-din-[marke]`

**Type:** Public, SSR. Pattern-matched routes. Render `SeoLandingPage`.

| Element | Destination |
|---------|------------|
| Sell form | `onSell(reg)` → `/` |
| Back | `onBack()` → `/` |

---

### 3.16 `/webbplatskarta` — Webbplatskarta

**Type:** Public, CSR.

**Back:**
| Element | Destination |
|---------|------------|
| Back/home | `onBack()` → `/` |

Content: List of site links (INFERRED — acts as HTML sitemap page).

---

### 3.17 `/integritetspolicy` & `/anvandarvillkor` (PrivacyPage / TermsPage)

**Type:** Public, CSR.

**Header:** (INFERRED) Standard or minimal nav.
**Back:** `onBackHome()` → `/`

---

## 4. AUTH & CUSTOMER PORTAL

### 4.1 `/logga-in` — Kundportal login (CustomerLogin)

**Type:** Public page, auth check.
- Redirects to `/mina-bilar` if already logged in.

**CTAs** (INFERRED):
| Element | Destination |
|---------|------------|
| Email/password form + submit | Authenticates → `/mina-bilar` |
| "Glömt lösenord" | Magic link / reset flow (INFERRED) |
| Back | → `/` |

### 4.2 `/mina-bilar` — Kundöversikt (CustomerDashboard)

**Type:** Auth-required. Redirects to `/logga-in` if unauthenticated.

**CTAs** (INFERRED):
| Element | Destination |
|---------|------------|
| Car card | → `/min-bil/[token]` |
| Quote card | → `/min-forfragan/[token]` |
| Logga ut | Signs out, → `/logga-in` |

### 4.3 `/min-bil/[token]` — Min bil (MyCarPage)

**Type:** Token-authenticated.

| Element | Destination |
|---------|------------|
| Back | `onBack()` → `/` |
| Bid accept/decline buttons | Updates Supabase, shows confirmation |
| Expert contact | `tel:` link (INFERRED) |

### 4.4 `/min-forfragan/[token]` — Min förfrågan (MyQuotePage)

**Type:** Token-authenticated. Expert photo: `/Man_in_car_showroom_portrait copy.png` (VERIFIED).

| Element | Destination |
|---------|------------|
| Back | `onBack()` → `/` |
| Offer cards | Accept/decline (INFERRED) |
| Expert contact | Display + `tel:` (INFERRED) |

### 4.5 `/portal` — Portal callback (PortalCallbackPage)

**Type:** Auth callback.
| Element | Destination |
|---------|------------|
| On success | → `/mina-bilar` |
| Back | → `/logga-in` |

---

## 5. DEALER PORTAL

### 5.1 `/handlare/logga-in` — Handlare login (DealerLogin)

**Type:** Public page.
| Element | Destination |
|---------|------------|
| Login form | Authenticates → `/handlare/oversikt` |
| "Registrera dig" | → `/handlare/registrera` |
| Back | → `/` |

### 5.2 `/handlare/registrera` — Handlare registrering (DealerRegister, mode=landing)

**Type:** Public.
| Element | Destination |
|---------|------------|
| "Ansök nu" CTA | → `/handlare/ansok` |
| Back | → `/` |

### 5.3 `/handlare/ansok` — Handlare ansökan (DealerRegister, mode=form)

**Type:** Public.
| Element | Destination |
|---------|------------|
| Multi-step application form | Submits to Supabase |
| Back | → `/handlare/registrera` |

### 5.4 Dealer Portal Pages (all require auth + approved dealer)

All dealer pages share a `DealerShell` nav sidebar/mobile nav (INFERRED from DealerShell import).

**DealerShell nav** (INFERRED):
| Item | Route |
|------|-------|
| Översikt | `/handlare/oversikt` |
| Bilar | `/handlare/bilar` |
| Kampanjer | `/handlare/kampanjer` |
| Leads | `/handlare/leads-b` |
| Statistik | `/handlare/statistik` |
| Integrationer | `/handlare/integrationer` |
| Profil | `/handlare/profil` |
| Logga ut | Signs out → `/handlare/logga-in` |

**Routes in `onDealerApp` with no handler** 🔴:
- `/handlare/lager-b` — falls through to `DealerCarsList`
- `/handlare/mallar` — falls through to `DealerCarsList`
- `/handlare/motbud` — falls through to `DealerCarsList`

**`/handlare/oversikt`** — DealerOverview:
| Element | Destination |
|---------|------------|
| "Lägg till bil" | → `/handlare/bilar/ny` |
| Car row | → `/handlare/bilar/[id]` |
| "Lager-sync" | → `/handlare/lager` |
| "Inställningar" | → `/handlare/installningar` |

**`/handlare/kampanjer`** — DealerCampaigns:
| Element | Destination |
|---------|------------|
| "Ny kampanj" | → `/handlare/ny` |
| "Kostnadsbyggare" | → `/handlare/bygg` |

**`/handlare/bilar/ny`** — DealerAddCar:
| Element | Destination |
|---------|------------|
| Form submit | Creates car → `/handlare/bilar` |
| Back | → `/handlare/bilar` |

**`/handlare/bilar/[id]`** — DealerCarDetail:
| Element | Destination |
|---------|------------|
| Back | → `/handlare/bilar` |
| Edit actions | Update Supabase |

---

## 6. MODALS & WIZARDS

### 6.1 BuyDrawer — Köp-wizard (opened from CompareCarsPage and other pages)

**VERIFIED** from BuyDrawer.tsx (lines 356-362 area + full component structure).

Expert photo: `/Man_in_car_showroom_portrait copy.png` (VERIFIED).

The drawer hosts a condensed version of the BuyCarPage flow:

| Step | Element | Destination |
|------|---------|------------|
| Step 1 (track) | "Jag har hittat…" | Sets track='found' |
| Step 1 (track) | "Jag letar…" | Sets track='searching' |
| Step 1 (track) | "Jag vill byta…" | Sets track='trade' |
| Step 2 (details) | Form fields | Updates details state |
| Step 2 (details) | Nästa | → step 3 |
| Step 3 (contact) | Form + submit | Submits to Supabase, shows confirmation |
| All steps | Tillbaka / ✕ | Previous step / closes drawer |
| Confirmation | "Ring oss: 08-5555 0200" | `tel:+46855550200` |

### 6.2 ConsultationDrawer — Kostnadsfri konsultation

**Triggered by:** Any link/button pointing to `/gratis-konsultation` (intercepted globally in App.tsx), and `openConsultation()` calls.

| Element | Destination |
|---------|------------|
| Name / phone / email fields | Update state |
| Time preference | Updates state |
| Submit | POSTs to Supabase `consultation_bookings` |
| ✕ close | Closes drawer |

### 6.3 CarDetailSheet — Bildetaljer

**Opened from:** Car card "Läs mer" buttons in CompareCarsPage.

| Element | Destination |
|---------|------------|
| "Förhandla pris" CTA | Opens `BuyDrawer` |
| "Starta bilmatch" | Opens `CarFitQuiz` |
| ✕ / Tillbaka | Closes sheet |
| Specs/ratings | Display only |

### 6.4 SearchAlertModal — Spara sökavisering

**Opened from:** Bell icon in BilsparaPage and CompareCarsPage.

| Element | Destination |
|---------|------------|
| Email input | Updates state |
| Submit | Inserts into `bilspara_alerts` Supabase table |
| ✕ close | Closes modal |

### 6.5 CarFitQuiz / QuizFlow — Bilmatch

**Opened from:** CompareCarsPage quiz section, car cards, "Vet inte"-link.
**Also triggered by:** `?quiz=start` URL param.

| Element | Destination |
|---------|------------|
| Question options (body type, fuel, etc.) | Advances quiz state |
| "Tillbaka" | Previous question |
| "Klar / Visa resultat" | → `QuizComplete` → `QuizResults` |
| Results car card "Beställ" | Opens `BuyDrawer` |
| Results "Läs mer" | Opens `CarDetailSheet` |

### 6.6 CompareDrawer — Jämför bilar

**Opened from:** Selecting 2–4 car checkboxes in CompareCarsPage.

| Element | Destination |
|---------|------------|
| Car comparison table | Display only |
| "Förhandla" per car | Opens `BuyDrawer` for that car |
| ✕ close | Closes drawer |

### 6.7 TcoCompareBar — TCO-jämförelse

**Floats at bottom:** When 2 cars added to TCO compare.

| Element | Destination |
|---------|------------|
| "Jämför driftskostnad" | Expands full TCO view |
| ✕ remove car | Removes from TCO set |

---

## 7. ADMIN PORTAL

All admin routes require authenticated session + `get_is_admin()` RPC returning true.

**Admin nav** (INFERRED from `adminNavigate()` in App.tsx):
| Item | Route |
|------|-------|
| Översikt | `/admin/oversikt` |
| Leads | `/admin/leads` |
| Handlare | `/admin/handlare` |
| Katalog | `/admin/katalog` |
| Bokningar | `/admin/bokningar` |

**Key admin actions** (INFERRED):
| Page | Action | Destination |
|------|--------|------------|
| `/admin/bilar` | "Ny bil" | → `/admin/bilar/ny` |
| `/admin/bilar` | "Uppladdning" | → `/admin/uppladdning` |
| `/admin/bilar` | "Katalog" | → `/admin/katalog` |
| `/admin/bilar/[id]` | "Nytt förslag" | → `/admin/bilar/[id]/forslag/nytt` |
| `/admin/leads` | Open quote | → `/admin/forfragningar/[id]` (→ redirects to `/admin/leads`?) |
| Quote detail | "Nytt erbjudande" | → `/admin/erbjudanden/nytt/[id]` |
| Quote detail | "Konvertera" | → `/admin/bilar/ny` (with state) |
| `/admin/katalog` | "Importera" | → `/admin/katalog/importera` |
| `/admin/katalog` | "Uppdatera priser" | → `/admin/katalog/priser` |

**Note:** `/admin/forfragningar` redirects to `/admin/leads` 🔵 DUPLICATE route.

---

## 8. ISSUES SUMMARY

### 🔴 DEAD / BROKEN ROUTES

| Route | Issue |
|-------|-------|
| `/handlare/lager-b` | In `onDealerApp` boolean but no route handler → silently renders `DealerCarsList` |
| `/handlare/mallar` | Same — silently renders `DealerCarsList` |
| `/handlare/motbud` | Same — silently renders `DealerCarsList` |

### 🟡 EMPTY / NO-OP TARGETS

| Location | Element | Issue |
|----------|---------|-------|
| CompareCarsPage | Expert photo in sticky ring | Display only, no interaction |
| BilsparaPage | Sparpotential widget | Display only |
| Various | Green "online" status dot next to advisor | Display only — implies advisor is online but is static |

### 🔵 DUPLICATES (same destination, different entry points)

| Element A | Element B | Destination |
|-----------|-----------|------------|
| Desktop nav "Bilköpshjälpen" | MobileMenu "Hitta bil" | → `/kop-bil` |
| "Kostnadsfri konsultation" in header | "Kostnadsfri konsultation" in footer CTA section | → `/gratis-konsultation` |
| `/admin/forfragningar` route | `/admin/leads` route | Same `AdminLeadCommandCenter` component |
| "Tillbaka" chip on buy flow + back button | Logo click | → `onBack()` same destination |
| HomePage "Köp bil" tab search → `/kop-bil?q=` | CompareCarsPage's own search | Both filter the catalog |

### 👻 ORPHANED PAGES (no nav/link points to them from main flows)

| Route | Component | Notes |
|-------|-----------|-------|
| `/kontakt` | `FreeConsultationPage` | No menu entry. `/gratis-konsultation` (drawer) is used instead. |
| `/nya-bilar` | `NyaBilarPage` | No nav link found. May be linked from external ads or old sitemap. |
| `/salj-bil-hjalp` | `SaljBilMedHjalp` | No nav link found. |
| `/formedlingskalkylator` | Redirect → `/` | Dead-end redirect |
| `/formedla` | Redirect → `/` | Dead-end redirect |
| `/salj` | Redirect → `/kop-bil` | May be legacy URL |
| `/hitta-bil` | Redirect → `/kop-bil` | May be legacy URL |
| `/forhandling` | Redirect → `/kop-bil` | May be legacy URL |
| `/admin/forfragningar` | Redirect → `/admin/leads` | Legacy admin URL |

### ⚠️ OTHER ISSUES

| Issue | Detail |
|-------|--------|
| `/gratis-konsultation` is not a real page | App.tsx intercepts it and opens a drawer. Any direct browser navigation or external link results in the drawer opening then the URL being replaced with `/`. This works but may confuse deep-links. |
| `tel:+46855550200` phone number | Hardcoded in multiple places: BuyCarPage done-state, sticky floating CTA, BuyDrawer confirmation. If number changes, 4+ places need updating. |
| Advisor photo hardcoded across 6 files | `/Man_in_car_showroom_portrait copy.png` (space in filename) is individually referenced in HowItWorks, AboutPage, BuyCarPage, MyQuotePage, KopBilConcierge, BuyDrawer. |
| "Marcus Holm" name hardcoded in 3+ pages | BuyCarPage done-state, BuyDrawer, KopBilConcierge — all say "Marcus Holm" even though the expert slot is the same photo in all locations. |

---

## 9. LINK-TO-PAGE MATRIX (condensed)

Links that exist in the nav/footer and their reachability:

| Page | Reached from nav? | Reached from footer? | Reached from CTA? |
|------|------------------|---------------------|------------------|
| `/` | Logo, "Sälj bil" | — | Back buttons |
| `/kop-bil` | ✅ "Bilköpshjälpen" | ✅ (inferred) | ✅ Multiple CTAs |
| `/kop-bil/bestall` | — | — | ✅ All buy CTAs |
| `/bilspara` | ✅ nav item | — | — |
| `/priser` | ✅ nav item | — | — |
| `/guider` | ❌ removed from nav | ✅ footer | — |
| `/vanliga-fragor` | ❌ removed from nav | ✅ footer | — |
| `/om-oss` | MobileMenu only | — | — |
| `/sa-funkar-det` | HomePage desktop only | — | — |
| `/handlare/registrera` | — | — | Inferred footer |
| `/logga-in` | Desktop nav (homepage) | — | — |
| `/integritetspolicy` | — | ✅ footer | — |
| `/anvandarvillkor` | — | ✅ footer | — |
| `/webbplatskarta` | — | ✅ footer admin | — |
| `/kontakt` | ❌ **ORPHANED** | ❌ | ❌ |
| `/nya-bilar` | ❌ **ORPHANED** | ❌ | ❌ |
| `/salj-bil-hjalp` | ❌ **ORPHANED** | ❌ | ❌ |

---

## 10. FÖRHANDLARE-PORTALEN (Advisor Portal) — VERIFIED 2026-07-25

### 10a. Routes

| URL | Component | Type |
|-----|-----------|------|
| `/forhandlare` | `ForhandlarListPage` | Public, CSR |
| `/f/[slug]` | `ForhandlarProfilPage` | Public, CSR |
| `/forhandlare/registrera` | `ForhandlareOnboarding` | Public, CSR |
| `/forhandlare/portal` | `ForhandlarePortal` | Auth, CSR |
| `/forhandlare/logga-in` | `ForhandlareLogin` | Auth, CSR |

### 10b. Portal Tabs

| Tab | Content |
|-----|---------|
| Översikt | Stats: bokningar, profilvisningar, rating |
| Bokningar | Consultation bookings with status management + `ForhandlareBookingTimeline` |
| Profil | Editable profile (namn, telefon, stad, specialiteter, språk, bio, LinkedIn) |
| Inställningar | Konto-info, logga ut |

### 10c. Booking Timeline (booking_updates table)

| Feature | Detail |
|---------|--------|
| Table | `booking_updates` (id, booking_id, forhandlare_slug, status, message, created_at) |
| Statuses | kontaktad, soker_bil, forhandlar, klar, avbruten |
| Förhandlare | Can add updates via `ForhandlareBookingTimeline` component |
| Customer | Sees updates read-only via `CustomerBookingTimeline` in dashboard |
| Admin | Sees updates read-only via `CustomerBookingTimeline` in `/admin/bokningar` |
| Realtime | Supabase realtime subscriptions — no polling |
| RLS | SELECT for authenticated; INSERT for booking owner; append-only (no UPDATE/DELETE) |

### 10d. Admin Flow

| Step | Location |
|------|----------|
| Application review | `/admin/forhandlare` → `AdminForhandlareApplications` |
| Approval | Sets förhandlare status to approved, creates auth user |
| Login | Förhandlare logs in at `/forhandlare/logga-in` |
| Portal | `/forhandlare/portal` shows tabs based on `forhandlare` table profile |

---

*Updated: 2026-07-25 — förhandlare portal + booking timeline added, nav consistency fixed.*
