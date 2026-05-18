import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Clock,
  Search,
  Car as CarIcon,
  Repeat,
  Save,
  ArrowRightCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminQuoteDetailProps {
  quoteId: string;
  onBack: () => void;
  onConvertToCar: (data: ConvertData) => void;
  onCreateOffer?: (quoteId: string) => void;
}

export interface ConvertData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  carModel: string;
  budget: string;
  regnummer: string;
  searchOption: string;
  quoteId: string;
}

interface QuizAnswersData {
  budget_type?: string;
  budget_min?: number;
  budget_max?: number;
  body_type?: string[];
  fuel_type?: string[];
  daily_use?: string;
  annual_mileage?: string;
  priorities?: string[];
  brand_preference?: string;
}

interface QuoteRequest {
  id: string;
  created_at: string;
  search_option: string;
  regnummer: string;
  miltal: number;
  buying_stage: string;
  budget: string;
  payment_type: string;
  monthly_payment: string;
  car_model: string;
  fuel_type: string;
  link_or_seller: string;
  target_car: string;
  additional_requests: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  preferred_time: string;
  status: string;
  handled_by: string | null;
  notes: string;
  quiz_answers?: QuizAnswersData | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Ny' },
  { value: 'contacted', label: 'Kontaktad' },
  { value: 'converted', label: 'Konverterad' },
  { value: 'won', label: 'Vunnen' },
  { value: 'lost', label: 'Förlorad' },
];

const OPTION_LABELS: Record<string, string> = {
  searching: 'Söker bil',
  found: 'Hittat bil',
  trade: 'Byta in',
};

const OPTION_ICONS: Record<string, typeof Search> = {
  searching: Search,
  found: CarIcon,
  trade: Repeat,
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Kontant',
  finance: 'Billån / leasing',
  mix: 'Kombination',
};

const STAGE_LABELS: Record<string, string> = {
  just_started: 'Precis börjat titta',
  comparing: 'Jämför olika bilar',
  ready_to_buy: 'Redo att köpa',
};

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Bensin',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'El',
};

