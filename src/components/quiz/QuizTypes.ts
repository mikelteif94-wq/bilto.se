export interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  options: QuizOption[];
  multiSelect?: boolean;
}

export interface QuizOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface QuizAnswers {
  budget_type?: 'monthly' | 'cash';
  budget_min?: number;
  budget_max?: number;
  body_type?: string[];
  fuel_type?: string[];
  daily_use?: 'solo' | 'family' | 'cargo' | 'sporadic';
  annual_mileage?: 'low' | 'medium' | 'high';
  priorities?: string[];
  driving_feel?: 'comfortable' | 'safe' | 'fun' | 'no_preference';
  brand_preference?: 'premium' | 'mainstream' | 'value' | 'no_preference';
  annoyance?: 'comfort' | 'tech' | 'boring' | 'unpractical';
  modernity?: 'very' | 'quite' | 'not_really';
  ownership?: 'short' | 'medium' | 'long';
  comparison?: 'same' | 'better' | 'much_better';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'budget',
    question: 'Vad är din budget?',
    subtitle: 'Välj ett prisintervall för din nya bil',
    options: [],
  },
  {
    id: 'body_type',
    question: 'Vilken typ av bil passar dig?',
    subtitle: 'Välj en eller flera karosstyper',
    multiSelect: true,
    options: [
      { id: 'suv', label: 'SUV', icon: 'mountain', description: 'Hög sittposition, rymlig' },
      { id: 'kombi', label: 'Kombi', icon: 'car', description: 'Praktisk, stort bagageutrymme' },
      { id: 'sedan', label: 'Sedan', icon: 'gauge', description: 'Klassisk, elegant' },
      { id: 'hatchback', label: 'Halvkombi', icon: 'circle-dot', description: 'Kompakt, smidig' },
      { id: 'coupe', label: 'Coupé/Cab', icon: 'timer', description: 'Sportig, stilren' },
    ],
  },
  {
    id: 'fuel_type',
    question: 'Vilken drivlina föredrar du?',
    subtitle: 'Välj en eller flera',
    multiSelect: true,
    options: [
      { id: 'electric', label: 'Elbil', icon: 'zap', description: 'Noll utsläpp, låga driftskostnader' },
      { id: 'hybrid', label: 'Hybrid / PHEV', icon: 'battery-medium', description: 'Flexibelt, bra räckvidd' },
      { id: 'petrol', label: 'Bensin', icon: 'fuel', description: 'Traditionellt, många val' },
      { id: 'diesel', label: 'Diesel', icon: 'droplets', description: 'Bra för längre körning' },
    ],
  },
  {
    id: 'daily_use',
    question: 'Hur ser din vardag med bilen ut?',
    options: [
      { id: 'solo', label: 'Mest ensam', icon: 'briefcase', description: 'Pendling, ärenden' },
      { id: 'family', label: 'Familj', icon: 'users', description: 'Barn, aktiviteter' },
      { id: 'cargo', label: 'Mycket last', icon: 'package', description: 'Fritid, utrustning' },
      { id: 'sporadic', label: 'Lite och sporadiskt', icon: 'compass', description: 'Helgkörning' },
    ],
  },
  {
    id: 'annual_mileage',
    question: 'Hur mycket kör du per år?',
    options: [
      { id: 'low', label: 'Under 1 000 mil', icon: 'map-pin', description: 'Mest stadskörning' },
      { id: 'medium', label: '1 000 – 2 000 mil', icon: 'route', description: 'Blandad körning' },
      { id: 'high', label: 'Över 2 000 mil', icon: 'globe', description: 'Pendlar långt' },
    ],
  },
  {
    id: 'priorities',
    question: 'Vad är viktigast för dig?',
    subtitle: 'Välj upp till 3 prioriteringar',
    multiSelect: true,
    options: [
      { id: 'economy', label: 'Låga driftskostnader', icon: 'trending-down' },
      { id: 'safety', label: 'Säkerhet', icon: 'shield' },
      { id: 'comfort', label: 'Komfort', icon: 'armchair' },
      { id: 'performance', label: 'Prestanda', icon: 'timer' },
      { id: 'space', label: 'Utrymme', icon: 'maximize' },
      { id: 'tech', label: 'Modern teknik', icon: 'monitor-smartphone' },
      { id: 'resale', label: 'Bra andrahandsvärde', icon: 'trending-up' },
      { id: 'reliability', label: 'Pålitlighet', icon: 'wrench' },
    ],
  },
  {
    id: 'brand_preference',
    question: 'Vilken typ av märke föredrar du?',
    options: [
      { id: 'premium', label: 'Premium', icon: 'crown', description: 'BMW, Mercedes, Audi, Volvo' },
      { id: 'mainstream', label: 'Etablerad', icon: 'shield-check', description: 'VW, Toyota, Ford, Skoda' },
      { id: 'value', label: 'Prisvärt', icon: 'piggy-bank', description: 'Dacia, Kia, Hyundai, MG' },
      { id: 'no_preference', label: 'Spelar ingen roll', icon: 'shuffle', description: 'Öppen för allt' },
    ],
  },
];

export const MONTHLY_BUDGET_OPTIONS = [
  { value: 0, label: 'Alla' },
  { value: 2000, label: '2 000 kr' },
  { value: 3000, label: '3 000 kr' },
  { value: 4000, label: '4 000 kr' },
  { value: 5000, label: '5 000 kr' },
  { value: 6000, label: '6 000 kr' },
  { value: 8000, label: '8 000 kr' },
  { value: 10000, label: '10 000 kr' },
  { value: 15000, label: '15 000 kr' },
];

