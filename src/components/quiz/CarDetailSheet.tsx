import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Gauge, Armchair, Briefcase, TrendingDown, Shield,
  Fuel, Battery, Car, Check, X as XIcon, Info, Users, ArrowRight,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { findComparisonCarByMakeModel, type ComparisonCar } from '@/lib/comparison';

export interface DetailCarData {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url?: string | null;
  matchScore: number;
  matchReasons: string[];
  bodyType?: string;
  fuelType?: string;
  seats?: number;
  cargo?: string;
  drivetrain?: string;
  rating?: number;
  usedPrice?: number;
  fuelLabel?: string;
}

interface CarDetailSheetProps {
  car: DetailCarData | null;
  open?: boolean;
  onClose: () => void;
  onSelect?: () => void;
}

function formatPriceSEK(price: number): string {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(price) + ' kr';
}

function estimateMonthlyCost(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('tesla') || n.includes('polestar') || n.includes('bmw') || n.includes('audi') || n.includes('mercedes') || n.includes('porsche') || n.includes('genesis') || n.includes('lexus')) return '5 500\u20138 500';
  if (n.includes('volvo xc90') || n.includes('volvo xc60') || n.includes('bmw x') || n.includes('audi q')) return '5 000\u20137 500';
  if (n.includes('volvo') || n.includes('vw') || n.includes('volkswagen') || n.includes('skoda') || n.includes('toyota rav') || n.includes('kia sportage')) return '3 500\u20135 500';
  if (n.includes('kia') || n.includes('hyundai') || n.includes('dacia') || n.includes('mg') || n.includes('renault') || n.includes('seat') || n.includes('cupra')) return '2 800\u20134 500';
  return '3 500\u20136 000';
}


function getWhoItSuitsFor(data: ComparisonCar): string[] {
  const suits: string[] = [];
  if (data.specs.fuel_types.includes('el')) suits.push('Den som vill köra billigast i driftskostnad');
  if (data.specs.trunk_liters && data.specs.trunk_liters >= 500 && data.specs.seats >= 5) suits.push('Barnfamiljen som behöver utrymme');
  if (data.ratings.comfort >= 8) suits.push('Den som värdesätter komfort och tyst kupé');
  if (data.ratings.driving >= 8) suits.push('Den som gillar sportig och engagerande körning');
  if (data.ratings.value >= 8) suits.push('Den som vill ha bra valuta för pengarna');
  if (data.specs.drivetrain.includes('awd')) suits.push('Den som kör mycket på vintern');
  if (data.specs.body_type === 'suv') suits.push('Den som vill ha högt sittläge och bra överblick');
  if (data.specs.fuel_types.includes('hybrid') || data.specs.fuel_types.includes('laddhybrid')) suits.push('Pendlaren som kör korta och långa sträckor');
  return suits.slice(0, 4);
}

function RatingBar({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Star }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-[13px] text-slate-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full bg-[#0047B3] rounded-full"
        />
      </div>
      <span className="text-[13px] font-semibold text-slate-900 w-8 text-right">{value}</span>
    </div>
  );
}

function getFuelIcon(fuelTypes: string[]) {
  if (fuelTypes.includes('el') || fuelTypes.includes('hybrid') || fuelTypes.includes('laddhybrid')) return Battery;
  return Fuel;
}

function getFuelLabel(fuelTypes: string[]): string {
  const labels: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
  };
  return fuelTypes.map(f => labels[f] || f).join(', ');
}

function getBodyLabel(bodyType: string): string {
  const labels: Record<string, string> = {
    sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupe',
    hatchback: 'Halvkombi', cab: 'Cabriolet', mpv: 'MPV',
  };
  return labels[bodyType] || bodyType;
}

function getDrivetrainLabel(drivetrain: string[]): string {
  const labels: Record<string, string> = { fwd: 'Framhjulsdrift', rwd: 'Bakhjulsdrift', awd: 'Fyrhjulsdrift' };
  return drivetrain.map(d => labels[d] || d).join(', ');
}

