# Bilto — Komplett designspecifikation

> Dokument för överlämning till utvecklare. Beskriver visuellt system, sidor, komponenter och interaktionsmönster.

---

## 1. Varumärke & känsla

**Bilto** är en bilmäklartjänst som förenklar bilaffärer — sälj, köp eller byt bil med en personlig expert på din sida.

**Ton:** Professionell, varm, trygg, modern. Inte lekfull — utan självsäker och ren.

**Känsla:** Premium fintech möter bilbranschen. Mörka hero-sektioner med fotografisk bilbakgrund, ljusa innehållssectioner med mycket luft. Kontrasten mellan mörkt och ljust skapar rytm.

---

## 2. Färgsystem

### Huvudpalett

| Token | Hex | Användning |
|---|---|---|
| **Bilto Blue 500** | `#0e6efe` | Primär brandfärg, knappar, accenter, floating headers |
| **Bilto Blue 600** | `#0a57cc` | Hover-state på primära knappar |
| **Bilto Blue 400** | `#5e96ff` | Ljusare accent |
| **Dark Navy** | `#0a0f1a` | Hero-bakgrund, mörka sektioner |
| **Darker Navy** | `#060e1e` / `#030b16` | Footer-gradient |
| **Cream/Off-white** | `#faf8f5` | Sidobakgrund (ljusa sektioner) |
| **White** | `#ffffff` | Kort, innehållssectioner |
| **Slate 900** | `#0f172a` | Rubriker på ljus bakgrund |
| **Slate 500** | `#64748b` | Brödtext på ljus bakgrund |
| **Slate 400** | `#94a3b8` | Muted text, etiketter |
| **Emerald 500** | `#10b981` | Success, checkmarks |
| **Amber 400** | `#fbbf24` | Stjärnor i recensioner, gold-accent |

### Färgramper (Tailwind-config)

```
bilto:  50:#eef5ff  100:#daeaff  200:#bdd7ff  300:#90bbff  400:#5e96ff  500:#0e6efe  600:#0a57cc  700:#0846a8  800:#063785  900:#042d6c
gold:   400:#fbbf24  500:#f59e0b  600:#d97706  700:#b45309
ink:    700:#1e4278  800:#13315c  900:#0b2545  950:#030b18
cream:  50:#f6faff  100:#eaf3ff  200:#d6e6fb
sand:   50:#f8f7f4  100:#f2efea  200:#e8e3da
```

### Användningsmönster

- **Mörka sektioner:** `bg-[#0a0f1a]` med vit text. Text opaciteter: `text-white` (rubriker), `text-white/65` (brödtext), `text-white/35` (etiketter), `text-white/45` (beskrivning).
- **Ljusa sektioner:** `bg-white` eller `bg-[#faf8f5]`. Slate-färger för text.
- **Kort på mörk bakgrund:** `border border-white/8 bg-white/4 hover:bg-white/8`.
- **Floating header (sälj/köp-flöden):** `bg-[#0e6efe]` med `ring-1 ring-white/10` och `shadow-lg`.
- **Gradienter:** Footer `linear-gradient(180deg, #060e1e, #030b16)`. Top accent bars `linear-gradient(90deg, rgba(251,191,36,0.7), rgba(255,255,255,0.4), rgba(56,189,248,0.6))`.

---

## 3. Typografi

**Font:** Inter (self-hosted woff2, latin + latin-ext subsets).

| Element | Storlek | Vikt | Line-height | Letter-spacing |
|---|---|---|---|---|
| H1 (hero) | `clamp(1.75rem, 5vw, 4.5rem)` | 900 (black) | 1.0 | -0.03em |
| H2 (section) | `36px` / `48px` (sm) | 900 (black) | 1.05 | -0.02em |
| H3 (kort) | `20px` / `26px` (sm) | 700 (bold) | tight | -0.01em |
| Brödtext | `15px` / `17px` | 400 (normal) | 1.6 (relaxed) | normal |
| Etikett (label) | `11px` / `12px` | 700 (bold) | — | 0.20em, UPPERCASE |
| Knapp | `13px` / `15px` | 600 (semibold) | — | normal |
| Mikrotext | `12px` / `13px` | 500 (medium) | 1.5 | normal |

**Rubriker:** Alltid `font-black` (900) eller `font-bold` (700) med tight line-height och negativ letter-spacing för modern premium-känsla.

