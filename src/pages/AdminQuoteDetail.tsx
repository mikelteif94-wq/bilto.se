import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  Check,
  FileText,
  Link2,
  Loader2,
  Mail,
  Phone,
  Clock,
  Search,
  Car as CarIcon,
  Repeat,
  Save,
  ArrowRightCircle,
  Send,
  Plus,
  Trash2,
  Image,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';
import DealerDispatchPanel from '../components/DealerDispatchPanel';
import LeadTimeline from '../components/LeadTimeline';

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
  access_token: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  deal_readiness: string;
}

interface SuggestionRow {
  id: string;
  car_description: string;
  car_image_url: string;
  price: number;
  monthly_cost: number | null;
  link: string;
  admin_comment: string;
  status: string;
  sent_at: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Ny' },
  { value: 'contacted', label: 'Kontaktad' },
  { value: 'converted', label: 'Konverterad' },
  { value: 'won', label: 'Vunnen' },
  { value: 'lost', label: 'Forlorad' },
];

const OPTION_LABELS: Record<string, string> = {
  searching: 'Letar efter bil',
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
  finance: 'Billan / leasing',
  mix: 'Kombination',
};

const STAGE_LABELS: Record<string, string> = {
  just_started: 'Precis borjat titta',
  comparing: 'Jamfor olika bilar',
  ready_to_buy: 'Redo att kopa',
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

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 32; i++) token += chars[arr[i] % chars.length];
  return token;
}

