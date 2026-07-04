import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Car, DollarSign, Gift, Calendar, Image, Eye, AlertTriangle } from 'lucide-react';
import DealerShell from '../components/DealerShell';
import { supabase } from '../lib/supabase';
import { useVehicleLookup } from '../lib/useVehicleLookup';

interface DealerNewCampaignProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

const BENEFITS = [
  { id: 'vinterdack',   label: 'Vinterhjul inkl.',        value: 5000 },
  { id: 'sommardack',   label: 'Sommarhjul inkl.',         value: 3000 },
  { id: 'service',      label: 'Service ingår 1 år',       value: 3500 },
  { id: 'dragkrok',     label: 'Dragkrok',                 value: 4000 },
  { id: 'garanti',      label: 'Garantiförlängning 2 år',  value: 8000 },
  { id: 'hemleverans',  label: 'Hemleverans',              value: 1500 },
  { id: 'besiktning',   label: 'Besiktning ingår',         value: 2000 },
  { id: 'takbox',       label: 'Takbox inkl.',             value: 3500 },
  { id: 'mattor',       label: 'Golvmattor',               value: 1500 },
  { id: 'navi',         label: 'Navi/CarPlay',             value: 4000 },
];

const DRIVMEDEL = ['Bensin', 'Diesel', 'El', 'Hybrid', 'Laddhybrid', 'Etanol'];
const KAROSS = ['Sedan', 'Kombi', 'SUV', 'Halvkombi', 'Cab', 'Pickup', 'Van'];

function fmt(n: number) { return n.toLocaleString('sv-SE'); }

function calcSavings(
  ordinariePris: number, kampanjPris: number,
  ordinарieRanta: number, kampanjRanta: number,
  lanBelopp: number, lopitid: number,
  valda: string[]
) {
  const prisrabatt = Math.max(0, ordinariePris - kampanjPris);
  let rantebesparing = 0;
  if (ordinарieRanta > 0 && kampanjRanta >= 0 && lanBelopp > 0 && lopitid > 0 && ordinарieRanta > kampanjRanta) {
    rantebesparing = Math.round(lanBelopp * (ordinарieRanta - kampanjRanta) / 100 * (lopitid / 12));
  }
  const formansvarde = valda.reduce((s, id) => s + (BENEFITS.find(b => b.id === id)?.value ?? 0), 0);
  return { prisrabatt, rantebesparing, formansvarde, total: prisrabatt + rantebesparing + formansvarde };
}

function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

const STEPS = [
  { id: 1, label: 'Bil',      icon: Car },
  { id: 2, label: 'Priser',   icon: DollarSign },
  { id: 3, label: 'Förmåner', icon: Gift },
  { id: 4, label: 'Period',   icon: Calendar },
  { id: 5, label: 'Bild',     icon: Image },
  { id: 6, label: 'Granska',  icon: Eye },
];

// ── Input component ──────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
        {label}{required && <span style={{ color: '#E4002B' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-11 px-4 rounded-xl text-[14px] focus:outline-none transition";
const inputStyle = { background: 'white', border: '1.5px solid #E8ECF3', color: '#1A2233', fontFamily: '"Signika", ui-sans-serif' };
const inputFocusStyle = { border: '1.5px solid #0E1B33' };

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className={inputCls + ' ' + (props.className ?? '')}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...props.style }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full h-11 px-4 rounded-xl text-[14px] focus:outline-none transition appearance-none"
      style={{ ...inputStyle }}
    />
  );
}

