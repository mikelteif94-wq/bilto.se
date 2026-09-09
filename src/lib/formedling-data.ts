export interface FormedlingVehicle {
  id: string;
  regnummer: string;
  vin: string;
  make: string;
  model: string;
  variant: string;
  modelYear: number;
  mileage: number;
  fuel: string;
  transmission: string;
  color: string;
  equipment: string[];
  serviceHistory: 'full' | 'partial' | 'missing';
  numKeys: number;
  tires: 'summer' | 'winter' | 'both';
  condition: 'excellent' | 'good' | 'normal' | 'needs_work';
  knownDamages: string | null;
  images: string[];
  ownerLocation: string;
  estimatedMarketValue: { low: number; high: number };
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPostalCode: string;
}

export interface FormedlingOffer {
  id: string;
  dealerId: string;
  dealerName: string;
  vehicleId: string;
  expectedSalePrice: number;
  commission: number;
  expectedOwnerNet: number;
  expectedSaleTime: string;
  offerExpiration: number;
  vehicleStorage: 'dealer' | 'owner' | 'agreed';
  includedServices: string[];
  rating: number;
  completedSales: number;
  badge?: string;
  comment: string;
}

export interface FormedlingDealer {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  completedSales: number;
  city: string;
  logo?: string;
}

export interface FormedlingCompletedSale {
  id: string;
  vehicleId: string;
  dealerId: string;
  dealerName: string;
  advertisedPrice: number;
  finalSalePrice: number;
  commission: number;
  platformFee: number;
  daysToSale: number;
  conditionAtSale: string;
}

export const PLATFORM_FEE = 2495;

export const DEMO_VEHICLE: FormedlingVehicle = {
  id: 'veh_001',
  regnummer: 'ABC123',
  vin: 'YV1A2A3B4L1234567',
  make: 'Volvo',
  model: 'XC60',
  variant: 'T6 Recharge AWD',
  modelYear: 2021,
  mileage: 6420,
  fuel: 'Laddhybrid',
  transmission: 'Automat',
  color: 'Svart',
  equipment: ['Dragkrok', 'Panoramatak', '360-kamera', 'Värmare', 'Premiumljud'],
  serviceHistory: 'full',
  numKeys: 2,
  tires: 'both',
  condition: 'excellent',
  knownDamages: null,
  images: [],
  ownerLocation: 'Stockholm',
  estimatedMarketValue: { low: 365000, high: 385000 },
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerPostalCode: '',
};

export const DEMO_OFFERS: FormedlingOffer[] = [
  {
    id: 'off_001',
    dealerId: 'd_001',
    dealerName: 'Nordic Auto',
    vehicleId: 'veh_001',
    expectedSalePrice: 379000,
    commission: 14900,
    expectedOwnerNet: 364100,
    expectedSaleTime: '14–21 dagar',
    offerExpiration: 48,
    vehicleStorage: 'dealer',
    includedServices: [
      'Professionell fotografering',
      'Annonsering',
      'Kundkontakt',
      'Visningar',
      'Provkörningar',
      'Prisförhandling',
      'Betalningshantering',
      'Ägarbyte',
    ],
    rating: 4.8,
    completedSales: 127,
    badge: 'Populärt val',
    comment: 'Vi ser fram emot att förmedla din Volvo XC60. Vårt team har lång erfarenhet av premiumbilar och vi har redan flera intresserade köpare i vårt nätverk.',
  },
  {
    id: 'off_002',
    dealerId: 'd_002',
    dealerName: 'Bilpartner Stockholm',
    vehicleId: 'veh_001',
    expectedSalePrice: 385000,
    commission: 18900,
    expectedOwnerNet: 366100,
    expectedSaleTime: '21–30 dagar',
    offerExpiration: 48,
    vehicleStorage: 'dealer',
    includedServices: [
      'Professionell fotografering',
      'Annonsering',
      'Kundkontakt',
      'Visningar',
      'Provkörningar',
      'Prisförhandling',
      'Betalningshantering',
      'Ägarbyte',
    ],
    rating: 4.6,
    completedSales: 89,
    badge: 'Högst beräknat netto',
    comment: 'Vi bedömer att din bil kan nå ett högt slutpris med rätt marknadsföring. Vi har specialiserat oss på Volvo och premiumsegmentet.',
  },
  {
    id: 'off_003',
    dealerId: 'd_003',
    dealerName: 'AutoMatch',
    vehicleId: 'veh_001',
    expectedSalePrice: 372000,
    commission: 9900,
    expectedOwnerNet: 362100,
    expectedSaleTime: '10–18 dagar',
    offerExpiration: 48,
    vehicleStorage: 'agreed',
    includedServices: [
      'Professionell fotografering',
      'Annonsering',
      'Kundkontakt',
      'Visningar',
      'Provkörningar',
      'Prisförhandling',
      'Betalningshantering',
      'Ägarbyte',
    ],
    rating: 4.9,
    completedSales: 203,
    badge: 'Snabbast',
    comment: 'Vi är kända för snabba försäljningar och låga avgifter. Din XC60 är en eftertraktad modell som vi förväntar oss att sälja inom två veckor.',
  },
];

