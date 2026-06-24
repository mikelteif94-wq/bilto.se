import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Car,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  CheckCircle2,
  ArrowLeftRight,
  CalendarDays,
  CircleDollarSign,
  ShieldCheck,
  Star,
} from 'lucide-react';
import CustomerOfferCard from '../components/CustomerOfferCard';

interface MyQuotePageProps {
  token: string;
  onBack: () => void;
}

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  title: string;
  created_at: string;
}

interface QuoteData {
  id: string;
  firstname: string;
  lastname: string;
  search_option: string;
  car_model: string;
  budget: string;
  payment_type: string;
  status: string;
  created_at: string;
  has_trade_in?: boolean;
  trade_in_reg?: string;
}

interface Suggestion {
  id: string;
  car_description: string;
  car_image_url: string;
  price: number;
  monthly_cost: number | null;
  link: string;
  admin_comment: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface Offer {
  id: string;
  car_description: string;
  original_price: number;
  negotiated_price: number;
  original_interest_rate: number | null;
  negotiated_interest_rate: number | null;
  original_monthly_cost: number | null;
  negotiated_monthly_cost: number | null;
  winter_tires_included: boolean;
  winter_tires_value: number;
  warranty_included: boolean;
  warranty_years: number;
  warranty_value: number;
  home_delivery_included: boolean;
  home_delivery_value: number;
  other_savings_description: string;
  other_savings_value: number;
  total_savings: number;
  total_deal_price: number;
  deal_rating: string;
  admin_comment: string;
  sent_at: string | null;
  trade_in_included?: boolean;
  trade_in_reg?: string;
  trade_in_value?: number;
}

function endpoint(): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-quote`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

function formatKr(v: number): string {
  return v.toLocaleString('sv-SE');
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const OPTION_LABELS: Record<string, string> = {
  searching: 'Letar efter bil',
  know: 'Letar efter bil',
  explore: 'Letar efter bil',
  found: 'Hittat bil',
  trade: 'Byta in',
};

const STATUS_STEPS = [
  { key: 'received', label: 'Förfrågan mottagen' },
  { key: 'working', label: 'Din expert jobbar' },
  { key: 'offer', label: 'Erbjudande redo' },
];

export default function MyQuotePage({ token, onBack }: MyQuotePageProps) {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dispatchCount, setDispatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${endpoint()}?token=${encodeURIComponent(token)}`,
        { headers: authHeaders() },
      );
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Kunde inte hämta din förfrågan.');
        setQuote(null);
      } else {
        setQuote(json.quote);
        setSuggestions(json.suggestions ?? []);
        setOffers(json.offers ?? []);
        setActivities(json.activities ?? []);
        setDispatchCount(json.dispatch_count ?? 0);
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Länken är ogiltig</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Till startsidan
          </button>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const fornamn = capitalize(quote.firstname || '');
  const hasOffers = offers.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasContent = hasSuggestions || hasOffers;

  // Progress: offers = step 3, suggestions = step 2, else step 1
  const progressStep = hasOffers ? 2 : hasSuggestions ? 1 : 0;

  // Context-aware status message
  const carLabel = quote.car_model
    ? quote.car_model
    : OPTION_LABELS[quote.search_option] || 'din bil';

  const statusMessage = quote.car_model
    ? `Din expert håller på och letar en ${quote.car_model} åt dig.`
    : 'Din personliga bilmäklare söker efter de bästa alternativen åt dig.';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#0e6efe] sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 h-16 flex items-center">
          <a href="/" className="flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </a>
          <button
            onClick={onBack}
            className="ml-auto flex items-center gap-2 text-white/90 hover:text-white transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Startsida
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-6 sm:space-y-8">

        {/* Hero greeting */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#0e6efe] to-[#1a7cff] px-6 py-6 sm:py-7">
            <p className="text-white/75 text-sm font-medium mb-0.5">Hej {fornamn || 'och välkommen'}!</p>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight">
              {hasOffers
                ? `Ditt erbjudande på ${carLabel} är klart`
                : hasSuggestions
                ? `Vi har hittat alternativ åt dig`
                : `Vi jobbar med din förfrågan`}
            </h1>
            <p className="text-white/80 text-[14px] mt-2 leading-relaxed">
              {statusMessage}
            </p>
          </div>

          {/* Progress tracker */}
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i < progressStep;
                const active = i === progressStep;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none min-w-0">
                    <div className="flex flex-col items-center gap-1.5 min-w-0 w-full">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                          ? 'bg-[#0e6efe] text-white ring-4 ring-[#0e6efe]/20'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : <span>{i + 1}</span>}
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-medium text-center px-0.5 truncate w-full ${
                        done ? 'text-emerald-600' : active ? 'text-[#0e6efe]' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 rounded-full mb-5 transition-all shrink-0 ${
                        i < progressStep ? 'bg-emerald-400' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live activity feed */}
        <QuoteLiveFeed
          dispatchCount={dispatchCount}
          suggestionCount={suggestions.length}
          offerCount={offers.length}
          activities={activities}
          createdAt={quote.created_at}
        />

        {/* Summary card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Din förfrågan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryItem
              icon={quote.search_option === 'trade' ? ArrowLeftRight : quote.search_option === 'found' ? Car : Search}
              label="Typ"
              value={OPTION_LABELS[quote.search_option] || quote.search_option}
            />
            {quote.car_model && (
              <SummaryItem icon={Car} label="Söker" value={quote.car_model} />
            )}
            {quote.budget && (
              <SummaryItem
                icon={CircleDollarSign}
                label="Budget"
                value={quote.budget.includes('kr') ? quote.budget : `${Number(quote.budget).toLocaleString('sv-SE')} kr`}
              />
            )}
            <SummaryItem
              icon={CalendarDays}
              label="Inkom"
              value={new Date(quote.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
            />
            {quote.has_trade_in && (
              <SummaryItem
                icon={ArrowLeftRight}
                label="Inbytesbil"
                value={quote.trade_in_reg || 'Ja'}
              />
            )}
          </div>
        </div>

        {/* Offers */}
        {hasOffers && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#0e6efe]" />
              <h2 className="text-lg font-bold text-slate-900">Dina erbjudanden</h2>
            </div>
            <div className="space-y-5">
              {offers.map((offer) => (
                <CustomerOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Suggestions */}
        {hasSuggestions && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-[#0e6efe]" />
              <h2 className="text-lg font-bold text-slate-900">Bilförslag från din expert</h2>
            </div>
            <div className="grid gap-4">
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} />
              ))}
            </div>
          </section>
        )}

        {!hasContent && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">Inget att visa ännu</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Vi arbetar med din förfrågan. Så snart vi har förslag eller erbjudanden visas de här. Du får även ett mejl när något nytt finns.
            </p>
          </div>
        )}

        {/* Expert card */}
        <ExpertCard />

        {/* Contact */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">Frågor?</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Din bilmäklare hjälper dig gärna. Ring eller mejla oss.</p>
          <a
            href="tel:+46855550200"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
          >
            <Phone className="w-4 h-4" />
            08-5555 0200
          </a>
        </div>

      </main>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, string> = {
  status_change: '📋',
  dispatch: '📤',
  note: '💬',
  customer_decision: '✅',
  convert: '🚀',
};

function timeAgoSv(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just nu';
  if (mins < 60) return `${mins} min sedan`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} tim sedan`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'igår';
  return `${days} dagar sedan`;
}

interface QuoteLiveFeedProps {
  dispatchCount: number;
  suggestionCount: number;
  offerCount: number;
  activities: ActivityItem[];
  createdAt: string;
}

function QuoteLiveFeed({ dispatchCount, suggestionCount, offerCount, activities, createdAt }: QuoteLiveFeedProps) {
  const stats = [
    { label: 'Förslag skickade', value: suggestionCount },
    { label: 'Handlare kontaktade', value: dispatchCount },
    { label: 'Erbjudanden', value: offerCount },
  ];

  const timelineItems = [
    ...activities.map((a) => ({
      id: a.id,
      icon: ACTIVITY_ICONS[a.type] ?? '📌',
      title: a.title,
      time: timeAgoSv(a.created_at),
    })),
    {
      id: '__created__',
      icon: '🚀',
      title: 'Förfrågan mottagen av Bilto',
      time: timeAgoSv(createdAt),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700">Aktivitet</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="px-5 sm:px-6 py-4 space-y-3">
        {timelineItems.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <span className="text-base leading-none">{item.icon}</span>
              {idx < timelineItems.length - 1 && (
                <div className="w-px flex-1 bg-slate-100 mt-1.5 min-h-[20px]" />
              )}
            </div>
            <div className="pb-2 min-w-0 flex-1">
              <p className="text-sm text-slate-800 font-medium leading-snug">{item.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{value}</p>
      </div>
    </div>
  );
}

function ExpertCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Din tilldelade expert</h2>
      </div>
      <div className="p-5 sm:p-6 flex items-center gap-5">
        <div className="relative shrink-0">
          <img
            src="/image copy copy.png"
            alt="Marcus Holm"
            className="w-16 h-16 rounded-xl object-cover object-top border-2 border-slate-200"
          />
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">Marcus Holm</p>
          <p className="text-sm text-[#0e6efe] font-medium">Seniorförhandlare · 12 år i branschen</p>
          <div className="flex items-center gap-1 mt-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-[11px] text-slate-400 ml-1">5.0</span>
          </div>
        </div>
        <a
          href="tel:+46855550200"
          className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0e6efe] text-white text-sm font-semibold hover:bg-[#0a57cc] transition"
        >
          <Phone className="w-3.5 h-3.5" />
          Ring
        </a>
      </div>
      <div className="px-5 sm:px-6 pb-5 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[13px] text-slate-600 leading-relaxed">
          Marcus arbetar <span className="font-semibold">uteslutande för dig</span> – inte för handlaren. Hans mål är att du ska betala rätt pris och inte ett öre mer.
        </p>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion: s }: { suggestion: Suggestion }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {s.car_image_url && (
        <img
          src={s.car_image_url}
          alt={s.car_description}
          className="w-full h-48 sm:h-56 object-cover"
        />
      )}
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{s.car_description || 'Bilförslag'}</h3>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
          {s.price > 0 && (
            <span className="text-xl font-bold text-[#0e6efe]">{formatKr(s.price)} kr</span>
          )}
          {s.monthly_cost != null && s.monthly_cost > 0 && (
            <span className="text-sm text-slate-500">{formatKr(s.monthly_cost)} kr/mån</span>
          )}
        </div>
        {s.admin_comment && (
          <div className="bg-[#faf8f5] border border-slate-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Biltos kommentar</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{s.admin_comment}</p>
          </div>
        )}
        {s.link && (
          <a
            href={s.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition"
          >
            Se annonsen
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
