import { useState } from 'react';
import { X, Check, Phone, ArrowRight, Search, Handshake, ArrowLeftRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CAR_BRANDS, POPULAR_BRANDS } from '../lib/carBrands';
import RegInput from './RegInput';
import FieldError from './forms/FieldError';

export type InlineFunnelTrack = 'found' | 'searching' | 'trade';

interface InlineFunnelProps {
  carName: string;
  monthlyCost?: number;
  onClose: () => void;
  source?: string;
}

type FunnelStep = 'track' | 'details' | 'tradeIn' | 'contact' | 'done';

const BUYING_STAGES = [
  { value: 'just_started', label: 'Precis börjat kolla' },
  { value: 'comparing', label: 'Jämför alternativ' },
  { value: 'ready_to_buy', label: 'Redo att köpa' },
];

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Kontant' },
  { value: 'finance', label: 'Finansiering' },
];

const FUEL_TYPES = [
  { value: 'petrol', label: 'Bensin' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid / Laddhybrid' },
  { value: 'electric', label: 'El' },
  { value: 'no_pref', label: 'Spelar ingen roll' },
];

const TIMES = [
  { value: 'morning', label: '08–12' },
  { value: 'lunch', label: '12–14' },
  { value: 'afternoon', label: '14–17' },
  { value: 'evening', label: '17–20' },
];

export default function InlineFunnel({ carName, monthlyCost, onClose, source = '' }: InlineFunnelProps) {
  const [track, setTrack] = useState<InlineFunnelTrack | null>(null);
  const [step, setStep] = useState<FunnelStep>('track');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Details fields
  const [linkOrSeller, setLinkOrSeller] = useState('');
  const [carModel, setCarModel] = useState(carName);
  const [carBrand, setCarBrand] = useState('');
  const [carModelSel, setCarModelSel] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [buyingStage, setBuyingStage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [targetCar, setTargetCar] = useState(carName);
  const [desiredMonthlyCost, setDesiredMonthlyCost] = useState(monthlyCost ? String(monthlyCost) : '');
  const [additionalRequests, setAdditionalRequests] = useState('');
  const [tradeReg, setTradeReg] = useState('');
  const [tradeMiltal, setTradeMiltal] = useState('');
  const [hasTradeIn, setHasTradeIn] = useState<boolean | null>(null);
  const [tradeInReg, setTradeInReg] = useState('');
  const [hasLoan, setHasLoan] = useState<boolean | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');

  // Contact fields
  const [namn, setNamn] = useState('');
  const [telefon, setTelefon] = useState('');
  const [mejl, setMejl] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);

  const models = carBrand ? (CAR_BRANDS[carBrand] ?? []) : [];

  const chooseTrack = (t: InlineFunnelTrack) => {
    setTrack(t);
    setStep('details');
    setFieldErrors({});
    setError(null);
  };

  const validateDetails = (): boolean => {
    const e: Record<string, string> = {};
    if (!buyingStage) e.buyingStage = 'Välj var du är i processen';
    if (!paymentType) e.paymentType = 'Välj hur du vill betala';
    if (paymentType === 'finance' && !desiredMonthlyCost.trim()) e.desiredMonthlyCost = 'Fyll i önskad månadskostnad';
    if (track === 'found' && !linkOrSeller.trim()) e.linkOrSeller = 'Fyll i länk eller säljarens namn';
    if (track === 'trade' && !tradeReg.trim()) e.tradeReg = 'Fyll i regnummer';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateTradeIn = (): boolean => {
    const e: Record<string, string> = {};
    if (hasTradeIn === null) e.hasTradeIn = 'Svara på om du har en inbytesbil';
    if (hasTradeIn) {
      if (!tradeInReg.trim()) e.tradeInReg = 'Fyll i regnummer för inbytesbilen';
      if (hasLoan === null) e.hasLoan = 'Svara på om bilen har befintligt lån';
      if (hasLoan) {
        if (!loanAmount.trim()) e.loanAmount = 'Fyll i lånebelopp';
        if (!interestRate.trim()) e.interestRate = 'Fyll i nuvarande ränta';
      }
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateContact = (): boolean => {
    const e: Record<string, string> = {};
    if (!namn.trim()) e.namn = 'Namn är obligatoriskt';
    if (!telefon.trim()) e.telefon = 'Telefonnummer är obligatoriskt';
    if (!mejl.trim()) e.mejl = 'E-post är obligatorisk';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mejl)) e.mejl = 'Ogiltig e-postadress';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToContact = () => {
    if (!validateDetails()) return;
    setDetailsSubmitted(true);
    if (track === 'found' || track === 'trade') {
      setStep('contact');
    } else {
      setStep('tradeIn');
    }
    setFieldErrors({});
  };

  const goFromTradeIn = () => {
    if (!validateTradeIn()) return;
    setStep('contact');
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    if (!validateContact()) return;
    if (!track) return;
    setSubmitting(true);
    setError(null);

    try {
      const carModelFull = track === 'searching'
        ? [carBrand, carModelSel].filter(Boolean).join(' ').trim() || ''
        : track === 'trade'
          ? [carBrand, carModelSel].filter(Boolean).join(' ').trim() || targetCar
          : carModel;

      const { error: dbError } = await supabase.from('quote_requests').insert({
        search_option: track,
        regnummer: track === 'trade' ? tradeReg : '',
        miltal: tradeMiltal ? parseInt(tradeMiltal) : 0,
        buying_stage: buyingStage,
        budget: '',
        payment_type: paymentType,
        car_model: carModelFull || carName,
        fuel_type: fuelType === 'no_pref' ? '' : fuelType,
        link_or_seller: linkOrSeller,
        target_car: track === 'trade' ? carName : targetCar,
        additional_requests: additionalRequests + (source ? ` [Källa: ${source}]` : ''),
        desired_monthly_cost: paymentType === 'cash' ? '' : desiredMonthlyCost,
        monthly_payment: paymentType === 'cash' ? '' : desiredMonthlyCost,
        has_trade_in: track === 'trade' ? true : (hasTradeIn ?? false),
        trade_in_reg: track === 'trade' ? tradeReg : (hasTradeIn ? tradeInReg : ''),
        current_loan: hasTradeIn && hasLoan ? loanAmount : '',
        current_interest_rate: hasTradeIn && hasLoan ? interestRate : '',
        firstname: namn.split(' ')[0] || '',
        lastname: namn.split(' ').slice(1).join(' ') || '',
        email: mejl,
        phone: telefon,
        preferred_time: preferredTime,
        status: 'new',
      });

      if (dbError) {
        setError('Kunde inte spara din förfrågan. Försök igen.');
        setSubmitting(false);
        return;
      }

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-quote-request`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: mejl, phone: telefon }),
        });
      } catch { /* best effort */ }

      setStep('done');
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const carDisplayLabel = track === 'trade' ? `Vill byta mot ${carName}` : carName;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_40px_-12px_rgba(14,110,254,0.18)] ring-1 ring-[#0e6efe]/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0e6efe] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
          <div className="min-w-0">
            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider leading-none mb-0.5">
              {step === 'done' ? 'Förfrågan skickad' : 'Hitta bästa priset'}
            </p>
            <p className="text-white text-[14px] font-bold truncate leading-tight">
              {step === 'track' ? carName : carDisplayLabel}
            </p>
          </div>
          {monthlyCost && step === 'track' && (
            <span className="ml-2 shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold">
              ~{monthlyCost.toLocaleString('sv-SE')} kr/mån
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 text-white transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5">
        {/* TRACK STEP */}
        {step === 'track' && (
          <div className="space-y-3">
            <p className="text-[14px] text-slate-500 mb-4">Välj det som passar dig bäst.</p>

            {[
              { id: 'found' as const, icon: Handshake, title: 'Jag har hittat en bil', desc: 'Vi förhandlar med säljaren åt dig och pressar priset.' },
              { id: 'searching' as const, icon: Search, title: 'Jag söker en bil', desc: 'Vi hittar, kollar och förhandlar åt dig.' },
              { id: 'trade' as const, icon: ArrowLeftRight, title: 'Jag vill byta in', desc: `Vi sköter inbytet och hjälper dig hitta ny bil.` },
            ].map(({ id, icon: Icon, title, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseTrack(id)}
                className="group w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    {id === 'trade'
                      ? <p className="text-[13px] text-slate-500 mt-0.5">Vi sköter inbytet -- du väljer ny bil.</p>
                      : <p className="text-[13px] text-slate-500 mt-0.5">{desc}</p>
                    }
                  </div>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 text-[13px] text-slate-400 hover:text-[#0e6efe] transition-colors py-2"
            >
              <Phone className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Osäker? <span className="font-semibold underline underline-offset-2">Vi ringer och guidar dig</span></span>
            </button>
          </div>
        )}

        {/* DETAILS STEP */}
        {step === 'details' && track && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => { setStep('track'); setFieldErrors({}); }} className="text-[13px] text-slate-400 hover:text-slate-700 transition">
                ← Tillbaka
              </button>
            </div>

            {track === 'found' && (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Länk till annonsen eller säljarens namn
                </label>
                <input
                  type="text"
                  value={linkOrSeller}
                  onChange={e => { setLinkOrSeller(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.linkOrSeller; return n; }); }}
                  placeholder="https://... eller handlarens namn"
                  className={`form-control text-[14px] ${fieldErrors.linkOrSeller ? 'form-control-error' : ''}`}
                />
                <FieldError message={fieldErrors.linkOrSeller} />
              </div>
            )}

            {track === 'trade' && (
              <>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Regnummer på din nuvarande bil
                  </label>
                  <RegInput
                    value={tradeReg}
                    onChange={v => { setTradeReg(v); setFieldErrors(p => { const n = {...p}; delete n.tradeReg; return n; }); }}
                    error={!!fieldErrors.tradeReg}
                  />
                  <FieldError message={fieldErrors.tradeReg} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Miltal</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tradeMiltal}
                    onChange={e => setTradeMiltal(e.target.value)}
                    placeholder="T.ex. 4 500"
                    className="form-control text-[14px]"
                  />
                </div>
              </>
            )}

            {track === 'searching' && (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Märke och modell (valfritt)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={carBrand}
                      onChange={e => { setCarBrand(e.target.value); setCarModelSel(''); }}
                      className="form-control text-[13px] appearance-none pr-8"
                    >
                      <option value="">Välj märke</option>
                      {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={carModelSel}
                      onChange={e => setCarModelSel(e.target.value)}
                      disabled={!carBrand}
                      className="form-control text-[13px] appearance-none pr-8 disabled:opacity-50"
                    >
                      <option value="">{carBrand ? 'Välj modell' : 'Välj märke'}</option>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Var i processen är du?</label>
              <div className="flex flex-wrap gap-1.5">
                {BUYING_STAGES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => { setBuyingStage(s.value); setFieldErrors(p => { const n = {...p}; delete n.buyingStage; return n; }); }}
                    className={`px-3.5 h-9 rounded-full text-[13px] font-medium transition-all ${buyingStage === s.value ? 'bg-[#0e6efe] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <FieldError message={fieldErrors.buyingStage} />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Hur vill du betala?</label>
              <div className="flex gap-2">
                {PAYMENT_TYPES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setPaymentType(p.value); if (p.value === 'cash') setDesiredMonthlyCost(''); setFieldErrors(prev => { const n = {...prev}; delete n.paymentType; return n; }); }}
                    className={`flex-1 h-9 rounded-full text-[13px] font-medium transition-all ${paymentType === p.value ? 'bg-[#0e6efe] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <FieldError message={fieldErrors.paymentType} />
            </div>

            {paymentType === 'finance' && (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Önskad månadskostnad (kr)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={desiredMonthlyCost}
                  onChange={e => { setDesiredMonthlyCost(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.desiredMonthlyCost; return n; }); }}
                  placeholder="T.ex. 4 500"
                  className={`form-control text-[14px] ${fieldErrors.desiredMonthlyCost ? 'form-control-error' : ''}`}
                />
                <FieldError message={fieldErrors.desiredMonthlyCost} />
              </div>
            )}

            {track === 'searching' && (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Drivmedel</label>
                <div className="flex flex-wrap gap-1.5">
                  {FUEL_TYPES.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFuelType(fuelType === f.value ? '' : f.value)}
                      className={`px-3.5 h-9 rounded-full text-[13px] font-medium transition-all ${fuelType === f.value ? 'bg-[#0e6efe] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Övriga önskemål (valfritt)</label>
              <textarea
                value={additionalRequests}
                onChange={e => setAdditionalRequests(e.target.value)}
                placeholder="Tillval, färg, garanti..."
                rows={2}
                maxLength={500}
                className="form-control text-[14px]"
              />
            </div>

            {error && <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="button"
              onClick={goToContact}
              className="w-full h-11 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[14px] rounded-full transition shadow-sm"
            >
              Nästa
            </button>
          </div>
        )}

        {/* TRADE-IN STEP */}
        {step === 'tradeIn' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => { setStep('details'); setFieldErrors({}); setDetailsSubmitted(false); }} className="text-[13px] text-slate-400 hover:text-slate-700 transition">
                ← Tillbaka
              </button>
            </div>
            <p className="text-[14px] font-semibold text-slate-900">Har du en bil att byta in?</p>
            <div className="flex gap-2">
              {([true, false] as const).map(val => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => { setHasTradeIn(val); if (!val) { setTradeInReg(''); setHasLoan(null); setLoanAmount(''); setInterestRate(''); } setFieldErrors(p => { const n = {...p}; delete n.hasTradeIn; return n; }); }}
                  className={`flex-1 h-11 rounded-full text-[14px] font-semibold transition-all ${hasTradeIn === val ? 'bg-[#0e6efe] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {val ? 'Ja' : 'Nej'}
                </button>
              ))}
            </div>
            <FieldError message={fieldErrors.hasTradeIn} />

            {hasTradeIn && (
              <>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Regnummer på inbytesbilen</label>
                  <RegInput
                    value={tradeInReg}
                    onChange={v => { setTradeInReg(v); setFieldErrors(p => { const n = {...p}; delete n.tradeInReg; return n; }); }}
                    error={!!fieldErrors.tradeInReg}
                  />
                  <FieldError message={fieldErrors.tradeInReg} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900 mb-2">Har bilen befintligt lån?</p>
                  <div className="flex gap-2">
                    {([true, false] as const).map(val => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => { setHasLoan(val); if (!val) { setLoanAmount(''); setInterestRate(''); } setFieldErrors(p => { const n = {...p}; delete n.hasLoan; return n; }); }}
                        className={`flex-1 h-11 rounded-full text-[14px] font-semibold transition-all ${hasLoan === val ? 'bg-[#0e6efe] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {val ? 'Ja' : 'Nej'}
                      </button>
                    ))}
                  </div>
                  <FieldError message={fieldErrors.hasLoan} />
                </div>
                {hasLoan && (
                  <>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Lånebelopp (kr)</label>
                      <input type="text" inputMode="numeric" value={loanAmount} onChange={e => { setLoanAmount(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.loanAmount; return n; }); }} placeholder="T.ex. 150 000" className={`form-control text-[14px] ${fieldErrors.loanAmount ? 'form-control-error' : ''}`} />
                      <FieldError message={fieldErrors.loanAmount} />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nuvarande ränta (%)</label>
                      <input type="text" inputMode="decimal" value={interestRate} onChange={e => { setInterestRate(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.interestRate; return n; }); }} placeholder="T.ex. 6,5" className={`form-control text-[14px] ${fieldErrors.interestRate ? 'form-control-error' : ''}`} />
                      <FieldError message={fieldErrors.interestRate} />
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={goFromTradeIn}
              className="w-full h-11 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[14px] rounded-full transition shadow-sm"
            >
              Nästa
            </button>
          </div>
        )}

        {/* CONTACT STEP */}
        {step === 'contact' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => { setStep(track === 'found' || track === 'trade' ? 'details' : 'tradeIn'); setFieldErrors({}); }} className="text-[13px] text-slate-400 hover:text-slate-700 transition">
                ← Tillbaka
              </button>
            </div>
            <p className="text-[14px] font-semibold text-slate-900">Dina uppgifter</p>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Fullständigt namn</label>
              <input type="text" autoComplete="name" value={namn} onChange={e => { setNamn(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.namn; return n; }); }} placeholder="Johan Andersson" className={`form-control text-[14px] ${fieldErrors.namn ? 'form-control-error' : ''}`} />
              <FieldError message={fieldErrors.namn} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Telefonnummer</label>
              <input type="tel" inputMode="tel" autoComplete="tel" value={telefon} onChange={e => { setTelefon(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.telefon; return n; }); }} placeholder="070-123 45 67" className={`form-control text-[14px] ${fieldErrors.telefon ? 'form-control-error' : ''}`} />
              <FieldError message={fieldErrors.telefon} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">E-postadress</label>
              <input type="text" inputMode="email" autoComplete="email" value={mejl} onChange={e => { setMejl(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.mejl; return n; }); }} placeholder="johan@example.com" className={`form-control text-[14px] ${fieldErrors.mejl ? 'form-control-error' : ''}`} />
              <FieldError message={fieldErrors.mejl} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Bästa tid att ringa</label>
              <div className="flex flex-wrap gap-1.5">
                {TIMES.map(t => (
                  <button key={t.value} type="button" onClick={() => setPreferredTime(preferredTime === t.value ? '' : t.value)} className={`px-3.5 h-9 rounded-full text-[13px] font-medium transition-all ${preferredTime === t.value ? 'bg-[#0e6efe] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full h-11 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] rounded-full transition shadow-sm"
            >
              {submitting ? 'Skickar...' : 'Skicka förfrågan'}
            </button>
            <p className="text-[11px] text-slate-400 text-center">100% kostnadsfritt. Vi ringer dig inom en timme.</p>
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 mb-2">Tack, {namn.split(' ')[0] || 'vän'}!</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed max-w-xs mx-auto mb-5">
              Vi har tagit emot din förfrågan och ringer dig snart för att gå igenom allting.
            </p>
            <div className="space-y-2 text-left mb-5">
              {[
                { num: 1, title: 'Förfrågan mottagen', sub: 'Vi har all information vi behöver.' },
                { num: 2, title: 'Vi ringer dig', sub: preferredTime ? `Klockan ${preferredTime === 'morning' ? '08–12' : preferredTime === 'lunch' ? '12–14' : preferredTime === 'afternoon' ? '14–17' : '17–20'}` : 'Inom en arbetsdag' },
                { num: 3, title: 'Vi förhandlar och levererar', sub: 'Du lutar dig tillbaka.' },
              ].map(item => (
                <div key={item.num} className="flex items-start gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.num === 1 ? 'bg-[#0e6efe]' : 'bg-slate-200'}`}>
                    {item.num === 1
                      ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      : <span className="text-[10px] font-bold text-slate-500">{item.num}</span>
                    }
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[12px] text-slate-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={onClose} className="text-[13px] text-slate-400 hover:text-slate-600 transition underline underline-offset-2">
              Stäng och fortsätt bläddra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
