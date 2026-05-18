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
} from 'lucide-react';
import CustomerOfferCard from '../components/CustomerOfferCard';

interface MyQuotePageProps {
  token: string;
  onBack: () => void;
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
}

function endpoint(): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-quote`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

function formatKr(v: number): string {
  return v.toLocaleString('sv-SE');
}

const OPTION_LABELS: Record<string, string> = {
  searching: 'Soker bil',
  found: 'Hittat bil',
  trade: 'Byta in',
};

export default function MyQuotePage({ token, onBack }: MyQuotePageProps) {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
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
        setError(json.error ?? 'Kunde inte hamta din forfragan.');
        setQuote(null);
      } else {
        setQuote(json.quote);
        setSuggestions(json.suggestions ?? []);
        setOffers(json.offers ?? []);
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Lanken ar ogiltig
          </h1>
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

  const fornamn = quote.firstname || '';
  const hasContent = suggestions.length > 0 || offers.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0e6efe] h-16 flex items-center px-5 lg:px-8 sticky top-0 z-10">
        <a href="/" className="flex items-center">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-20 lg:h-32 w-auto object-contain"
          />
        </a>
        <button
          onClick={onBack}
          className="ml-auto flex items-center gap-2 text-white/90 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Startsida</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-sm text-slate-500 mb-1">
            Hej {fornamn || 'och valkommen'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Din bilforfragan
          </h1>
          {quote.car_model && (
            <p className="text-slate-600 mt-1">
              {OPTION_LABELS[quote.search_option] || quote.search_option}
              {quote.car_model ? ` -- ${quote.car_model}` : ''}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="rounded-md border bg-teal-50 border-teal-200 p-6 flex gap-4">
          <div className="text-teal-600 mt-0.5">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-teal-900 mb-1">
              Vi jobbar med din forfragan
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Din personliga bilmaklare soker efter de basta alternativen at dig.
              Nar vi hittar nagot bra dyker det upp har nedan.
            </p>
          </div>
        </div>

        {/* Offers from admin */}
        {offers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#0e6efe]" />
              <h2 className="text-lg font-bold text-slate-900">
                Dina erbjudanden
              </h2>
            </div>
            <div className="space-y-5">
              {offers.map((offer) => (
                <CustomerOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* Car suggestions */}
        {suggestions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-[#0e6efe]" />
              <h2 className="text-lg font-bold text-slate-900">
                Bilforslag fran Bilto
              </h2>
            </div>
            <div className="grid gap-4">
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} />
              ))}
            </div>
          </section>
        )}

        {!hasContent && (
          <div className="bg-white rounded-md border border-slate-200 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Inget att visa annu
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Vi arbetar med din forfragan. Sa snart vi har forslag eller
              erbjudanden visas de har. Du far aven ett mejl nar nagot nytt
              finns.
            </p>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white rounded-md border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">
              Fragor?
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Din bilmaklare hjalper dig garna. Ring eller mejla oss.
          </p>
          <a
            href="tel:+46855550200"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
          >
            <Phone className="w-4 h-4" />
            08-5555 0200
          </a>
        </div>
      </main>
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
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {s.car_description || 'Bilforslag'}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
          {s.price > 0 && (
            <span className="text-xl font-bold text-[#0e6efe]">
              {formatKr(s.price)} kr
            </span>
          )}
          {s.monthly_cost != null && s.monthly_cost > 0 && (
            <span className="text-sm text-slate-500">
              {formatKr(s.monthly_cost)} kr/man
            </span>
          )}
        </div>
        {s.admin_comment && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Biltos kommentar
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {s.admin_comment}
            </p>
          </div>
        )}
        {s.link && (
          <a
            href={s.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition"
          >
            Se annonsen
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
