// ── Typer ──
export interface Vehicle {
  id: string;
  regnummer: string;
  make: string;
  model: string;
  year: number;
  fuel: string;
  mileage: number;
  city: string;
  image: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

export interface Dealer {
  id: string;
  name: string;
  city: string;
  initials: string;
  completedSales: number;
  avgAchievedPct: number;
  medianDaysToSale: number;
  rating: number;
  overpromiser: boolean;
}

export interface Offer {
  id: string;
  dealerId: string;
  vehicleId: string;
  expectedSalePrice: number;
  commission: number;
  expectedSaleTimeWeeks: string;
  submittedHoursAgo: number;
}

export interface PendingDealer {
  dealerName: string;
  city: string;
  expectedWithinHours: number;
}

// ── Format ──
export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE').format(amount) + ' kr';
}

export function ownerNet(o: Offer): number {
  return o.expectedSalePrice - o.commission;
}

export function offerSaleTimeLabel(o: Offer): string {
  return o.expectedSaleTimeWeeks;
}

// ── 8 exempelbilar ──
export const VEHICLES: Vehicle[] = [
  { id: 'v1', regnummer: 'ABC123', make: 'Volvo', model: 'XC60', year: 2021, fuel: 'Laddhybrid', mileage: 6420, city: 'Stockholm', image: '/getImage.webp' },
  { id: 'v2', regnummer: 'DEF456', make: 'BMW', model: '330e', year: 2022, fuel: 'Laddhybrid', mileage: 4800, city: 'Uppsala', image: '/getImage_(1).webp' },
  { id: 'v3', regnummer: 'GHI789', make: 'Audi', model: 'A6 Avant', year: 2020, fuel: 'Diesel', mileage: 8200, city: 'Stockholm', image: '/getImage_(2).webp' },
  { id: 'v4', regnummer: 'JKL012', make: 'Mercedes', model: 'GLC 300e', year: 2021, fuel: 'Laddhybrid', mileage: 5100, city: 'Göteborg', image: '/getImage_(3).webp' },
  { id: 'v5', regnummer: 'MNO345', make: 'Volkswagen', model: 'Golf GTI', year: 2022, fuel: 'Bensin', mileage: 3200, city: 'Malmö', image: '/getImage_(6).webp' },
  { id: 'v6', regnummer: 'PQR678', make: 'Tesla', model: 'Model 3', year: 2021, fuel: 'El', mileage: 7800, city: 'Stockholm', image: '/getImage_ioniq5.webp' },
  { id: 'v7', regnummer: 'STU901', make: 'Polestar', model: '2', year: 2022, fuel: 'El', mileage: 4100, city: 'Göteborg', image: '/getImage_polestar2.webp' },
  { id: 'v8', regnummer: 'VWX234', make: 'Kia', model: 'Ceed', year: 2020, fuel: 'Diesel', mileage: 9500, city: 'Lund', image: '/getImage_(7).webp' },
];

// ── 6 förmedlare ──
export const DEALERS: Dealer[] = [
  { id: 'd1', name: 'Nordic Auto', city: 'Stockholm', initials: 'NA', completedSales: 127, avgAchievedPct: 97, medianDaysToSale: 16, rating: 4.8, overpromiser: false },
  { id: 'd2', name: 'Bilpartner Stockholm', city: 'Stockholm', initials: 'BS', completedSales: 89, avgAchievedPct: 94, medianDaysToSale: 22, rating: 4.6, overpromiser: false },
  { id: 'd3', name: 'AutoMatch', city: 'Stockholm', initials: 'AM', completedSales: 203, avgAchievedPct: 98, medianDaysToSale: 12, rating: 4.9, overpromiser: false },
  { id: 'd4', name: 'Svea Bilförmedling', city: 'Göteborg', initials: 'SB', completedSales: 56, avgAchievedPct: 95, medianDaysToSale: 20, rating: 4.5, overpromiser: false },
  { id: 'd5', name: 'Premium Car Broker', city: 'Malmö', initials: 'PC', completedSales: 38, avgAchievedPct: 82, medianDaysToSale: 28, rating: 4.2, overpromiser: true },
  { id: 'd6', name: 'Nordmarken Auto', city: 'Uppsala', initials: 'NM', completedSales: 112, avgAchievedPct: 96, medianDaysToSale: 15, rating: 4.7, overpromiser: false },
];

// ── Erbjudanden på bil v1 (Volvo XC60) ──
export const OFFERS_V1: Offer[] = [
  { id: 'o1', dealerId: 'd1', vehicleId: 'v1', expectedSalePrice: 379000, commission: 14900, expectedSaleTimeWeeks: '2–3 veckor', submittedHoursAgo: 5 },
  { id: 'o2', dealerId: 'd3', vehicleId: 'v1', expectedSalePrice: 372000, commission: 9900, expectedSaleTimeWeeks: '1–2 veckor', submittedHoursAgo: 8 },
  { id: 'o3', dealerId: 'd5', vehicleId: 'v1', expectedSalePrice: 410000, commission: 16000, expectedSaleTimeWeeks: '3–4 veckor', submittedHoursAgo: 12 },
  { id: 'o4', dealerId: 'd2', vehicleId: 'v1', expectedSalePrice: 385000, commission: 18900, expectedSaleTimeWeeks: '3–4 veckor', submittedHoursAgo: 3 },
];