// ── Step 1: Bil ──────────────────────────────────────────────────────
function StepBil({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const { lookup, result, loading: lookupLoading, error: lookupError } = useVehicleLookup();

  async function handleLookup() {
    if (!form.regnr?.trim()) return;
    const r = await lookup(form.regnr.trim().toUpperCase());
    if (r) {
      setForm((prev: any) => ({
        ...prev,
        make: r.make ?? prev.make,
        model: r.model ?? prev.model,
        year: r.year ?? prev.year,
        drivmedel: r.drivmedel ?? r.fuel ?? prev.drivmedel,
      }));
    }
  }

  return (
    <div className="space-y-5">
      <Field label="Registreringsnummer">
        <div className="flex gap-2">
          <div className="flex items-center overflow-hidden rounded-xl" style={{ border: '1.5px solid #E8ECF3' }}>
            <span className="bg-[#003399] text-white text-[12px] font-bold px-2 h-11 flex items-center" style={{ fontFamily: '"Anton", Impact, sans-serif' }}>EU</span>
            <Input
              placeholder="ABC123"
              value={form.regnr}
              onChange={e => setForm((p: any) => ({ ...p, regnr: e.target.value.toUpperCase() }))}
              className="w-32 border-0 rounded-none"
              style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Anton", Impact, sans-serif', letterSpacing: '0.05em' }}
            />
          </div>
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupLoading || !form.regnr}
            className="px-4 h-11 rounded-xl font-bold text-[13px] transition shrink-0"
            style={{ background: '#0E1B33', color: '#FFD500', fontFamily: '"Signika", ui-sans-serif', opacity: !form.regnr ? 0.5 : 1 }}
          >
            {lookupLoading ? 'Hämtar…' : 'Hämta uppgifter'}
          </button>
        </div>
        {lookupError && <p className="mt-1.5 text-[12px]" style={{ color: '#E4002B' }}>{lookupError}</p>}
        {result && <p className="mt-1.5 text-[12px]" style={{ color: '#00A85A' }}>Hittade: {result.make} {result.model} {result.year}</p>}
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Märke" required>
          <Input placeholder="t.ex. Volvo" value={form.make} onChange={e => setForm((p: any) => ({ ...p, make: e.target.value }))} />
        </Field>
        <Field label="Modell" required>
          <Input placeholder="t.ex. XC60" value={form.model} onChange={e => setForm((p: any) => ({ ...p, model: e.target.value }))} />
        </Field>
        <Field label="Årsmodell">
          <Input type="number" placeholder="2022" value={form.year || ''} onChange={e => setForm((p: any) => ({ ...p, year: parseInt(e.target.value) || null }))} />
        </Field>
        <Field label="Miltal (mil)">
          <Input type="number" placeholder="5 000" value={form.mil || ''} onChange={e => setForm((p: any) => ({ ...p, mil: parseInt(e.target.value) || null }))} />
        </Field>
        <Field label="Drivmedel">
          <Select value={form.drivmedel} onChange={e => setForm((p: any) => ({ ...p, drivmedel: e.target.value }))}>
            <option value="">Välj drivmedel</option>
            {DRIVMEDEL.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Karosstyp">
          <Select value={form.kaross} onChange={e => setForm((p: any) => ({ ...p, kaross: e.target.value }))}>
            <option value="">Välj kaross</option>
            {KAROSS.map(k => <option key={k} value={k}>{k}</option>)}
          </Select>
        </Field>
      </div>
    </div>
  );
}

// ── Step 2: Priser ───────────────────────────────────────────────────
function StepPriser({ form, setForm, savings }: { form: any; setForm: (f: any) => void; savings: ReturnType<typeof calcSavings> }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Ordinarie pris (kr)" required>
          <Input type="number" placeholder="349 000" value={form.ordinarie_pris || ''} onChange={e => setForm((p: any) => ({ ...p, ordinarie_pris: parseInt(e.target.value) || 0 }))} />
        </Field>
        <Field label="Kampanjpris (kr)" required>
          <Input type="number" placeholder="299 000" value={form.kampanj_pris || ''} onChange={e => setForm((p: any) => ({ ...p, kampanj_pris: parseInt(e.target.value) || 0 }))} />
        </Field>
      </div>

      {/* Live savings preview */}
      {savings.prisrabatt > 0 && (
        <div className="rounded-2xl p-4" style={{ background: '#00A85A', boxShadow: '0 4px 20px -4px rgba(0,168,90,0.35)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: '"Signika", ui-sans-serif' }}>Prisrabatt</p>
          <p className="text-[28px] font-bold leading-none" style={{ fontFamily: '"Anton", Impact, sans-serif', color: 'white' }}>{fmt(savings.prisrabatt)} kr</p>
        </div>
      )}

      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(14,27,51,0.04)', border: '1px solid #E8ECF3' }}
      >
        <p className="text-[12px] font-bold mb-4" style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>
          Räntebesparing (valfritt)
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Lånebelopp (kr)">
            <Input type="number" placeholder="250 000" value={form.lan_belopp || ''} onChange={e => setForm((p: any) => ({ ...p, lan_belopp: parseInt(e.target.value) || 0 }))} />
          </Field>
          <Field label="Löptid (månader)">
            <Select value={form.lopitid || ''} onChange={e => setForm((p: any) => ({ ...p, lopitid: parseInt(e.target.value) || 0 }))}>
              <option value="">Välj löptid</option>
              {[12,24,36,48,60,72].map(m => <option key={m} value={m}>{m} mån</option>)}
            </Select>
          </Field>
          <Field label="Ordinarie ränta (%)">
            <Input type="number" step="0.1" placeholder="8.9" value={form.ordinarie_ranta || ''} onChange={e => setForm((p: any) => ({ ...p, ordinarie_ranta: parseFloat(e.target.value) || 0 }))} />
          </Field>
          <Field label="Kampanjränta (%)">
            <Input type="number" step="0.1" placeholder="4.9" value={form.kampanj_ranta || ''} onChange={e => setForm((p: any) => ({ ...p, kampanj_ranta: parseFloat(e.target.value) || 0 }))} />
          </Field>
        </div>
        {savings.rantebesparing > 0 && (
          <p className="mt-3 text-[13px] font-semibold" style={{ color: '#00A85A', fontFamily: '"Signika", ui-sans-serif' }}>
            Räntebesparing: {fmt(savings.rantebesparing)} kr
          </p>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Förmåner ─────────────────────────────────────────────────
function StepFormaner({ form, setForm, savings }: { form: any; setForm: (f: any) => void; savings: ReturnType<typeof calcSavings> }) {
  function toggle(id: string) {
    setForm((p: any) => ({
      ...p,
      formaner: p.formaner.includes(id) ? p.formaner.filter((x: string) => x !== id) : [...p.formaner, id],
    }));
  }

  return (
    <div className="space-y-5">
      <p className="text-[14px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
        Välj vad som ingår i kampanjen. Förmånsvärdet räknas in i den totala besparingen.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {BENEFITS.map(b => {
          const active = form.formaner.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition"
              style={{
                background: active ? '#FFD500' : 'white',
                border: active ? '1.5px solid #FFD500' : '1.5px solid #E8ECF3',
                color: active ? '#0E1B33' : '#6B7486',
              }}
            >
              <span className="text-[13px] font-semibold" style={{ fontFamily: '"Signika", ui-sans-serif' }}>{b.label}</span>
              <span className="text-[12px] font-bold ml-3" style={{ color: active ? '#0E1B33' : '#00A85A' }}>
                +{fmt(b.value)} kr
              </span>
            </button>
          );
        })}
      </div>

      {savings.formansvarde > 0 && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,213,0,0.1)', border: '1px solid rgba(255,213,0,0.3)' }}>
          <p className="text-[13px] font-bold" style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>Förmånsvärde</p>
          <p className="text-[18px] font-bold" style={{ fontFamily: '"Anton", Impact, sans-serif', color: '#0E1B33' }}>{fmt(savings.formansvarde)} kr</p>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Period ───────────────────────────────────────────────────
function StepPeriod({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Kampanjtyp">
          <Select value={form.sale_type} onChange={e => setForm((p: any) => ({ ...p, sale_type: e.target.value }))}>
            <option value="kop">Köp</option>
            <option value="leasing">Privatleasing</option>
          </Select>
        </Field>
        <Field label="Kampanjkategori">
          <Select value={form.campaign_type} onChange={e => setForm((p: any) => ({ ...p, campaign_type: e.target.value }))}>
            <option value="Kampanj">Kampanj</option>
            <option value="Lagerrensning">Lagerrensning</option>
            <option value="Demobil">Demobil</option>
            <option value="Förhandlingsklar">Förhandlingsklar</option>
            <option value="Offert">Offert</option>
          </Select>
        </Field>
      </div>

      <Field label="Slutdatum (max 30 dagar)" required>
        <Input
          type="date"
          value={form.slutdatum}
          min={minDate()}
          max={maxDate()}
          onChange={e => setForm((p: any) => ({ ...p, slutdatum: e.target.value }))}
        />
        <p className="mt-1.5 text-[11px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
          Kampanjen stänger automatiskt på slutdatumet.
        </p>
      </Field>
    </div>
  );
}

// ── Step 5: Bild ─────────────────────────────────────────────────────
function StepBild({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Bild-URL (t.ex. från din hemsida eller Blocket)">
        <Input
          type="url"
          placeholder="https://example.com/bil.jpg"
          value={form.image_url}
          onChange={e => setForm((p: any) => ({ ...p, image_url: e.target.value }))}
        />
      </Field>

      {form.image_url && (
        <div className="rounded-2xl overflow-hidden aspect-video" style={{ border: '1px solid #E8ECF3' }}>
          <img
            src={form.image_url}
            alt="Förhandsvisning"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <p className="text-[13px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
        Bilder visas på bilspara.se. Optimal storlek: 1280×720 px.
      </p>
    </div>
  );
}

// ── Step 6: Granska ──────────────────────────────────────────────────
function StepGranska({
  form, savings, certified, setCertified,
}: {
  form: any;
  savings: ReturnType<typeof calcSavings>;
  certified: boolean;
  setCertified: (v: boolean) => void;
}) {
  const pct = form.ordinarie_pris > 0
    ? Math.round(((form.ordinarie_pris - form.kampanj_pris) / form.ordinarie_pris) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Preview card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8ECF3', boxShadow: '0 4px 24px -8px rgba(14,27,51,0.12)' }}>
        {form.image_url && (
          <div className="aspect-video w-full overflow-hidden" style={{ background: '#F7F8FB' }}>
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-[18px] font-bold" style={{ fontFamily: '"Anton", Impact, sans-serif', color: '#0E1B33' }}>
                {form.make} {form.model} {form.year}
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: '#6B7486' }}>
                {[form.drivmedel, form.kaross, form.mil && `${fmt(form.mil)} mil`].filter(Boolean).join(' · ')}
              </p>
            </div>
            {pct > 0 && (
              <span className="text-[14px] font-bold px-2.5 py-1 rounded-lg text-white" style={{ background: '#E4002B', fontFamily: '"Anton", Impact, sans-serif' }}>
                -{pct}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold" style={{ fontFamily: '"Anton", Impact, sans-serif', color: '#0E1B33' }}>{fmt(form.kampanj_pris)} kr</span>
            <span className="text-[14px] line-through" style={{ color: '#6B7486' }}>{fmt(form.ordinarie_pris)} kr</span>
          </div>
          <div
            className="mt-4 rounded-xl p-3 flex items-center justify-between"
            style={{ background: '#00A85A' }}
          >
            <span className="text-[12px] font-bold uppercase tracking-wider text-white" style={{ fontFamily: '"Signika", ui-sans-serif' }}>TOTAL BESPARING</span>
            <span className="text-[20px] font-bold text-white" style={{ fontFamily: '"Anton", Impact, sans-serif' }}>{fmt(savings.total)} kr</span>
          </div>
        </div>
      </div>

      {/* Savings breakdown */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: '#F7F8FB', border: '1px solid #E8ECF3' }}>
        <div className="flex justify-between text-[13px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
          <span>Prisrabatt</span><span className="font-semibold" style={{ color: '#0E1B33' }}>{fmt(savings.prisrabatt)} kr</span>
        </div>
        {savings.rantebesparing > 0 && (
          <div className="flex justify-between text-[13px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
            <span>Räntebesparing</span><span className="font-semibold" style={{ color: '#0E1B33' }}>{fmt(savings.rantebesparing)} kr</span>
          </div>
        )}
        {savings.formansvarde > 0 && (
          <div className="flex justify-between text-[13px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
            <span>Förmånsvärde</span><span className="font-semibold" style={{ color: '#0E1B33' }}>{fmt(savings.formansvarde)} kr</span>
          </div>
        )}
        <div className="flex justify-between text-[14px] font-bold pt-2 border-t" style={{ borderColor: '#E8ECF3', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>
          <span>Totalt</span><span style={{ color: '#00A85A' }}>{fmt(savings.total)} kr</span>
        </div>
      </div>

      {/* Price certification */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(228,0,43,0.04)', border: '2px solid rgba(228,0,43,0.2)' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#E4002B' }} />
          <div className="flex-1">
            <p className="text-[13px] font-bold mb-2" style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>
              Obligatorisk prisbekräftelse
            </p>
            <p className="text-[12px] mb-4" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
              Jag intygar att ordinariepriset är det faktiska marknadspris som bilen säljs för idag och att kampanjpriset är ett reellt erbjudande till konsumenten. Falsk prissättning leder till omedelbar avaktivering av kontot.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={certified}
                onChange={e => setCertified(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0"
                style={{ accentColor: '#E4002B' }}
              />
              <span className="text-[13px] font-semibold" style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>
                Jag bekräftar att prisuppgifterna är korrekta
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function DealerNewCampaign({ dealerId, foretagsnamn, onLoggedOut }: DealerNewCampaignProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certified, setCertified] = useState(false);

  const [form, setForm] = useState({
    regnr: '',
    make: '',
    model: '',
    year: null as number | null,
    mil: null as number | null,
    drivmedel: '',
    kaross: '',
    ordinarie_pris: 0,
    kampanj_pris: 0,
    ordinarie_ranta: 0,
    kampanj_ranta: 0,
    lan_belopp: 0,
    lopitid: 0,
    formaner: [] as string[],
    sale_type: 'kop',
    campaign_type: 'Kampanj',
    slutdatum: maxDate(),
    image_url: '',
  });

  const savings = calcSavings(
    form.ordinarie_pris, form.kampanj_pris,
    form.ordinarie_ranta, form.kampanj_ranta,
    form.lan_belopp, form.lopitid,
    form.formaner,
  );

  function canAdvance() {
    if (step === 1) return form.make.trim() && form.model.trim();
    if (step === 2) return form.ordinarie_pris > 0 && form.kampanj_pris > 0 && form.kampanj_pris < form.ordinarie_pris;
    if (step === 4) return !!form.slutdatum;
    if (step === 6) return certified;
    return true;
  }

  async function submit() {
    if (!certified) return;
    setSubmitting(true);
    setError(null);

    // Get dealer name for public display
    const { data: dealer } = await supabase
      .from('dealers')
      .select('foretagsnamn, stad')
      .eq('id', dealerId)
      .maybeSingle();

    const { error: err } = await supabase.from('campaigns').insert({
      dealer_id: dealerId,
      dealer_name: dealer?.foretagsnamn ?? foretagsnamn,
      dealer_stad: dealer?.stad ?? null,
      regnr: form.regnr || null,
      make: form.make,
      model: form.model,
      year: form.year,
      mil: form.mil,
      drivmedel: form.drivmedel || null,
      kaross: form.kaross || null,
      image_url: form.image_url || null,
      ordinarie_pris: form.ordinarie_pris,
      kampanj_pris: form.kampanj_pris,
      ordinarie_ranta: form.ordinarie_ranta || null,
      kampanj_ranta: form.kampanj_ranta || null,
      lan_belopp: form.lan_belopp || null,
      lopitid: form.lopitid || null,
      formaner: form.formaner,
      total_besparing_kr: savings.total,
      sale_type: form.sale_type,
      campaign_type: form.campaign_type,
      slutdatum: form.slutdatum,
      status: 'aktiv',
      price_certified: true,
      price_certified_at: new Date().toISOString(),
      visningar: 0,
      klick: 0,
    });

    setSubmitting(false);
    if (err) { setError('Kunde inte spara kampanjen. Försök igen.'); return; }
    setDone(true);
  }

  if (done) {
    return (
      <DealerShell activePage="ny" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: '#00A85A' }}>
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-[32px] mb-3"
            style={{ fontFamily: '"Anton", Impact, sans-serif', color: '#0E1B33', letterSpacing: '-0.01em' }}
          >
            KAMPANJ PUBLICERAD!
          </h1>
          <p className="text-[15px] mb-8" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
            {form.make} {form.model} {form.year} är nu live på bilspara.se med en besparing på {fmt(savings.total)} kr.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { window.history.pushState({}, '', '/handlare'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="px-6 h-11 rounded-full font-bold text-[14px]"
              style={{ background: '#0E1B33', color: '#FFD500', fontFamily: '"Signika", ui-sans-serif' }}
            >
              Mina kampanjer
            </button>
            <button
              type="button"
              onClick={() => { setDone(false); setStep(1); setCertified(false); setForm(f => ({ ...f, regnr: '', make: '', model: '', year: null, image_url: '' })); }}
              className="px-6 h-11 rounded-full font-bold text-[14px]"
              style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
            >
              Ny kampanj
            </button>
          </div>
        </div>
      </DealerShell>
    );
  }

  return (
    <DealerShell activePage="ny" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <h1
          className="text-[28px] sm:text-[34px] mb-6"
          style={{ fontFamily: '"Anton", Impact, sans-serif', color: '#0E1B33', letterSpacing: '-0.01em' }}
        >
          NY KAMPANJ
        </h1>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            const done = s.id < step;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => done && setStep(s.id)}
                  className="flex items-center gap-1.5 px-2.5 h-8 rounded-full text-[12px] font-bold transition"
                  style={{
                    background: active ? '#0E1B33' : done ? '#00A85A' : '#F7F8FB',
                    color: active ? '#FFD500' : done ? 'white' : '#6B7486',
                    border: active ? 'none' : done ? 'none' : '1px solid #E8ECF3',
                    fontFamily: '"Signika", ui-sans-serif',
                    cursor: done ? 'pointer' : 'default',
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="w-4 h-px" style={{ background: '#E8ECF3' }} />}
              </div>
            );
          })}
        </div>

        {/* Step panel */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6" style={{ border: '1px solid #E8ECF3', boxShadow: '0 1px 2px rgb(14 27 51 / .04), 0 10px 30px -12px rgb(14 27 51 / .08)' }}>
          <h2 className="text-[16px] font-bold mb-5" style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>
            {STEPS[step - 1].label}
          </h2>

          {step === 1 && <StepBil form={form} setForm={setForm} />}
          {step === 2 && <StepPriser form={form} setForm={setForm} savings={savings} />}
          {step === 3 && <StepFormaner form={form} setForm={setForm} savings={savings} />}
          {step === 4 && <StepPeriod form={form} setForm={setForm} />}
          {step === 5 && <StepBild form={form} setForm={setForm} />}
          {step === 6 && <StepGranska form={form} savings={savings} certified={certified} setCertified={setCertified} />}
        </div>

        {/* Total savings ticker (steps 2+) */}
        {step >= 2 && savings.total > 0 && (
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between mb-4"
            style={{ background: '#FFD500', fontFamily: '"Signika", ui-sans-serif' }}
          >
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#0E1B33' }}>Total besparing hittills</span>
            <span className="text-[20px] font-bold" style={{ fontFamily: '"Anton", Impact, sans-serif', color: '#0E1B33' }}>{fmt(savings.total)} kr</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2" style={{ background: 'rgba(228,0,43,0.07)', border: '1px solid rgba(228,0,43,0.2)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#E4002B' }} />
            <span className="text-[13px]" style={{ color: '#E4002B', fontFamily: '"Signika", ui-sans-serif' }}>{error}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-5 h-11 rounded-full font-semibold text-[14px]"
              style={{ background: '#F7F8FB', border: '1px solid #E8ECF3', color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>
          )}
          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full font-bold text-[14px] transition"
              style={{
                background: canAdvance() ? '#0E1B33' : '#E8ECF3',
                color: canAdvance() ? '#FFD500' : '#6B7486',
                fontFamily: '"Signika", ui-sans-serif',
              }}
            >
              Nästa
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!certified || submitting}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full font-bold text-[14px] transition"
              style={{
                background: certified && !submitting ? '#00A85A' : '#E8ECF3',
                color: certified && !submitting ? 'white' : '#6B7486',
                fontFamily: '"Signika", ui-sans-serif',
              }}
            >
              {submitting ? 'Publicerar…' : 'Publicera kampanj'}
              {!submitting && <CheckCircle2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </DealerShell>
  );
}
