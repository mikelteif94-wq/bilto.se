// Mock data for Förhandla — certified car negotiators (customer-side agents).
// No backend yet; all copy is in Swedish, code/comments in English.

export type Certifiering = 'Trainee' | 'Certifierad' | 'Senior' | 'Elite' | 'Master';

export interface Forhandlare {
  id: string;
  slug: string;
  name: string;
  certifiering: Certifiering;
  bio: string;
  specialties: string[];
  languages: string[];
  city: string;
  avatarUrl: string | null;
  feeKr: number;
  rating: number;
  reviewCount: number;
  dealCount: number;
  avgSavingKr: number;
  responseTimeHours: number;
  verifiedReviews: Review[];
}

export interface Review {
  id: string;
  author: string;
  city: string;
  car: string;
  savingKr: number;
  rating: number;
  text: string;
  date: string;
}

export const FORHANDLARE: Forhandlare[] = [
  {
    id: 'f1',
    slug: 'anna-lindqvist',
    name: 'Anna Lindqvist',
    certifiering: 'Senior',
    bio: 'Tolv år i branschen, först som säljare — nu på din sida av bordet. Specialist på premiumsegmentet och elbilar. Jag har sett alla knep och vet exakt var marginalen gömmer sig.',
    specialties: ['Premium', 'Elbilar', 'SUV'],
    languages: ['Svenska', 'Engelska', 'Tyska'],
    city: 'Stockholm',
    avatarUrl: null,
    feeKr: 4995,
    rating: 4.9,
    reviewCount: 127,
    dealCount: 184,
    avgSavingKr: 23400,
    responseTimeHours: 1,
    verifiedReviews: [
      {
        id: 'r1',
        author: 'Nina',
        city: 'Stockholm',
        car: 'Kia EV6',
        savingKr: 22000,
        rating: 5,
        text: 'Anna hittade en dold avgift som handlaren "glömt" nämna. Slutpris 22 000 kr lägre än första budet.',
        date: '2026-06-14',
      },
      {
        id: 'r2',
        author: 'Pär',
        city: 'Solna',
        car: 'VW ID.4',
        savingKr: 28500,
        rating: 5,
        text: 'Första budet var 415 000. Anna fick ner det till 386 500 — och bättre ränta. Värt varje krona.',
        date: '2026-05-30',
      },
      {
        id: 'r3',
        author: 'Sofia',
        city: 'Stockholm',
        car: 'Audi Q5',
        savingKr: 19000,
        rating: 4,
        text: 'Kall och skarp på priset, varm och tydlig mot mig. Rekommenderas.',
        date: '2026-05-12',
      },
    ],
  },
  {
    id: 'f2',
    slug: 'marcus-berg',
    name: 'Marcus Berg',
    certifiering: 'Elite',
    bio: 'Före detta bilhandlare med 15 år på fältet. Nu representerar jag bara köparen. Jag vet vad en bil är värd på riktigt — och vad handlaren kan ta i förhand.',
    specialties: ['Familjebilar', 'Kombi', 'Inbyte'],
    languages: ['Svenska', 'Engelska'],
    city: 'Göteborg',
    avatarUrl: null,
    feeKr: 5995,
    rating: 4.8,
    reviewCount: 98,
    dealCount: 142,
    avgSavingKr: 26800,
    responseTimeHours: 2,
    verifiedReviews: [
      {
        id: 'r4',
        author: 'Johan',
        city: 'Göteborg',
        car: 'Volvo V60',
        savingKr: 31000,
        rating: 5,
        text: 'Marcus ringde tre handlare på en förmiddag. Jag fick bud från fyra — och ett var 31 000 kr bättre än mitt eget förbud.',
        date: '2026-06-18',
      },
      {
        id: 'r5',
        author: 'Lina',
        city: 'Mölndal',
        car: 'Toyota Corolla',
        savingKr: 17500,
        rating: 5,
        text: 'Tryggt att ha en som talar handlarens språk. Inget svart på vitt — bara klart.',
        date: '2026-05-22',
      },
    ],
  },
  {
    id: 'f3',
    slug: 'sara-nilsson',
    name: 'Sara Nilsson',
    certifiering: 'Certifierad',
    bio: 'Ekonom med förkärlek för små bokstäver. Jag läser avtalen, räknar på totalkostnaden och ser till att du inte betalar för något du inte ska betala för.',
    specialties: ['Finansiering', 'Leasing', 'Småbilar'],
    languages: ['Svenska', 'Engelska', 'Franska'],
    city: 'Malmö',
    avatarUrl: null,
    feeKr: 3995,
    rating: 4.9,
    reviewCount: 64,
    dealCount: 89,
    avgSavingKr: 18900,
    responseTimeHours: 3,
    verifiedReviews: [
      {
        id: 'r6',
        author: 'Erik',
        city: 'Malmö',
        car: 'Renault Zoe',
        savingKr: 14200,
        rating: 5,
        text: 'Sara hittade en dold leasingavgift på 4 200 kr. Handlaren strök den utan diskussion.',
        date: '2026-06-09',
      },
      {
        id: 'r7',
        author: 'Karin',
        city: 'Lund',
        car: 'Peugeot 208',
        savingKr: 9800,
        rating: 4,
        text: 'Noggrann och pedagogisk. Förklarade varje rad i kontraktet.',
        date: '2026-05-18',
      },
    ],
  },
];

export const SOCIAL_PROOF = [
  { name: 'Nina', city: 'Stockholm', car: 'Kia EV6', savingKr: 22000, forhandlare: 'Sara' },
  { name: 'Johan', city: 'Göteborg', car: 'Volvo V60', savingKr: 31000, forhandlare: 'Marcus' },
  { name: 'Erik', city: 'Malmö', car: 'Renault Zoe', savingKr: 14200, forhandlare: 'Sara' },
  { name: 'Pär', city: 'Solna', car: 'VW ID.4', savingKr: 28500, forhandlare: 'Anna' },
];

export const PLATFORM_STATS = {
  totalDeals: 669,
  avgSavingKr: 21100,
  rating: 4.9,
};

export const MONTHLY_TOP = [...FORHANDLARE].sort(
  (a, b) => b.dealCount * b.avgSavingKr - a.dealCount * a.avgSavingKr
);

export function getForhandlareBySlug(slug: string): Forhandlare | undefined {
  return FORHANDLARE.find((f) => f.slug === slug);
}

export const CERTIFIERING_ORDER: Record<Certifiering, number> = {
  Trainee: 1,
  Certifierad: 2,
  Senior: 3,
  Elite: 4,
  Master: 5,
};

export function certifieringLabel(c: Certifiering): string {
  return c;
}