**Etiketter:** `text-[11px] font-bold uppercase tracking-[0.20em]` — används som sektionspre-titel ovanför varje H2. Färg: `text-slate-400` (ljust) eller `text-white/35` (mörkt).

---

## 4. Avrundningar & spacing

**Border radius:** Allt använder `7px` som standard (Tailwind DEFAULT). Undantag:
- Knappar och inputs: `rounded-xl` (12px i praktiken via custom)
- Kort: `rounded-xl`
- Full-rounded: `rounded-full` för badges, pillar, progress bars

**Spacing system:** 8px-bas. Vanliga värden: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `py-24` / `py-32` för sektioner.

**Maxbredder:**
- Innehåll: `max-w-5xl` (1024px) för de flesta sektioner
- Breda sektioner: `max-w-6xl` (1152px) eller `max-w-7xl` (1280px)
- Formulär: `max-w-lg` (512px)
- Hero-content: `max-w-xl` (576px)

---

## 5. Skuggor

| Namn | Värde | Användning |
|---|---|---|
| card | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Standard kort |
| card-hover | `0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)` | Hover på kort |
| card-active | `0 0 0 3px rgba(14,110,254,0.15), 0 4px 16px rgba(14,110,254,0.12)` | Aktivt/fokuserat kort |
| cta | `0 4px 14px rgba(14,110,254,0.35)` | Primär CTA-knapp |
| cta-hover | `0 6px 20px rgba(14,110,254,0.45)` | Hover på CTA |
| Hero-kort | `0 32px 80px rgba(0,0,0,0.5)` | Hero action card |

---

## 6. Knappar

### Primär (dark)
```
bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-xl px-6 h-13 text-[15px]
```

### Primär (brand blue) — floating headers
```
bg-white text-[#0e6efe] font-semibold rounded-xl px-5 hover:bg-slate-100
```

### CTA med gradient
```
background: linear-gradient(135deg, #1a7fff, #0e6efe, #0a57cc)
box-shadow: 0 4px 14px rgba(14,110,254,0.30)
hover: translateY(-1px), box-shadow: 0 6px 20px rgba(14,110,254,0.42)
```

### Sekundär (outline)
```
border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold rounded-xl
```

### Gold accent
```
background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)
box-shadow: 0 4px 14px rgba(245,158,11,0.28)
```

**Interaktion:** `active:scale-[0.99]` på alla klickbara element. `transition` eller `transition-all duration-300`.

---

## 7. Layout & sidstruktur

### Allmän siddesign
- Mobil: `px-5`, desktop: `px-6` eller `px-10`
- Sektioner: `py-24 sm:py-32` för generös andning
- Container: `max-w-[1400px] mx-auto` för header, `max-w-5xl` / `max-w-6xl` för innehåll

### Header (startsida)
- Fixed, `h-[53px]` mobil / `h-16` desktop
- Transparent över hero, övergår till `bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100` vid scroll
- Logo: vit (brightness invert) på mörk hero, svart när scrolled
- Center-nav: Bilköpshjälpen, Säljhjälpen, Så funkar det
- Höger: Logga in (ikon), Kostnadsfri konsultation (knapp)

### Header (sälj/köp-flöden)
- Floating: `top-3 inset-x-3 lg:top-4 lg:inset-x-32`
- `bg-[#0e6efe] rounded-xl shadow-lg ring-1 ring-white/10`
- Logo + konsultation-knapp till höger

### Footer
- Mörk gradient: `linear-gradient(180deg, #060e1e, #030b16)`
- Top accent bar: 2px gradient (blue → white → sky blue)
- Decorative radial glows (blue + gold) i bakgrunden
- 4-kolumn grid: Brand+kontakt, Tjänster, Resurser, Trygghet
- Trust signals: GDPR (emerald), SSL (bilto blue)
- Botten: copyright, "Gjord med omsorg i Sverige", Staff/Admin länkar

---

## 8. Sidor

### 8.1 Startsida (HomePage)

**Hero:**
- Full viewport height (`min-height: 100svh`)
- Bakgrund: bilfoto `opacity-30`, `object-cover`, `object-position: center 55%`
- Gradient overlay: `from-[#0a0f1a]/20 via-transparent to-[#0a0f1a]`
- Headline: `clamp(1.75rem, 5vw, 4.5rem)` font-black vit
- Subheadline: `text-white/65 max-w-lg`
- Action card: vit `rounded-xl` med kraftig skugga, innehåller tabs (Sälj bil / Bilköpshjälp)
- Sälj-tab: RegInput + "Värdera bilen" knapp
- Hitta-tab: 3 valkort (Hittat bil, Letar bil, Byt bil) med ikoner
- Scroll-hint: vertikal linje + "SCROLLA" text
- Bil-illustration (SVG) i botten