export function CarDetailSheet({ car, open, onClose, onSelect }: CarDetailSheetProps) {
  const isOpen = open !== undefined ? open : !!car;

  const comparisonData = useMemo(() => {
    if (!car) return null;
    return findComparisonCarByMakeModel(car.make, car.model);
  }, [car]);

  if (!car) return null;

  return (
    <Sheet open={isOpen} onClose={onClose}>
      <div className="px-4 sm:px-5 pb-8">
        {/* Hero */}
        <div className="relative mb-5">
          {(car.cleaned_image_url || car.image_url) && (
            <div className="w-full h-40 sm:h-48 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
              <img
                src={car.cleaned_image_url || car.image_url || ''}
                alt={`${car.make} ${car.model}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <div className="mt-3 sm:mt-4">
            <h2 className="text-[20px] sm:text-2xl font-bold text-slate-900 leading-tight">{car.make} {car.model}</h2>
            {comparisonData?.generation && (
              <p className="text-sm text-slate-400 mt-0.5">{comparisonData.generation}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {comparisonData && (
              <Badge className="bg-[#0047B3] text-white border-transparent">
                <Star className="w-3 h-3 mr-1 fill-white" />
                {comparisonData.ratings.overall}/10
              </Badge>
            )}
            {comparisonData?.safety.euro_ncap_stars && (
              <Badge variant="outline" className="gap-1">
                <Shield className="w-3 h-3" />
                {comparisonData.safety.euro_ncap_stars} stjärnor NCAP
              </Badge>
            )}
          </div>
        </div>

        {comparisonData ? (
          <ComparisonContent data={comparisonData} onSelect={onSelect} />
        ) : (
          <BasicContent car={car} onSelect={onSelect} />
        )}
      </div>
    </Sheet>
  );
}

function ComparisonContent({ data, onSelect }: { data: ComparisonCar; onSelect?: () => void }) {
  const FuelIcon = getFuelIcon(data.specs.fuel_types);
  const carName = `${data.brand_display} ${data.model_display}`;
  const monthlyCost = estimateMonthlyCost(carName);
  const whoSuits = getWhoItSuitsFor(data);

  return (
    <div className="space-y-7">
      {/* Expert summary */}
      <section className="p-4 bg-[#0e6efe]/5 rounded-xl border border-[#0e6efe]/10">
        <p className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-wide mb-3">Experternas bedömning</p>
        <div>
          <p className="text-[12px] text-slate-500">Uppskattad månadskostnad</p>
          <p className="text-[16px] font-bold text-slate-900">{monthlyCost} kr/mån</p>
        </div>
        {data.meta_description && (
          <p className="text-[13px] text-slate-600 leading-relaxed mt-3">{data.meta_description}</p>
        )}
      </section>

      {/* Who it suits */}
      {whoSuits.length > 0 && (
        <section>
          <SectionTitle>Vem passar bilen för?</SectionTitle>
          <div className="space-y-2">
            {whoSuits.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-3 h-3 text-[#0e6efe]" />
                </div>
                <span className="text-[13px] text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section>
        <SectionTitle>Pris</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {data.pricing.new_from_sek && (
            <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ny från</p>
              <p className="text-[16px] sm:text-lg font-bold text-slate-900 mt-0.5">{formatPriceSEK(data.pricing.new_from_sek)}</p>
              {data.pricing.new_to_sek && (
                <p className="text-[11px] sm:text-[12px] text-slate-400">till {formatPriceSEK(data.pricing.new_to_sek)}</p>
              )}
            </div>
          )}
          {data.pricing.used_from_sek && (
            <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Begagnad från</p>
              <p className="text-[16px] sm:text-lg font-bold text-slate-900 mt-0.5">{formatPriceSEK(data.pricing.used_from_sek)}</p>
              <p className="text-[11px] text-slate-400">Äldre årsmodeller, pris varierar</p>
            </div>
          )}
        </div>
      </section>

      {/* Ratings */}
      <section>
        <SectionTitle>Betyg</SectionTitle>
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Totalt</span>
            <span className="text-xl font-bold text-[#0047B3]">{data.ratings.overall}/10</span>
          </div>
          <RatingBar label="Körning" value={data.ratings.driving} icon={Gauge} />
          <RatingBar label="Komfort" value={data.ratings.comfort} icon={Armchair} />
          <RatingBar label="Praktiskt" value={data.ratings.practicality} icon={Briefcase} />
          <RatingBar label="Värde" value={data.ratings.value} icon={TrendingDown} />
        </div>
      </section>

      {/* Specs */}
      <section>
        <SectionTitle>Specifikationer</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <SpecItem icon={Car} label="Kaross" value={getBodyLabel(data.specs.body_type)} />
          <SpecItem icon={FuelIcon} label="Drivmedel" value={getFuelLabel(data.specs.fuel_types)} />
          <SpecItem icon={Gauge} label="Drivlina" value={getDrivetrainLabel(data.specs.drivetrain)} />
          <SpecItem icon={Briefcase} label="Bagageutrymme" value={data.specs.trunk_liters ? `${data.specs.trunk_liters} liter` : '-'} />
        </div>
        {data.specs.trunk_liters_max && (
          <p className="text-[12px] text-slate-400 mt-2 pl-1">
            Max med fällda baksäten: {data.specs.trunk_liters_max} liter
          </p>
        )}
      </section>

      {/* Pros & Cons */}
      <section>
        <SectionTitle>Styrkor & svagheter</SectionTitle>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            {data.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-[13px] text-slate-700">{pro}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-1">
            {data.cons.map((con, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <XIcon className="w-3 h-3 text-red-500" />
                </div>
                <span className="text-[13px] text-slate-700">{con}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="w-full flex flex-col items-center gap-1 py-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white transition-all duration-200 hover:shadow-lg"
        >
          <span className="text-[15px] font-semibold inline-flex items-center gap-2">
            Låt oss hitta bästa priset
            <ArrowRight className="w-4 h-4" />
          </span>
          <span className="text-[12px] text-white/70">Vi förhandlar {data.brand_display} {data.model_display} åt dig — helt gratis</span>
        </button>
      )}
    </div>
  );
}

function BasicContent({ car, onSelect }: { car: DetailCarData; onSelect?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 p-4 bg-slate-50 rounded-xl">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[13px] text-slate-500">
          Detaljerad data för denna modell är inte tillgänglig ännu. Vi arbetar på att lägga till fler bilmodeller.
        </p>
      </div>
      {car.matchReasons.length > 0 && (
        <div>
          <SectionTitle>Varför vi rekommenderar den</SectionTitle>
          <div className="space-y-2">
            {car.matchReasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0047B3]/10 flex items-center justify-center shrink-0">
                  <Star className="w-3 h-3 text-[#0047B3]" />
                </div>
                <span className="text-[13px] text-slate-700">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="w-full flex flex-col items-center gap-1 py-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white transition-all duration-200 hover:shadow-lg"
        >
          <span className="text-[15px] font-semibold inline-flex items-center gap-2">
            Låt oss hitta bästa priset
            <ArrowRight className="w-4 h-4" />
          </span>
          <span className="text-[12px] text-white/70">Vi förhandlar {car.make} {car.model} åt dig — helt gratis</span>
        </button>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3">{children}</h3>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl min-w-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-[12px] sm:text-[13px] font-medium text-slate-800 leading-snug">{value}</p>
      </div>
    </div>
  );
}
