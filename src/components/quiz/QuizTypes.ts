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
  freeText?: string;
  body_type?: string[];
  fuel_type?: string[];
  budget_type?: 'monthly' | 'cash';
  budget_min?: number;
  budget_max?: number;
  priorities?: string[];
  brand_preference?: 'premium' | 'mainstream' | 'value' | 'no_preference';
  daily_use?: 'solo' | 'family' | 'cargo' | 'sporadic';
  annual_mileage?: 'low' | 'medium' | 'high';
}

export const MONTHLY_BUDGET_OPTIONS = [
  { value: 0, label: 'Ingen gräns' },
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
  { value: 0, label: 'Ingen gräns' },
  { value: 100000, label: '100 000 kr' },
  { value: 150000, label: '150 000 kr' },
  { value: 200000, label: '200 000 kr' },
  { value: 250000, label: '250 000 kr' },
  { value: 300000, label: '300 000 kr' },
  { value: 400000, label: '400 000 kr' },
  { value: 500000, label: '500 000 kr' },
  { value: 750000, label: '750 000 kr' },
  { value: 1000000, label: '1 000 000 kr' },
];

export const BRAND_CATEGORIES = {
  premium: ['BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'Porsche', 'Jaguar', 'Land Rover', 'Tesla', 'Polestar', 'Genesis'],
  mainstream: ['Volkswagen', 'Toyota', 'Ford', 'Skoda', 'Mazda', 'Honda', 'Nissan', 'Peugeot', 'Renault', 'Opel', 'Citroen', 'SEAT', 'Subaru'],
  value: ['Dacia', 'Kia', 'Hyundai', 'MG', 'BYD', 'Fiat', 'Suzuki', 'Mitsubishi'],
};

export const BODY_TYPE_KEYWORDS = {
  suv: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'xc40', 'xc60', 'xc90', 'ex30', 'ex90', 'q2', 'q3', 'q4', 'q5', 'q7', 'q8', 'glc', 'gle', 'gla', 'glb', 'gls', 'eqc', 'eqa', 'eqb', 'rav4', 'cr-v', 'tucson', 'tiguan', 'karoq', 'kodiaq', 'kona', 'niro', 'sportage', 'sorento', 'model x', 'model y', 'cayenne', 'macan', 'id.4', 'id.5', 'enyaq', 'ioniq 5', 'ev6', 'ev9', 'seal u', 'tang', 'atto'],
  kombi: ['v60', 'v90', 'v40', 'avant', 'touring', 'variant', 'sportstourer', 'sw', 'sports tourer', 'break', 'estate', 'passat', 'superb', 'octavia'],
  sedan: ['3-serie', '5-serie', '7-serie', 'a3 sedan', 'a4', 'a5', 'a6', 'a7', 'a8', 'c-klass', 'e-klass', 's-klass', 's60', 's90', 'camry', 'accord', 'model 3', 'model s', 'taycan', 'arteon'],
  hatchback: ['1-serie', '2-serie gran coupe', 'a3', 'a-klass', 'golf', 'polo', 'id.3', 'fabia', 'scala', 'i20', 'i30', 'corolla', 'yaris', 'civic', 'mazda3', 'leaf', 'zoe', 'sportback', 'cupra born', 'leon'],
  coupe: ['4-serie', '8-serie', 'tt', 'a5 coupe', 'cla', 'cle', '911', 'cayman', 'boxster', 'z4', 'supra', 'mustang', 'cabriolet', 'cab', 'roadster'],
};

export const FUEL_TYPE_KEYWORDS = {
  electric: ['ev', 'electric', 'model 3', 'model s', 'model x', 'model y', 'id.3', 'id.4', 'id.5', 'id.7', 'enyaq', 'ioniq', 'ev6', 'ev9', 'ex30', 'ex90', 'ec40', 'c40', 'xc40 recharge', 'eq', 'e-tron', 'i3', 'i4', 'i5', 'i7', 'ix', 'polestar', 'taycan', 'leaf', 'zoe', 'byd', 'seal', 'atto', 'tang', 'dolphin', 'mg4', 'mg5', 'zs ev', 'marvel r'],
  hybrid: ['hybrid', 'phev', 'plug-in', 'recharge', 'tfsi e', '330e', '530e', 'rav4 hybrid', 'prius', 'niro', 'kona hybrid', 'ioniq hybrid', 'yaris hybrid', 'corolla hybrid'],
  diesel: ['tdi', 'bluehdi', 'dci', 'd3', 'd4', 'd5', '118d', '120d', '318d', '320d', '520d', 'a4 35 tdi', 'a6 40 tdi', '220d', '200d', '250d', '300d'],
  petrol: ['tsi', 'tfsi', 'turbo', 'gti', 'rs', 'amg', 'm', 'benzin', 'bensin'],
};