export const CASH_BUDGET_OPTIONS = [
  { value: 0, label: 'Alla' },
  { value: 50000, label: '50 000 kr' },
  { value: 100000, label: '100 000 kr' },
  { value: 150000, label: '150 000 kr' },
  { value: 200000, label: '200 000 kr' },
  { value: 300000, label: '300 000 kr' },
  { value: 400000, label: '400 000 kr' },
  { value: 500000, label: '500 000 kr' },
  { value: 750000, label: '750 000 kr' },
  { value: 1000000, label: '1 000 000 kr' },
];

export function isElectricCar(car: string): boolean {
  const name = car.toLowerCase();
  return FUEL_TYPE_KEYWORDS.electric.some(k => name.includes(k.toLowerCase()));
}

export const BRAND_CATEGORIES = {
  premium: ['BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'Porsche', 'Jaguar', 'Land Rover', 'Tesla', 'Polestar'],
  mainstream: ['Volkswagen', 'Toyota', 'Ford', 'Skoda', 'Mazda', 'Honda', 'Nissan', 'Peugeot', 'Renault', 'Opel', 'Citroen', 'SEAT', 'Subaru'],
  value: ['Dacia', 'Kia', 'Hyundai', 'MG', 'BYD', 'Fiat', 'Suzuki', 'Mitsubishi'],
};

export const BODY_TYPE_KEYWORDS = {
  suv: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'xc40', 'xc60', 'xc90', 'ex30', 'ex90', 'q2', 'q3', 'q4', 'q5', 'q7', 'q8', 'glc', 'gle', 'gla', 'glb', 'gls', 'eqc', 'eqa', 'eqb', 'rav4', 'cr-v', 'tucson', 'tiguan', 'karoq', 'kodiaq', 'kona', 'niro', 'sportage', 'sorento', 'model x', 'model y', 'cayenne', 'macan', 'taycan cross', 'id.4', 'id.5', 'enyaq', 'ioniq 5', 'ev6', 'ev9', 'seal u', 'tang', 'atto'],
  kombi: ['v60', 'v90', 'v40', 'avant', 'touring', 'variant', 'sportstourer', 'sw', 'sports tourer', 'break', 'estate', 'passat', 'superb', 'octavia'],
  sedan: ['3-serie', '5-serie', '7-serie', 'a3 sedan', 'a4', 'a5', 'a6', 'a7', 'a8', 'c-klass', 'e-klass', 's-klass', 's60', 's90', 'camry', 'accord', 'model 3', 'model s', 'taycan', 'passat sedan', 'arteon'],
  hatchback: ['1-serie', '2-serie gran coupe', 'a3', 'a-klass', 'golf', 'polo', 'id.3', 'fabia', 'scala', 'i20', 'i30', 'corolla', 'yaris', 'civic', 'mazda3', 'leaf', 'zoe', 'sportback', 'cupra born', 'leon'],
  coupe: ['4-serie', '8-serie', 'tt', 'a5 coupe', 'cla', 'cle', 'c-klass coupe', 'e-klass coupe', '911', 'cayman', 'boxster', 'z4', 'supra', 'mustang', 'cabriolet', 'cab', 'roadster', 'spider', 'spyder'],
};

export const FUEL_TYPE_KEYWORDS = {
  electric: ['ev', 'electric', 'model 3', 'model s', 'model x', 'model y', 'id.3', 'id.4', 'id.5', 'id.7', 'enyaq', 'ioniq', 'ev6', 'ev9', 'ex30', 'ex90', 'ec40', 'c40', 'xc40 recharge', 'eq', 'e-tron', 'i3', 'i4', 'i5', 'i7', 'ix', 'ix1', 'ix2', 'ix3', 'polestar', 'taycan', 'leaf', 'zoe', 'byd', 'seal', 'atto', 'tang', 'dolphin', 'mg4', 'mg5', 'zs ev', 'marvel r'],
  hybrid: ['hybrid', 'phev', 'plug-in', 'recharge', 'tfsi e', 'xtraboost', '330e', '530e', '745e', 'x5 45e', 'rav4 hybrid', 'prius', 'niro', 'kona hybrid', 'ioniq hybrid', 'yaris hybrid', 'corolla hybrid'],
  diesel: ['d', 'tdi', 'bluehdi', 'dci', 'd3', 'd4', 'd5', 'b47', 'b57', '118d', '120d', '318d', '320d', '520d', '530d', 'a4 35 tdi', 'a6 40 tdi', '220d', '200d', '250d', '300d'],
  petrol: ['tsi', 'tfsi', 'turbo', 'gti', 'rs', 'amg', 'm', 'benzin', 'bensin'],
};

export const PRIORITY_TRAITS = {
  economy: { brands: ['Toyota', 'Dacia', 'Kia', 'Hyundai', 'Skoda'], keywords: ['hybrid', 'electric'] },
  safety: { brands: ['Volvo', 'Subaru', 'Mercedes-Benz', 'Toyota'], keywords: [] },
  comfort: { brands: ['Mercedes-Benz', 'Audi', 'BMW', 'Lexus', 'Volvo'], keywords: [] },
  performance: { brands: ['BMW', 'Audi', 'Mercedes-Benz', 'Porsche', 'Tesla'], keywords: ['amg', 'rs', 'm', 'gti', 's', 'performance'] },
  space: { brands: ['Volvo', 'Skoda', 'Volkswagen'], keywords: ['kombi', 'suv', 'xl'] },
  tech: { brands: ['Tesla', 'Polestar', 'BMW', 'Mercedes-Benz', 'BYD'], keywords: ['electric', 'ev'] },
  resale: { brands: ['Porsche', 'Toyota', 'Lexus', 'Tesla', 'BMW'], keywords: [] },
  reliability: { brands: ['Toyota', 'Lexus', 'Honda', 'Mazda', 'Volvo'], keywords: [] },
};