**Stats-sektion:**
- Mörk `bg-[#0a0f1a]`, `border-t border-white/8`
- 4 kolumner: `12 000+ Bilar sålda`, `48h Snitt säljtid`, `500+ Certifierade handlare`, `4.9/5 Kundbetyg`
- Stora siffror `text-[30px] sm:text-[38px] font-black tabular-nums`

**Så funkar det (3 steg):**
- Vit sektion
- 3 kort i `bg-[#faf8f5]` som hover:ar till `bg-slate-900` (mörk) med vit text — dramatisk hover-effekt
- Numrerade 01, 02, 03 + ikon i vit box
- CTA-knapp: "Värdera bilen" med pil

**Personlig service:**
- Mörk sektion
- 3 kort med `border-white/8 bg-white/4 hover:bg-white/8`
- Ikon i `bg-white/10` box
- CTA: "Prata med en mäklare" (vit knapp) + checkmark-text

**Fördelar (3 rader):**
- Vit sektion
- List-format med divider lines
- 3-kolumn grid per rad: nummer, titel+text, checkmark-lista

**Recensioner:**
- Mörk sektion
- 2x2 grid med recensionskort
- 5 stjärnor (amber), citat, avatar+namn
- Rating: 4.9 (2 400+)

**CTA-sektion:**
- Vit, centrerad
- "Få ett skarpt bud på din bil"
- Två knappar + trust-rad (Clock, Shield, TrendingUp)

### 8.2 Sälj bil-flöde (SellCarPage)

- 5-stegs wizard: Skick → Utrustning → Bilder → Kontakt → Bekräfta
- Progress bar: `h-1.5` segment, fylls med `bg-[#0e6efe]`
- Floating blue header
- Maxbredd `max-w-lg` för formulär
- "Tillbaka"-knapp med ChevronLeft
- Stegtitel som H1

### 8.3 Köp bil-flöde (BuyCarPage)

- Track-val: Hittat bil / Letar bil / Byt bil
- Hero-sektion i `bg-[#0e6efe]` med vit text
- "Spara 15 000 kr eller mer på din nästa bil"
- Multi-stegs formulär
- Trust-badges: Inga bindningar, Svar inom 24h, 4 995 kr om affären blir av

### 8.4 Så funkar det (HowItWorks)

- kombinerar sälj- och köp-perspektiv
- 3 steg-kort med foton
- FAQ-accordion
- RegInput i hero
- Populära bilar-sektion med bilkort
- Kalender-widget för konsultation

---

## 9. Nyckelkomponenter

### RegInput (Registreringsnummer-input)
- `h-14 rounded-xl border border-slate-300`
- Blå prefix-box `bg-[#0e6efe]` med "S"
- Input: `text-[18px] font-bold tracking-widest italic`
- Grön checkmark när giltigt (`/^[A-Z]{3}\d{2}[A-Z0-9]$/`)
- Validerar svenska regnummer-format, filtrerar ogiltiga bokstäver (I, Q, Å, Ä, Ö)

### Kort (mörk sektion)
```
rounded-xl border border-white/8 bg-white/4 p-7 hover:bg-white/8 transition-all duration-300
```

### Kort (ljus sektion) — hover to dark
```
bg-[#faf8f5] hover:bg-slate-900 rounded-xl p-8 transition-all duration-300
```
Hover: text och ikoner byter från slate till white.

### Step-kort med nummer
- Nummer: `text-[13px] font-bold text-slate-300 tabular-nums tracking-wider`
- Ikon: `w-10 h-10 rounded-xl bg-white shadow-sm`

### Etikett (section label)
```
text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em]
```

---

## 10. Animationer & mikrointeraktioner

### Scroll-animations
- IntersectionObserver med `threshold: 0.10`
- `data-animate` attribut på sektioner
- `opacity-0 translate-y-10` → `opacity-100 translate-y-0` vid synlighet
- `transition-[opacity,transform] duration-700`