export const DEMO_DEALERS: FormedlingDealer[] = [
  { id: 'd_001', name: 'Nordic Auto', verified: true, rating: 4.8, completedSales: 127, city: 'Stockholm' },
  { id: 'd_002', name: 'Bilpartner Stockholm', verified: true, rating: 4.6, completedSales: 89, city: 'Stockholm' },
  { id: 'd_003', name: 'AutoMatch', verified: true, rating: 4.9, completedSales: 203, city: 'Stockholm' },
  { id: 'd_004', name: 'Svea Bilförmedling', verified: true, rating: 4.5, completedSales: 56, city: 'Göteborg' },
  { id: 'd_005', name: 'Nordmarken Auto', verified: true, rating: 4.7, completedSales: 112, city: 'Uppsala' },
  { id: 'd_006', name: 'Premium Car Broker', verified: true, rating: 4.4, completedSales: 38, city: 'Malmö' },
  { id: 'd_007', name: 'AutoMäklarna', verified: true, rating: 4.8, completedSales: 94, city: 'Stockholm' },
  { id: 'd_008', name: 'BilFormidling Syd', verified: true, rating: 4.3, completedSales: 27, city: 'Lund' },
];

export const DEMO_OPPORTUNITIES = [
  {
    id: 'opp_001',
    make: 'Volvo',
    model: 'XC60 T6 Recharge',
    year: 2021,
    mileage: 6420,
    city: 'Stockholm',
    fuel: 'Laddhybrid',
    marketLow: 365000,
    marketHigh: 385000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_002',
    make: 'BMW',
    model: '330e M Sport',
    year: 2022,
    mileage: 4800,
    city: 'Uppsala',
    fuel: 'Laddhybrid',
    marketLow: 315000,
    marketHigh: 335000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_003',
    make: 'Audi',
    model: 'A6 Avant',
    year: 2020,
    mileage: 8200,
    city: 'Stockholm',
    fuel: 'Diesel',
    marketLow: 295000,
    marketHigh: 320000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_004',
    make: 'Mercedes',
    model: 'GLC 300e',
    year: 2021,
    mileage: 5100,
    city: 'Göteborg',
    fuel: 'Laddhybrid',
    marketLow: 410000,
    marketHigh: 440000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_005',
    make: 'Volkswagen',
    model: 'Golf GTI',
    year: 2022,
    mileage: 3200,
    city: 'Malmö',
    fuel: 'Bensin',
    marketLow: 285000,
    marketHigh: 310000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_006',
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2021,
    mileage: 7800,
    city: 'Stockholm',
    fuel: 'El',
    marketLow: 255000,
    marketHigh: 285000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_007',
    make: 'Polestar',
    model: '2 Performance',
    year: 2022,
    mileage: 4100,
    city: 'Göteborg',
    fuel: 'El',
    marketLow: 345000,
    marketHigh: 375000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_008',
    make: 'Kia',
    model: 'Ceed Sportswagon',
    year: 2020,
    mileage: 9500,
    city: 'Lund',
    fuel: 'Diesel',
    marketLow: 165000,
    marketHigh: 185000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_009',
    make: 'Skoda',
    model: 'Octavia Combi',
    year: 2021,
    mileage: 6800,
    city: 'Uppsala',
    fuel: 'Bensin',
    marketLow: 195000,
    marketHigh: 220000,
    ownerSeeks: 'Förmedlare',
  },
  {
    id: 'opp_010',
    make: 'Volvo',
    model: 'V90 D5 AWD',
    year: 2020,
    mileage: 8900,
    city: 'Stockholm',
    fuel: 'Diesel',
    marketLow: 335000,
    marketHigh: 365000,
    ownerSeeks: 'Förmedlare',
  },
];

export const DEMO_DEALER_STATS = {
  newOpportunities: 12,
  activeOffers: 8,
  activeAssignments: 6,
  soldThisMonth: 12,
  avgSaleTime: 18,
  conversionRate: 31,
};

export const DEMO_ADMIN_STATS = {
  incomingVehicles: 327,
  activeDealers: 48,
  offers: 891,
  acceptedOffers: 184,
  sold: 126,
  gmv: 42800000,
  platformRevenue: 314370,
  avgPlatformFee: 2495,
  avgDaysToSale: 18,
  offerRate: 72,
};