// ── Erbjudanden på bil v2 (BMW 330e) ──
export const OFFERS_V2: Offer[] = [
  { id: 'o5', dealerId: 'd6', vehicleId: 'v2', expectedSalePrice: 325000, commission: 12000, expectedSaleTimeWeeks: '2 veckor', submittedHoursAgo: 6 },
  { id: 'o6', dealerId: 'd1', vehicleId: 'v2', expectedSalePrice: 318000, commission: 11000, expectedSaleTimeWeeks: '2–3 veckor', submittedHoursAgo: 10 },
  { id: 'o7', dealerId: 'd5', vehicleId: 'v2', expectedSalePrice: 355000, commission: 14000, expectedSaleTimeWeeks: '4 veckor', submittedHoursAgo: 14 },
];

// ── Erbjudanden på bil v3 (Audi A6) ──
export const OFFERS_V3: Offer[] = [
  { id: 'o8', dealerId: 'd4', vehicleId: 'v3', expectedSalePrice: 305000, commission: 13000, expectedSaleTimeWeeks: '2–3 veckor', submittedHoursAgo: 4 },
  { id: 'o9', dealerId: 'd3', vehicleId: 'v3', expectedSalePrice: 298000, commission: 9000, expectedSaleTimeWeeks: '1–2 veckor', submittedHoursAgo: 7 },
];

// ── Väntande förmedlare på v1 ──
export const PENDING_V1: PendingDealer[] = [
  { dealerName: 'Nordbil', city: 'Örnsköldsvik', expectedWithinHours: 24 },
];

// ── Hjälpfunktioner ──
export function getDealer(id: string): Dealer | undefined {
  return DEALERS.find(d => d.id === id);
}

export function getOffersForVehicle(vehicleId: string): Offer[] {
  if (vehicleId === 'v1') return OFFERS_V1;
  if (vehicleId === 'v2') return OFFERS_V2;
  if (vehicleId === 'v3') return OFFERS_V3;
  return [];
}

export function getPendingForVehicle(vehicleId: string): PendingDealer[] {
  if (vehicleId === 'v1') return PENDING_V1;
  return [];
}

export function medianExpectedPrice(offers: Offer[]): number {
  if (offers.length === 0) return 0;
  const prices = offers.map(o => o.expectedSalePrice).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 === 0 ? Math.round((prices[mid - 1] + prices[mid]) / 2) : prices[mid];
}

export function isOverpromising(offer: Offer, allOffers: Offer[]): boolean {
  const median = medianExpectedPrice(allOffers);
  if (median === 0) return false;
  return offer.expectedSalePrice > median * 1.08;
}

export function highestNetOfferId(offers: Offer[]): string | null {
  if (offers.length === 0) return null;
  let best = offers[0];
  for (const o of offers) {
    if (ownerNet(o) > ownerNet(best)) best = o;
  }
  return best.id;
}

// ── Mock av regnr-uppslag ──
export function lookupByRegnr(regnr: string): Vehicle | null {
  const clean = regnr.trim().toUpperCase().replace(/\s/g, '');
  return VEHICLES.find(v => v.regnummer === clean) ?? null;
}

// ── Förmedlarens vy: nya förfrågningar ──
export interface DealerOpportunity {
  vehicleId: string;
  hoursAgo: number;
  existingBids: number;
}

export const DEALER_OPPORTUNITIES: DealerOpportunity[] = [
  { vehicleId: 'v4', hoursAgo: 2, existingBids: 1 },
  { vehicleId: 'v5', hoursAgo: 5, existingBids: 0 },
  { vehicleId: 'v6', hoursAgo: 8, existingBids: 2 },
  { vehicleId: 'v7', hoursAgo: 14, existingBids: 1 },
  { vehicleId: 'v8', hoursAgo: 20, existingBids: 0 },
];

// ── Förmedlarens uppdrag ──
export interface DealerAssignment {
  vehicleId: string;
  status: 'Bilen annonseras' | 'Köpare hittad' | 'Såld';
  agreedPrice: number;
  commission: number;
  daysInProgress: number;
}

export const DEALER_ASSIGNMENTS: DealerAssignment[] = [
  { vehicleId: 'v1', status: 'Bilen annonseras', agreedPrice: 379000, commission: 14900, daysInProgress: 4 },
  { vehicleId: 'v2', status: 'Köpare hittad', agreedPrice: 325000, commission: 12000, daysInProgress: 11 },
];