### Hover-effekter
- Kort: `hover:bg-white/8` eller `hover:bg-slate-900` (dramatisk)
- Knappar: `active:scale-[0.99]`, `hover:translateY(-1px)`
- Länkar: `hover:pl-1` (subtil indent)
- Pilar: `group-hover:translate-x-0.5`

### Keyframe-animationer (Tailwind config)
- `shimmer` — loading skeleton
- `fadeInUp` — 0.6s ease-out
- `fadeIn` — 0.4s
- `slideInLeft` — 0.5s
- `pulseGlow` — blå glow-puls, 2.4s
- `float` — 3s, -4px amplitude

### Header scroll
- Threshold: `window.innerHeight * 0.8`
- Transparent → solid vit med backdrop-blur

### Spinner
```
w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin
```

---

## 11. Ikonografi

**Bibliotek:** lucide-react

**Stroke width:** 1.8 för kort-ikoner, 2 för knappar/badges, 2.5 för error-indikatorer

**Vanliga ikoner:** Car, Search, Handshake, Shield, Clock, TrendingUp, Star, CheckCircle, ChevronRight, ChevronLeft, ArrowRight, Menu, User, Mail, Phone, MapPin, Sparkles, X, XCircle

**Ikon-boxar:** `w-10 h-10 rounded-xl` med `bg-white/10` (mörkt) eller `bg-slate-100` (ljust)

---

## 12. Responsiv design

| Breakpoint | Beteende |
|---|---|
| < 640px (mobil) | Single column, `px-5`, hamburger-meny, `text-[14px]` på knappar |
| 640px–1024px (tablet) | 2-kolumn grid, `px-6`, större typografi |
| > 1024px (desktop) | Full multi-kolumn, center-nav synlig, `px-10` |

**Mobil-specifikt:**
- Input font-size tvingas till `16px` (förhindrar iOS zoom)
- Header: `h-[53px]`, hamburger-meny
- Hero headline: `clamp(1.75rem, 5vw, 4.5rem)`
- Floating header: `top-3 inset-x-3`

---

## 13. Formulär-design

### Input-bas
```
h-12 px-4 text-[15px] bg-white border border-slate-200 rounded-md
focus:border-bilto-500 focus:ring-2 focus:ring-bilto-500/15
box-shadow: 0 1px 2px rgba(0,0,0,0.04)
hover: border-color #94a3b8
```

### Error-state
```
border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/15
```

### Select
- Custom chevron via SVG background-image
- `appearance-none pr-10`

### Error-banner
```
rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium px-3.5 py-2.5
```
Med XCircle-ikon (strokeWidth 2.5).

---

## 14. Mönster & detaljer

### Trust-badges
```
inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-[12px] font-medium
```

### Gradient text
```css
background: linear-gradient(135deg, #0e6efe, #38bdf8);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Noise overlay
- SVG fractal noise, `opacity: 0.03`, `pointer-events: none`

### Decorative glows (footer)
- Radial gradient circles: `rgba(14,110,254,0.06)` och `rgba(245,158,11,0.04)`

---

## 15. Teknisk stack

- **React + TypeScript** (Vite)
- **Tailwind CSS** med custom config (se färg- och animationstabeller ovan)
- **lucide-react** för ikoner
- **Inter** font (self-hosted woff2)
- **Supabase** för databas, auth och edge functions
- Ingen routing-library — custom path-baserad routing via `window.history.pushState` + `popstate`

---

## 16. Sammanfattning av designprinciper

1. **Mörkt/ljust-rytm:** Alternera mörka (`#0a0f1a`) och ljusa (`#ffffff` / `#faf8f5`) sektioner för visuell puls.
2. **Typografisk hierarki:** Svarta (900) rubriker med tight spacing mot avslappnad (400) brödtext.
3. **Minimal dekor:** Färgaccenten är blå (`#0e6efe`). Guld används sparsamt (stjärnor, accent bars). Inga lila/violetta toner.
4. **Generös whitespace:** `py-24 sm:py-32` mellan sektioner. Andas.
5. **Subtila animationer:** Scroll-reveal, hover-lift, arrow-nudge. Aldrig överdrivet.
6. **Kontrast alltid:** Vit text på mörkt, slate-900 på ljust. Etiketter i muted opaciteter.
7. **Premium-känsla:** Djupa skuggor på hero-kort (`0 32px 80px`), subtila ringar på kort, backdrop-blur på headers.
8. **Mobil-först:** Alla flöden fungerar single-column på mobil, expanderar till multi-kolumn på desktop.