export const DEMO_REVIEWS = [
  {
    name: 'Johan',
    city: 'Stockholm',
    text: 'Jag slapp lägga ut bilen själv och kunde jämföra tre firmor innan jag bestämde mig.',
    stars: 5,
  },
  {
    name: 'Sara',
    city: 'Uppsala',
    text: 'Det var framför allt skönt att kunna se vad jag faktiskt skulle få efter avgiften.',
    stars: 5,
  },
  {
    name: 'Förmedlingspartner',
    city: 'Stockholm',
    text: 'Vi fick in en bil vi gärna ville förmedla utan att lägga pengar på annonser för att hitta säljaren.',
    stars: 5,
  },
  {
    name: 'Erik',
    city: 'Göteborg',
    text: 'Hela processen var smidig. Tre erbjudanden på en dag och jag kände mig trygg i valet.',
    stars: 4,
  },
];

export const FAQ_ITEMS = [
  {
    q: 'Kostar tjänsten något för mig som bilägare?',
    a: 'Nej, tjänsten är helt kostnadsfri för dig som bilägare. Du betalar ingenting för att lägga in din bil eller ta emot erbjudanden.',
  },
  {
    q: 'Hur tjänar plattformen pengar?',
    a: 'Plattformen tar en fast avgift av förmedlaren när en bil faktiskt säljs. Du som bilägare betalar aldrig något till plattformen.',
  },
  {
    q: 'Måste jag acceptera ett erbjudande?',
    a: 'Nej, du är inte skyldig att acceptera något. Du kan välja att gå vidare med ett erbjudande eller avböja alla.',
  },
  {
    q: 'Vem äger bilen under förmedlingen?',
    a: 'Du behåller ägandeskapet av bilen under hela förmedlingen. Först när bilen är såld och betald sker ägarbyte till slutköparen.',
  },
  {
    q: 'Var står bilen?',
    a: 'Det varierar beroende på förmedlare. Vissa förvarar bilen hos sig, andra hos dig. Detta anges tydligt i varje erbjudande.',
  },
  {
    q: 'Är försäljningspriset garanterat?',
    a: 'Nej, det förväntade försäljningspriset är en uppskattning från förmedlaren och inte ett garanterat slutpris. Det faktiska priset beror på marknaden och slutköparen.',
  },
  {
    q: 'Vad händer om bilen inte säljs?',
    a: 'Om bilen inte säljs inom den överenskomna perioden kan du välja en ny förmedlare eller avsluta uppdraget. Du betalar ingenting.',
  },
  {
    q: 'Hur verifieras förmedlarna?',
    a: 'Vi kontrollerar alla förmedlare innan de får delta på plattformen. Det inkluderar bolagsprövning, referenser och branschhistorik.',
  },
  {
    q: 'Kan jag ta bort min bil?',
    a: 'Ja, du kan när som helst ta bort din bil från plattformen om du inte längre vill sälja den.',
  },
  {
    q: 'Hur lång tid tar en försäljning?',
    a: 'Det varierar beroende på bil och förmedlare. I snitt tar det 10–30 dagar. Försäljningstiden anges i varje erbjudande.',
  },
];

export const COMPARISON_OPTIONS = [
  {
    title: 'Sälj privat',
    description: 'Potentiellt högre slutpris, men du hanterar annonsering, meddelanden, visningar, provkörningar, förhandling och betalning själv.',
    comfort: 'Låg',
    comfortLevel: 1,
    recommended: false,
  },
  {
    title: 'Sälj direkt till handlare',
    description: 'Snabbt och enkelt, men handlaren köper bilen för vidareförsäljning och behöver därför marginal.',
    comfort: 'Mycket hög',
    comfortLevel: 4,
    recommended: false,
  },
  {
    title: 'Förmedling',
    description: 'Balansen mellan pris och bekvämlighet. En professionell förmedlare sköter försäljningen åt dig.',
    comfort: 'Hög',
    comfortLevel: 3,
    recommended: true,
  },
];

export const TRUST_CARDS = [
  {
    icon: 'shield',
    title: 'Verifierade förmedlare',
    text: 'Vi kontrollerar företagen innan de får lämna erbjudanden.',
  },
  {
    icon: 'receipt',
    title: 'Tydliga avgifter',
    text: 'Se vad förmedlingen kostar innan du väljer.',
  },
  {
    icon: 'compare',
    title: 'Jämför erbjudanden',
    text: 'Jämför pris, tid, villkor och betyg.',
  },
  {
    icon: 'check',
    title: 'Du bestämmer',
    text: 'Du väljer själv om och vilket erbjudande du vill gå vidare med.',
  },
];

export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE').format(amount) + ' kr';
}