export const PRIORITY_TRAITS = {
  economy: { brands: ['Toyota', 'Dacia', 'Kia', 'Hyundai', 'Skoda'], keywords: ['hybrid', 'electric'] },
  safety: { brands: ['Volvo', 'Subaru', 'Mercedes-Benz', 'Toyota'], keywords: [] },
  comfort: { brands: ['Mercedes-Benz', 'Audi', 'BMW', 'Lexus', 'Volvo'], keywords: [] },
  performance: { brands: ['BMW', 'Audi', 'Mercedes-Benz', 'Porsche', 'Tesla'], keywords: ['amg', 'rs', 'm', 'gti'] },
  space: { brands: ['Volvo', 'Skoda', 'Volkswagen'], keywords: ['kombi', 'suv', 'xl'] },
  tech: { brands: ['Tesla', 'Polestar', 'BMW', 'Mercedes-Benz', 'BYD'], keywords: ['electric', 'ev'] },
  resale: { brands: ['Porsche', 'Toyota', 'Lexus', 'Tesla', 'BMW'], keywords: [] },
  reliability: { brands: ['Toyota', 'Lexus', 'Honda', 'Mazda', 'Volvo'], keywords: [] },
};

// Natural language → feature mapping used by the smart scorer
export const FREE_TEXT_SIGNALS: { patterns: RegExp[]; signals: Partial<QuizAnswers> & { extraTags?: string[] } }[] = [
  // Pets / dog
  { patterns: [/hund/i, /husdjur/i, /djur/i], signals: { body_type: ['kombi', 'suv'], extraTags: ['baggage', 'space'] } },
  // Large boot / luggage
  { patterns: [/stor.*bag|bag.*stor|lastutr|bagageutr|lastkap/i, /mycket.*last|last.*mycket/i], signals: { body_type: ['kombi', 'suv'], extraTags: ['baggage'] } },
  // Small car
  { patterns: [/liten.*bil|liten bil|kompakt|city.*bil|stadsbil|smidig/i], signals: { body_type: ['hatchback'], extraTags: ['compact'] } },
  // Family
  { patterns: [/familj/i, /barn/i, /barnvagn/i], signals: { daily_use: 'family', body_type: ['suv', 'kombi'], extraTags: ['family'] } },
  // Electric
  { patterns: [/el.*bil|elbil|elektrisk|ev$/i, /laddbar/i], signals: { fuel_type: ['electric'] } },
  // Hybrid
  { patterns: [/hybrid/i, /phev/i, /laddhybrid/i], signals: { fuel_type: ['hybrid'] } },
  // Cheap / budget
  { patterns: [/billig|prisvärd|budget|spara|kostnadseffek/i], signals: { brand_preference: 'value', extraTags: ['economy'] } },
  // Premium / luxury
  { patterns: [/premium|lyx|exklusiv|prestige/i], signals: { brand_preference: 'premium' } },
  // Safety
  { patterns: [/säker|trygg/i], signals: { priorities: ['safety'] } },
  // Comfort
  { patterns: [/bekväm|komfort/i], signals: { priorities: ['comfort'] } },
  // Performance / sporty
  { patterns: [/sportig|prestanda|kul att köra|rolig att köra|snabb/i], signals: { priorities: ['performance'] } },
  // Low running cost
  { patterns: [/låga drifts|driftskostnad|ekonomisk/i], signals: { priorities: ['economy'] } },
  // Space / roomy
  { patterns: [/rymlig|plats|utrymme|stor bil/i], signals: { priorities: ['space'], body_type: ['suv', 'kombi'] } },
  // SUV
  { patterns: [/suv|terrängbil|4x4|allhjulsdrift|awd|fyrhjuls/i], signals: { body_type: ['suv'] } },
  // Kombi
  { patterns: [/kombi|estates/i], signals: { body_type: ['kombi'] } },
  // Sedan
  { patterns: [/sedan/i], signals: { body_type: ['sedan'] } },
  // High mileage
  { patterns: [/pendlar.*långt|lång.*pendling|kör mycket|mycket.*mil/i], signals: { annual_mileage: 'high', priorities: ['economy'] } },
  // Solo commuter
  { patterns: [/ensam|pendling|jobbet|pendlar/i], signals: { daily_use: 'solo' } },
  // Tech
  { patterns: [/teknik|modern|uppkopplad|skärm/i], signals: { priorities: ['tech'] } },
  // Reliability
  { patterns: [/pålitlig|driftsäker|tillförlitlig/i], signals: { priorities: ['reliability'] } },
];