const TIME_LABELS: Record<string, string> = {
  morning: 'Formiddag (08-12)',
  lunch: 'Lunch (12-14)',
  afternoon: 'Eftermiddag (14-17)',
  evening: 'Kvall (17-20)',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminQuoteDetail({ quoteId, onBack, onConvertToCar, onCreateOffer }: AdminQuoteDetailProps) {
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    const { data } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();
    if (data) {
      setQuote(data as QuoteRequest);
      setStatus(data.status);
      setNotes(data.notes || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await supabase
      .from('quote_requests')
      .update({ status, notes })
      .eq('id', quoteId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConvert = () => {
    if (!quote) return;
    onConvertToCar({
      customerName: `${quote.firstname} ${quote.lastname}`.trim(),
      customerPhone: quote.phone,
      customerEmail: quote.email,
      carModel: quote.car_model,
      budget: quote.budget,
      regnummer: quote.regnummer,
      searchOption: quote.search_option,
      quoteId: quote.id,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Förfrågningen hittades inte.</p>
      </div>
    );
  }

  const Icon = OPTION_ICONS[quote.search_option] || Search;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium transition"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Sparat' : 'Spara'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                    {quote.firstname} {quote.lastname}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {OPTION_LABELS[quote.search_option] || quote.search_option} -- Inkom {formatDateTime(quote.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <a href={`tel:${quote.phone}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {quote.phone}
                </a>
                {quote.email && (
                  <a href={`mailto:${quote.email}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {quote.email}
                  </a>
                )}
                {quote.preferred_time && (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {TIME_LABELS[quote.preferred_time] || 'Så snart som möjligt'}
                  </span>
                )}
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Detaljer</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {quote.search_option === 'searching' && (
                  <>
                    {quote.buying_stage && (
                      <DetailRow label="Köpfas" value={STAGE_LABELS[quote.buying_stage] || quote.buying_stage} />
                    )}
                    {quote.car_model && <DetailRow label="Sökt bil" value={quote.car_model} />}
                    {quote.payment_type && <DetailRow label="Betalning" value={PAYMENT_LABELS[quote.payment_type] || quote.payment_type} />}
                    {quote.budget && <DetailRow label="Budget" value={quote.budget.includes('kr') ? quote.budget : `${quote.budget} kr`} />}
                    {quote.monthly_payment && <DetailRow label="Månadskostnad" value={quote.monthly_payment.includes('kr') ? quote.monthly_payment : `${quote.monthly_payment} kr/mån`} />}
                    {quote.fuel_type && <DetailRow label="Drivmedel" value={FUEL_LABELS[quote.fuel_type] || quote.fuel_type} />}
                  </>
                )}
                {quote.search_option === 'found' && (
                  <>
                    {quote.regnummer && <DetailRow label="Regnummer" value={quote.regnummer} />}
                    {quote.link_or_seller && (
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Annonslänk / säljare</dt>
                        <dd className="text-slate-900 font-medium mt-0.5">
                          {quote.link_or_seller.startsWith('http') ? (
                            <a
                              href={quote.link_or_seller}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {quote.link_or_seller}
                            </a>
                          ) : (
                            quote.link_or_seller
                          )}
                        </dd>
                      </div>
                    )}
                  </>
                )}
                {quote.search_option === 'trade' && (
                  <>
                    {quote.regnummer && <DetailRow label="Regnummer (nuvarande)" value={quote.regnummer} />}
                    {quote.miltal > 0 && <DetailRow label="Miltal" value={`${quote.miltal.toLocaleString('sv-SE')} mil`} />}
                    {quote.car_model && <DetailRow label="Vill byta till" value={quote.car_model} />}
                    {quote.payment_type && <DetailRow label="Betalning" value={PAYMENT_LABELS[quote.payment_type] || quote.payment_type} />}
                    {quote.budget && <DetailRow label="Budget" value={quote.budget.includes('kr') ? quote.budget : `${quote.budget} kr`} />}
                    {quote.monthly_payment && <DetailRow label="Månadskostnad" value={quote.monthly_payment.includes('kr') ? quote.monthly_payment : `${quote.monthly_payment} kr/mån`} />}
                  </>
                )}
              </dl>
              {quote.additional_requests && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Övriga önskemål</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.additional_requests}</p>
                </div>
              )}
            </div>

            {/* Quiz answers */}
            {quote.quiz_answers && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">Quiz-preferenser</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {quote.quiz_answers.body_type && quote.quiz_answers.body_type.length > 0 && (
                    <DetailRow label="Karosstyp" value={quote.quiz_answers.body_type.join(', ')} />
                  )}
                  {quote.quiz_answers.fuel_type && quote.quiz_answers.fuel_type.length > 0 && (
                    <DetailRow label="Drivlina" value={quote.quiz_answers.fuel_type.map(f =>
                      f === 'electric' ? 'El' : f === 'hybrid' ? 'Hybrid' : f === 'petrol' ? 'Bensin' : 'Diesel'
                    ).join(', ')} />
                  )}
                  {quote.quiz_answers.budget_type && (
                    <DetailRow
                      label="Budget"
                      value={`${quote.quiz_answers.budget_type === 'monthly' ? 'Månadsbetalning' : 'Kontant'}${
                        quote.quiz_answers.budget_min ? ` från ${quote.quiz_answers.budget_min.toLocaleString('sv-SE')} kr` : ''
                      }${quote.quiz_answers.budget_max ? ` till ${quote.quiz_answers.budget_max.toLocaleString('sv-SE')} kr` : ''}`}
                    />
                  )}
                  {quote.quiz_answers.daily_use && (
                    <DetailRow label="Vardagsanvändning" value={
                      quote.quiz_answers.daily_use === 'solo' ? 'Mest ensam / pendling' :
                      quote.quiz_answers.daily_use === 'family' ? 'Familj' :
                      quote.quiz_answers.daily_use === 'cargo' ? 'Mycket last' : 'Sporadiskt'
                    } />
                  )}
                  {quote.quiz_answers.annual_mileage && (
                    <DetailRow label="Årlig körning" value={
                      quote.quiz_answers.annual_mileage === 'low' ? 'Under 1 000 mil' :
                      quote.quiz_answers.annual_mileage === 'medium' ? '1 000-2 000 mil' : 'Over 2 000 mil'
                    } />
                  )}
                  {quote.quiz_answers.brand_preference && quote.quiz_answers.brand_preference !== 'no_preference' && (
                    <DetailRow label="Märkestyp" value={
                      quote.quiz_answers.brand_preference === 'premium' ? 'Premium' :
                      quote.quiz_answers.brand_preference === 'mainstream' ? 'Mainstream' : 'Prisvart'
                    } />
                  )}
                  {quote.quiz_answers.priorities && quote.quiz_answers.priorities.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-slate-500">Prioriteringar</dt>
                      <dd className="text-slate-900 font-medium mt-0.5">
                        {quote.quiz_answers.priorities.map(p => {
                          const labels: Record<string, string> = {
                            economy: 'Låga driftskostnader', safety: 'Säkerhet', comfort: 'Komfort',
                            performance: 'Prestanda', space: 'Utrymme', tech: 'Modern teknik',
                            resale: 'Andrahandsvärde', reliability: 'Pålitlighet',
                          };
                          return labels[p] || p;
                        }).join(', ')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3">Interna anteckningar</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Skriv anteckningar har..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Create offer */}
            {onCreateOffer && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Skapa erbjudande</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Skapa ett erbjudande med prisuppgifter och besparingsredovisning som kunden kan se i sin portal.
                </p>
                <button
                  onClick={() => onCreateOffer(quoteId)}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                >
                  <FileText className="w-4 h-4" />
                  Skapa erbjudande
                </button>
              </div>
            )}

            {/* Convert action */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Skapa ärende</h3>
              <p className="text-xs text-slate-500 mb-4">
                Konvertera denna förfrågning till en bil i systemet som handlare kan lägga bud på.
              </p>
              <button
                onClick={handleConvert}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#0e6efe] hover:bg-[#0b5cd8] text-white text-sm font-semibold transition"
              >
                <ArrowRightCircle className="w-4 h-4" />
                Konvertera till bil
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-900 font-medium mt-0.5">{value}</dd>
    </div>
  );
}