export default function AdminQuoteDetail({ quoteId, onBack, onConvertToCar, onCreateOffer }: AdminQuoteDetailProps) {
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [sgDesc, setSgDesc] = useState('');
  const [sgImage, setSgImage] = useState('');
  const [sgPrice, setSgPrice] = useState('');
  const [sgMonthly, setSgMonthly] = useState('');
  const [sgLink, setSgLink] = useState('');
  const [sgComment, setSgComment] = useState('');
  const [sgSaving, setSgSaving] = useState(false);

  // Dealer forwarding
  const [forwarding, setForwarding] = useState(false);
  const [forwarded, setForwarded] = useState(false);

  // Admin identity for timeline
  const [adminUserId, setAdminUserId] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Admin');

  useEffect(() => {
    fetchQuote();
    fetchSuggestions();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAdminUserId(user.id);
      const { data } = await supabase
        .from('admin_users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      setAdminName(data?.name ?? user.email?.split('@')[0] ?? 'Admin');
    })();
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

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from('quote_suggestions')
      .select('*')
      .eq('quote_request_id', quoteId)
      .order('created_at', { ascending: false });
    if (data) setSuggestions(data as SuggestionRow[]);
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

  const ensureAccessToken = async (): Promise<string | null> => {
    if (!quote) return null;
    if (quote.access_token) return quote.access_token;
    const token = generateToken();
    const { error } = await supabase
      .from('quote_requests')
      .update({ access_token: token, access_token_created_at: new Date().toISOString() })
      .eq('id', quoteId);
    if (error) return null;
    setQuote(prev => prev ? { ...prev, access_token: token } : null);
    return token;
  };

  const handleCopyPortalLink = async () => {
    const token = await ensureAccessToken();
    if (!token) return;
    const url = `https://bilto.se/min-forfragan/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      window.prompt('Kopiera lanken:', url);
    }
  };

  const handleSaveSuggestion = async () => {
    if (!sgDesc.trim()) return;
    setSgSaving(true);
    const token = await ensureAccessToken();
    const { error } = await supabase.from('quote_suggestions').insert({
      quote_request_id: quoteId,
      car_description: sgDesc.trim(),
      car_image_url: sgImage.trim(),
      price: parseInt(sgPrice.replace(/\s/g, '')) || 0,
      monthly_cost: sgMonthly ? parseInt(sgMonthly.replace(/\s/g, '')) : null,
      link: sgLink.trim(),
      admin_comment: sgComment.trim(),
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    setSgSaving(false);
    if (!error) {
      setSgDesc('');
      setSgImage('');
      setSgPrice('');
      setSgMonthly('');
      setSgLink('');
      setSgComment('');
      setShowSuggestionForm(false);
      await fetchSuggestions();
      if (token && quote?.email) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-car-offer`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'suggestion',
              email: quote.email,
              firstname: quote.firstname,
              portal_url: `https://bilto.se/min-forfragan/${token}`,
            }),
          });
        } catch { /* best effort */ }
      }
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    await supabase.from('quote_suggestions').delete().eq('id', id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleForwardToDealers = async () => {
    if (!quote) return;
    setForwarding(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-dealers-new-car`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'quote_lead',
          quote_request_id: quote.id,
          customer_name: `${quote.firstname} ${quote.lastname}`.trim(),
          car_model: quote.car_model,
          budget: quote.budget,
          search_option: quote.search_option,
          fuel_type: quote.fuel_type,
          payment_type: quote.payment_type,
        }),
      });
      setForwarded(true);
      setTimeout(() => setForwarded(false), 3000);
    } catch { /* best effort */ }
    setForwarding(false);
  };

  const breadcrumbEl = (
    <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 transition font-medium">
      <ChevronLeft className="w-4 h-4" />
      Tillbaka till förfrågningar
    </button>
  );

  if (loading) {
    return (
      <PortalLayout navItems={[]} identity="Admin" identityRole="Bilto" breadcrumb={breadcrumbEl}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </PortalLayout>
    );
  }

  if (!quote) {
    return (
      <PortalLayout navItems={[]} identity="Admin" identityRole="Bilto" breadcrumb={breadcrumbEl}>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">Förfrågan hittades inte.</p>
        </div>
      </PortalLayout>
    );
  }

  const Icon = OPTION_ICONS[quote.search_option] || Search;

  return (
    <PortalLayout
      navItems={[]}
      identity="Admin"
      identityRole="Bilto"
      breadcrumb={breadcrumbEl}
      headerAction={
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium transition"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Sparat' : 'Spara'}
        </button>
      }
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                    {quote.firstname} {quote.lastname}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {OPTION_LABELS[quote.search_option] || quote.search_option} – Inkom {formatDateTime(quote.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <a href={`tel:${quote.phone}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {quote.phone}
                </a>
                {quote.email && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`mailto:${quote.email}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {quote.email}
                    </a>
                    {quote.email_verified
                      ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-xl bg-emerald-100 text-emerald-700">
                          <ShieldCheck className="w-3 h-3" />
                          Verifierad
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-xl bg-amber-100 text-amber-700">
                          <ShieldAlert className="w-3 h-3" />
                          Overifierad
                        </span>
                      )
                    }
                  </div>
                )}
                {quote.preferred_time && (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {TIME_LABELS[quote.preferred_time] || 'Sa snart som mojligt'}
                  </span>
                )}
              </div>
            </div>

            {/* Details card */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Detaljer</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {quote.search_option === 'searching' && (
                  <>
                    {quote.buying_stage && (
                      <DetailRow label="Kopfas" value={STAGE_LABELS[quote.buying_stage] || quote.buying_stage} />
                    )}
                    {quote.car_model && <DetailRow label="Sokt bil" value={quote.car_model} />}
                    {quote.payment_type && <DetailRow label="Betalning" value={PAYMENT_LABELS[quote.payment_type] || quote.payment_type} />}
                    {quote.budget && <DetailRow label="Budget" value={quote.budget.includes('kr') ? quote.budget : `${quote.budget} kr`} />}
                    {quote.monthly_payment && <DetailRow label="Manadskostnad" value={quote.monthly_payment.includes('kr') ? quote.monthly_payment : `${quote.monthly_payment} kr/man`} />}
                    {quote.fuel_type && <DetailRow label="Drivmedel" value={FUEL_LABELS[quote.fuel_type] || quote.fuel_type} />}
                    {quote.has_trade_in && (
                      <DetailRow label="Inbytesbil" value={quote.trade_in_reg ? quote.trade_in_reg.toUpperCase() : 'Ja'} />
                    )}
                    {quote.has_trade_in && quote.current_loan && (
                      <DetailRow label="Befintligt lan" value={quote.current_loan.includes('kr') ? quote.current_loan : `${quote.current_loan} kr`} />
                    )}
                    {quote.has_trade_in && quote.current_interest_rate && (
                      <DetailRow label="Nuvarande ranta" value={quote.current_interest_rate.includes('%') ? quote.current_interest_rate : `${quote.current_interest_rate}%`} />
                    )}
                  </>
                )}
                {quote.search_option === 'found' && (
                  <>
                    {quote.buying_stage && (
                      <DetailRow label="Kopfas" value={STAGE_LABELS[quote.buying_stage] || quote.buying_stage} />
                    )}
                    {quote.payment_type && <DetailRow label="Betalning" value={PAYMENT_LABELS[quote.payment_type] || quote.payment_type} />}
                    {quote.regnummer && <DetailRow label="Regnummer" value={quote.regnummer} />}
                    {quote.link_or_seller && (
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Annonslank / saljare</dt>
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
                    {quote.monthly_payment && <DetailRow label="Manadskostnad" value={quote.monthly_payment.includes('kr') ? quote.monthly_payment : `${quote.monthly_payment} kr/man`} />}
                  </>
                )}
                {quote.search_option === 'trade' && (
                  <>
                    {quote.buying_stage && (
                      <DetailRow label="Kopfas" value={STAGE_LABELS[quote.buying_stage] || quote.buying_stage} />
                    )}
                    {quote.regnummer && <DetailRow label="Regnummer (nuvarande)" value={quote.regnummer} />}
                    {quote.miltal > 0 && <DetailRow label="Miltal" value={`${quote.miltal.toLocaleString('sv-SE')} mil`} />}
                    {quote.car_model && <DetailRow label="Vill byta till" value={quote.car_model} />}
                    {quote.payment_type && <DetailRow label="Betalning" value={PAYMENT_LABELS[quote.payment_type] || quote.payment_type} />}
                    {quote.budget && <DetailRow label="Budget" value={quote.budget.includes('kr') ? quote.budget : `${quote.budget} kr`} />}
                    {quote.monthly_payment && <DetailRow label="Manadskostnad" value={quote.monthly_payment.includes('kr') ? quote.monthly_payment : `${quote.monthly_payment} kr/man`} />}
                  </>
                )}
                {quote.deal_readiness && (() => {
                  const READINESS: Record<string, { label: string; color: string }> = {
                    ready_now:    { label: 'Redo att göra affär nu',    color: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
                    within_month: { label: 'Inom en månad',             color: 'bg-blue-100 text-blue-800 ring-blue-200' },
                    just_looking: { label: 'Precis börjat kolla',       color: 'bg-slate-100 text-slate-600 ring-slate-200' },
                  };
                  const info = READINESS[quote.deal_readiness];
                  return (
                    <div className="col-span-2 flex items-center gap-3 pt-1">
                      <dt className="text-xs font-semibold text-slate-500 shrink-0">Affärsberedskap</dt>
                      <dd>
                        <span className={`inline-flex items-center text-[12px] font-semibold px-2.5 py-0.5 rounded-xl ring-1 ${info?.color ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                          {info?.label ?? quote.deal_readiness}
                        </span>
                      </dd>
                    </div>
                  );
                })()}
              </dl>
              {quote.additional_requests && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ovriga onskemal</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.additional_requests}</p>
                </div>
              )}
            </div>

            {/* Quiz answers */}
            {quote.quiz_answers && (
              <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
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
                      value={`${quote.quiz_answers.budget_type === 'monthly' ? 'Manadsbetalning' : 'Kontant'}${
                        quote.quiz_answers.budget_min ? ` fran ${quote.quiz_answers.budget_min.toLocaleString('sv-SE')} kr` : ''
                      }${quote.quiz_answers.budget_max ? ` till ${quote.quiz_answers.budget_max.toLocaleString('sv-SE')} kr` : ''}`}
                    />
                  )}
                  {quote.quiz_answers.daily_use && (
                    <DetailRow label="Vardagsanvandning" value={
                      quote.quiz_answers.daily_use === 'solo' ? 'Mest ensam / pendling' :
                      quote.quiz_answers.daily_use === 'family' ? 'Familj' :
                      quote.quiz_answers.daily_use === 'cargo' ? 'Mycket last' : 'Sporadiskt'
                    } />
                  )}
                  {quote.quiz_answers.annual_mileage && (
                    <DetailRow label="Arlig korning" value={
                      quote.quiz_answers.annual_mileage === 'low' ? 'Under 1 000 mil' :
                      quote.quiz_answers.annual_mileage === 'medium' ? '1 000-2 000 mil' : 'Over 2 000 mil'
                    } />
                  )}
                  {quote.quiz_answers.brand_preference && quote.quiz_answers.brand_preference !== 'no_preference' && (
                    <DetailRow label="Markestyp" value={
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
                            economy: 'Laga driftskostnader', safety: 'Sakerhet', comfort: 'Komfort',
                            performance: 'Prestanda', space: 'Utrymme', tech: 'Modern teknik',
                            resale: 'Andrahandsvarde', reliability: 'Palitlighet',
                          };
                          return labels[p] || p;
                        }).join(', ')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Suggestions section */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Bilforslag till kund</h2>
                <button
                  onClick={() => setShowSuggestionForm(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0e6efe] hover:bg-[#0b5cd8] text-white text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Lagg till
                </button>
              </div>

              {showSuggestionForm && (
                <div className="mb-5 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bil (t.ex. Volvo XC60 2023) *</label>
                    <input
                      type="text"
                      value={sgDesc}
                      onChange={e => setSgDesc(e.target.value)}
                      placeholder="Volvo XC60 B5 AWD 2023"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bild-URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sgImage}
                        onChange={e => setSgImage(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      />
                      {sgImage && (
                        <img src={sgImage} alt="" className="h-9 w-12 rounded object-cover border border-slate-200" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Pris (kr)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={sgPrice}
                        onChange={e => setSgPrice(e.target.value)}
                        placeholder="349000"
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Manadskostnad (kr)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={sgMonthly}
                        onChange={e => setSgMonthly(e.target.value)}
                        placeholder="4500"
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Lank till annons</label>
                    <input
                      type="text"
                      value={sgLink}
                      onChange={e => setSgLink(e.target.value)}
                      placeholder="https://www.blocket.se/..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kommentar till kund</label>
                    <textarea
                      value={sgComment}
                      onChange={e => setSgComment(e.target.value)}
                      placeholder="Varfor vi rekommenderar just denna..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveSuggestion}
                      disabled={sgSaving || !sgDesc.trim()}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:opacity-50 text-white text-sm font-semibold transition"
                    >
                      {sgSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Skicka till kund
                    </button>
                    <button
                      onClick={() => setShowSuggestionForm(false)}
                      className="h-9 px-4 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              {suggestions.length === 0 && !showSuggestionForm && (
                <p className="text-sm text-slate-500">Inga forslag skickade annu.</p>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.map(s => (
                    <div key={s.id} className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-[#faf8f5]">
                      {s.car_image_url ? (
                        <img src={s.car_image_url} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-20 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Image className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{s.car_description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          {s.price > 0 && <span>{s.price.toLocaleString('sv-SE')} kr</span>}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'viewed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {s.status === 'viewed' ? 'Sedd' : 'Skickad'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSuggestion(s.id)}
                        className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3">Interna anteckningar</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Skriv anteckningar har..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Timeline */}
            {adminUserId && (
              <LeadTimeline
                leadType="quote"
                leadId={quoteId}
                adminUserId={adminUserId}
                adminName={adminName}
                inline
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Status */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5">
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

            {/* Customer portal link */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Kundportal</h3>
              <p className="text-xs text-slate-500 mb-3">
                Kopiera lanken och skicka till kunden. Dar ser de forslag och erbjudanden.
              </p>
              <button
                onClick={handleCopyPortalLink}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
              >
                {copiedLink ? (
                  <><Check className="w-4 h-4 text-emerald-600" /> Kopierad!</>
                ) : (
                  <><Link2 className="w-4 h-4" /> Kopiera kundlank</>
                )}
              </button>
              {quote.access_token && (
                <p className="mt-2 text-[10px] text-slate-400 truncate font-mono">
                  /min-forfragan/{quote.access_token.slice(0, 8)}...
                </p>
              )}
            </div>

            {/* Dealer Dispatch */}
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Dealer Dispatch</h3>
              {quote && (
                <DealerDispatchPanel
                  quoteRequestId={quote.id}
                  adminUserId={adminUserId}
                  adminName={adminName}
                  itemLabel={quote.car_model || quote.budget ? `${quote.car_model || 'Bil'} (${quote.budget || '–'})` : 'Köplead'}
                />
              )}
            </div>

            {/* Create offer */}
            {onCreateOffer && (
              <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5">
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
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Skapa arende</h3>
              <p className="text-xs text-slate-500 mb-4">
                Konvertera denna forfragan till en bil i systemet som handlare kan lagga bud pa.
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
      </div>
      </div>
    </PortalLayout>
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
