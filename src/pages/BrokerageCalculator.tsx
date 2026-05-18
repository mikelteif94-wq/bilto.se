import { useEffect, useMemo, useState } from 'react';
import { Menu, User, ArrowRight, Info, XCircle, Camera, Megaphone, Phone } from 'lucide-react';
import { SiteFooter } from './BrokerageLanding';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { supabase } from '../lib/supabase';
import RegInput from '../components/RegInput';

interface BrokerageCalculatorProps {
  onBackHome: () => void;
  onStartBrokerage: (regnummer?: string) => void;
}

const HERO_IMAGE = '/d158d2d6-7209-4239-986d-842219ae491d.png';

function formatSEK(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(value));
}

function estimateDealerMarginAmount(price: number) {
  if (price < 300000) {
    const t = Math.max(0, Math.min(1, (price - 75000) / 275000));
    return 25000 + t * 5000;
  }
  if (price <= 700000) {
    const t = (price - 300000) / 400000;
    return price * (0.11 - t * 0.01);
  }
  return price * 0.10;
}

const BROKERAGE_PCT = 0.02;
const MIN_BROKERAGE_FEE = 3995;
const SETUP_FEE = 1495;

export default function BrokerageCalculator({ onBackHome, onStartBrokerage }: BrokerageCalculatorProps) {
  const [marketValue, setMarketValue] = useState(220000);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [leadReg, setLeadReg] = useState('');
  const [leadError, setLeadError] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regTrim = leadReg.trim().toUpperCase().replace(/\s/g, '');
    if (!regTrim) {
      setLeadError('Ange ett registreringsnummer');
      return;
    }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(regTrim)) {
      setLeadError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setLeadError('');
    setLeadSubmitting(true);
    await supabase.from('leads').insert({ regnummer: regTrim });
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regnummer: regTrim, source: 'Förmedlingskalkylator' }),
      });
    } catch { /* best effort */ }
    setLeadSubmitting(false);
    onStartBrokerage(regTrim);
  };

  const handleMenuSelect = (item: MobileMenuItem) => {
    if (item === 'Förmedlingskalkylator') return;
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (item === 'Så funkar det') {
      window.history.pushState({}, '', '/sa-funkar-det');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  const dealerMarginAmount = useMemo(() => estimateDealerMarginAmount(marketValue), [marketValue]);
  const dealerMarginPct = marketValue > 0 ? (dealerMarginAmount / marketValue) * 100 : 0;

  const { dealerOffer, brokerageNet, brokerageFeeAmount, difference, percentMore } = useMemo(() => {
    const dealer = Math.max(0, marketValue - dealerMarginAmount);
    const feePct = marketValue * BROKERAGE_PCT;
    const fee = Math.max(feePct, MIN_BROKERAGE_FEE);
    const broker = Math.max(0, marketValue - fee);
    const diff = broker - dealer;
    const pct = dealer > 0 ? (diff / dealer) * 100 : 0;
    return {
      dealerOffer: dealer,
      brokerageNet: broker,
      brokerageFeeAmount: fee,
      difference: diff,
      percentMore: pct,
    };
  }, [marketValue, dealerMarginAmount]);

  const navItems = ['Sälj bil', 'Köp bil', 'Förmedlingskalkylator'];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Förmedlingskalkylator"
        onSelect={handleMenuSelect}
      />
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-1 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Förmedlingskalkylator') return;
                  if (item === 'Köp bil') {
                    window.history.pushState({}, '', '/kop-bil');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    return;
                  }
                  if (item === 'Så funkar det') {
                    window.history.pushState({}, '', '/sa-funkar-det');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    return;
                  }
                  onBackHome();
                }}
                className={`text-[15px] transition ${
                  item === 'Förmedlingskalkylator'
                    ? 'text-white font-semibold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <a
              href="/logga-in"
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Logga in
            </a>
          </div>
        </div>
      </header>

      <section className="relative pt-16 bg-[#0e6efe]">
        {/* Mobile hero banner (compact, solid) */}
        <div className="relative lg:hidden w-full bg-[#0e6efe] overflow-hidden">
          <div className="absolute -left-24 top-10 w-[280px] h-[280px] rounded-full bg-[#3d8cff] opacity-60" />
          <div className="absolute -right-20 top-60 w-[240px] h-[240px] rounded-full bg-[#3d8cff] opacity-50" />

          <div className="relative px-6 pt-6 pb-8">
            <span className="block text-center text-[11px] font-semibold text-white/80 uppercase tracking-[0.2em] mb-2">
              Bilförmedling
            </span>
            <h1 className="text-center text-white text-[30px] font-semibold leading-[1.1] tracking-tight">
              Vi förmedlar din bil — se hur mycket mer du får
            </h1>
            <p className="mt-3 text-center text-[14px] text-white/90 leading-snug max-w-xs mx-auto">
              Jämför direktbud från handlare med vad du får när vi förmedlar din bil&nbsp;– helt kostnadsfritt.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white text-[#0e6efe] font-semibold text-[14px] hover:bg-slate-100 transition group"
              >
                Läs mer om förmedling
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative max-w-[1360px] mx-auto px-0 lg:px-10 pt-0 lg:pt-20 pb-0 lg:pb-24 grid lg:grid-cols-[1fr_minmax(0,620px)] gap-0 lg:gap-16 items-start">
            <div className="hidden lg:block pt-8 relative">
              <span className="block text-[12px] font-semibold text-white/80 uppercase tracking-[0.2em] mb-4">
                Bilförmedling
              </span>
              <h1 className="text-white text-[56px] font-semibold leading-[1.05] tracking-tight">
                Vi förmedlar din bil — se hur mycket mer du får
              </h1>
              <p className="mt-6 text-[19px] font-medium text-white max-w-lg leading-[1.5]">
                Jämför direktbud från handlare med vad du får när vi förmedlar din bil&nbsp;– helt kostnadsfritt.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="mt-7 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-white text-[#0e6efe] font-semibold text-[15px] hover:bg-slate-100 transition group"
              >
                Läs mer om förmedling
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
              <img
                src="/benefit3_calculator_(1).svg"
                alt=""
                className="mt-8 w-full max-w-[420px] h-auto object-contain"
              />
            </div>

            <div className="bg-white lg:rounded-lg rounded-none shadow-2xl shadow-black/20 overflow-hidden w-full">
              <div className="px-5 sm:px-8 pt-8 sm:pt-10 pb-4">
                <h2 className="text-center text-[22px] font-semibold text-slate-900">
                  Se hur mycket mer du kan få
                </h2>
                <p className="mt-2 text-center text-[14px] text-slate-500 leading-relaxed">
                  Justera värdena &mdash; beräkningen uppdateras direkt.
                </p>
              </div>

              <div className="px-5 sm:px-8 py-6 space-y-8">
                <SliderRow
                  stepLabel="1. Marknadspris"
                  value={marketValue}
                  min={75000}
                  max={1750000}
                  step={5000}
                  onChange={setMarketValue}
                  display={formatSEK(marketValue)}
                  inputValue={formatNumber(marketValue)}
                  inputSuffix="kr"
                  onInputChange={(raw) => {
                    const n = Number(raw.replace(/\D/g, ''));
                    if (Number.isFinite(n)) setMarketValue(Math.min(1750000, Math.max(75000, n)));
                  }}
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-[14px] font-semibold text-slate-900 mb-3">
                    2. Vårt arvode
                  </div>
                  <div className="space-y-2 text-[13px] text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Förmedlingsarvode 2% (minst {formatSEK(MIN_BROKERAGE_FEE)})</span>
                      <span className="font-semibold tabular-nums">{formatSEK(brokerageFeeAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-900">Totalt till Bilto</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatSEK(brokerageFeeAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 -mt-4 text-[12px] text-slate-500 leading-snug">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    Uppskattad handlarmarginal för din prisklass: <strong className="text-slate-700">{formatSEK(dealerMarginAmount)}</strong> ({dealerMarginPct.toFixed(1)}%).
                    Billigare bilar kräver en högre fast marginal hos handlare för garanti och rekond.
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                        Direkt till handlare
                      </div>
                      <div className="mt-2 text-[24px] sm:text-[26px] font-semibold text-slate-900 tabular-nums leading-none">
                        {formatSEK(dealerOffer)}
                      </div>
                      <div className="mt-2 text-[12px] text-slate-500 leading-snug">
                        efter {formatSEK(dealerMarginAmount)} handlarmarginal
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#e6efff] border border-[#0e6efe]/30 p-5">
                      <div className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.12em]">
                        Via Bilto
                      </div>
                      <div className="mt-2 text-[24px] sm:text-[26px] font-semibold text-slate-900 tabular-nums leading-none">
                        {formatSEK(brokerageNet)}
                      </div>
                      <div className="mt-2 text-[12px] text-slate-500 leading-snug">
                        efter arvode {formatSEK(brokerageFeeAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-[#0e6efe] to-[#0a57cc] p-6 text-white text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      Mer i fickan
                    </div>
                    <div className="mt-2 text-[44px] sm:text-[52px] font-semibold tracking-tight leading-none tabular-nums">
                      +{formatSEK(difference)}
                    </div>
                    <div className="mt-3 text-[13px] text-white/85">
                      Motsvarar <strong>{percentMore.toFixed(1)}%</strong> mer än ett vanligt handlarbud.
                    </div>
                  </div>

                  <button
                    onClick={() => onStartBrokerage()}
                    className="w-full h-14 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[16px] transition inline-flex items-center justify-center gap-2 group"
                  >
                    Starta förmedling av min bil
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>

              <div className="px-8 pb-8">
                <p className="text-[12px] text-slate-500 text-center leading-relaxed">
                  Beräkningen är en uppskattning. Slutligt netto beror på bilens skick,
                  utrustning och marknadsläge.
                </p>
              </div>
            </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-14">
            <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-4 block">
              Förmedlingstjänst
            </span>
            <h2 className="text-[34px] sm:text-[44px] font-semibold leading-[1.08] text-slate-900 tracking-tight">
              Vi förmedlar din bil — du får maxpris.
            </h2>
            <p className="mt-5 text-[17px] text-slate-600 leading-[1.6] max-w-2xl">
              Bilto är ingen handlare. Vi är din personliga bilförmedlare som tar hand om annonsering, samtal och förhandling — så att du får ut betydligt mer än ett direktbud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 max-w-5xl mx-auto">
            {[
              {
                icon: Camera,
                title: 'Vi fixar proffsiga bilder',
                text: 'Vi tar fram professionella annonsbilder åt dig och skapar en skarp annons som lyfter bilens bästa sidor.',
              },
              {
                icon: Megaphone,
                title: 'Vi annonserar & förhandlar',
                text: 'Vi lägger upp annonsen, tar alla samtal och förhandlar med köparna. Du sköter själva visningen — köparen kommer till dig.',
              },
              {
                icon: Phone,
                title: 'Vi presenterar buden',
                text: 'Vi ringer dig när det finns ett skarpt bud att ta ställning till. Ingen avgift om bilen inte säljs.',
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="flex flex-col items-center text-center px-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e8f0ff] to-[#d6e4ff] flex items-center justify-center mb-6 shadow-sm ring-1 ring-[#0e6efe]/10">
                    <Icon className="w-8 h-8 text-[#0e6efe]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[20px] md:text-[21px] font-semibold mb-3 text-slate-900 leading-snug tracking-tight">
                    {c.title}
                  </h3>
                  <p
                    className="text-slate-600 text-[15px] md:text-[16px] leading-[1.65] max-w-sm"
                    dangerouslySetInnerHTML={{ __html: c.text }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[15px] transition group shadow-[0_10px_24px_-8px_rgba(14,110,254,0.5)]"
            >
              Läs mer om förmedling
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] py-16 sm:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="md:text-left">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Kom igång
              </span>
              <h3 className="text-[34px] sm:text-[44px] font-semibold text-slate-900 leading-[1.02] tracking-[-0.02em]">
                Vill du sälja din bil?
              </h3>
              <p className="text-[17px] text-slate-600 mt-5 max-w-md leading-[1.6]">
                Få ett skarpt bud från utvalda handlare på några minuter.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] p-5">
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2.5">
                <RegInput value={leadReg} onChange={(v) => { setLeadReg(v); setLeadError(''); }} disabled={leadSubmitting} />
                {leadError && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                    <span className="leading-snug">{leadError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="mt-1 h-12 w-full rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
                >
                  {leadSubmitting ? 'Skickar…' : 'Starta värdering'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

interface SliderRowProps {
  stepLabel: string;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  inputValue: string;
  inputSuffix: string;
  onInputChange: (raw: string) => void;
}

function SliderRow({
  stepLabel,
  tooltip,
  value,
  min,
  max,
  step,
  onChange,
  inputValue,
  inputSuffix,
  onInputChange,
}: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(inputValue);

  useEffect(() => {
    if (!editing) setDraft(inputValue);
  }, [inputValue, editing]);

  const commit = () => {
    onInputChange(draft);
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <label className="text-[14px] font-semibold text-slate-900 inline-flex items-center gap-1.5">
          {stepLabel}
          {tooltip && (
            <span className="group relative inline-flex">
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" strokeWidth={2} />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-slate-900 text-white text-[11px] font-normal leading-snug rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 transition z-10 shadow-lg">
                {tooltip}
              </span>
            </span>
          )}
        </label>
        <div className="relative shrink-0">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={editing ? draft : inputValue}
            onFocus={(e) => {
              setEditing(true);
              setDraft(inputValue.replace(/\D/g, ''));
              requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="h-11 w-32 pr-9 pl-3 rounded-md border border-slate-300 text-right text-[16px] font-medium text-slate-900 focus:outline-none focus:border-slate-900 tabular-nums bg-white"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-500 pointer-events-none">
            {inputSuffix}
          </span>
        </div>
      </div>
      <div className="relative h-5 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bilto-range w-full"
          style={{
            background: `linear-gradient(to right, #0e6efe 0%, #0e6efe ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
          }}
        />
      </div>
      <style>{`
        .bilto-range {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          border-radius: 999px;
          outline: none;
        }
        .bilto-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0e6efe;
          border: 0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .bilto-range::-webkit-slider-thumb:hover {
          transform: scale(1.08);
        }
        .bilto-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0e6efe;
          border: 0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

