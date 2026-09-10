import { useState, useEffect } from 'react';
import { ArrowRight, Check, Clock, MapPin, AlertTriangle, Award, Car, Loader2 } from 'lucide-react';
import { setPageMeta } from '../lib/pageMeta';
import { SiteFooter } from '../components/SiteFooter';
import { useVehicleLookup, type VehicleData } from '../lib/useVehicleLookup';
import {
  VEHICLES, DEALERS, getOffersForVehicle, getPendingForVehicle, getDealer,
  ownerNet, formatSEK, isOverpromising, highestNetOfferId,
  type Offer, type Dealer,
} from '../lib/formedling-data';

type View = 'home' | 'add-car' | 'add-car-step2' | 'add-car-step3' | 'submitted' | 'compare' | 'chosen' | 'status';

export default function JamforFormedlingPage() {
  const [view, setView] = useState<View>('home');
  const [regnr, setRegnr] = useState('');
  const [lookupTrigger, setLookupTrigger] = useState('');
  const lookup = useVehicleLookup(lookupTrigger);
  const [foundVehicle, setFoundVehicle] = useState<VehicleData | null>(null);
  const [mileage, setMileage] = useState('');
  const [city, setCity] = useState('');
  const [serviceBook, setServiceBook] = useState('');
  const [numOwners, setNumOwners] = useState('');
  const [knownIssues, setKnownIssues] = useState('');
  const [winterTires, setWinterTires] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Bilförmedling — en bil, en förfrågan, flera förmedlare | Bilto',
      description: 'Lägg in din bil en gång. Låt verifierade bilförmedlare konkurrera om att sälja den.',
      canonical: 'https://bilto.se/formedling',
    });
  }, []);

  // När uppslaget är klart, gå vidare till formuläret
  useEffect(() => {
    if (lookup.status === 'found' && lookup.data) {
      setFoundVehicle(lookup.data);
      setMileage(lookup.data.miltal ? String(lookup.data.miltal) : '');
      setView('add-car');
    } else if (lookup.status === 'not_found') {
      // fallback till demo-bil
      setFoundVehicle({ marke: 'Volvo', modell: 'XC60', variant: 'T6 Recharge', ar: 2021, bransle: 'Laddhybrid', farg: 'Svart', fordonstyp: 'Personbil', miltal: 6420 });
      setMileage('6420');
      setView('add-car');
    }
  }, [lookup.status]);

  function handleRegLookup() {
    const clean = regnr.trim().toUpperCase().replace(/\s/g, '');
    if (clean.length < 5) return;
    setLookupTrigger(clean);
  }

  // ── SIDA 1 — STARTSIDA ──
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-5 pt-28 pb-16">
          <div className="w-full max-w-lg text-center">
            <p className="section-label mb-4">Bilförmedling</p>
            <h1 className="font-black tracking-[-0.02em] text-slate-900 leading-[1.05] mb-4" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)' }}>
              En bil. En förfrågan. Flera förmedlare.
            </h1>
            <p className="text-slate-500 text-[16px] mb-10">
              Lägg in bilen en gång. Låt förmedlarna tävla om att sälja den.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={regnr}
                onChange={e => setRegnummer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegLookup()}
                placeholder="Registreringsnummer"
                className="flex-1 h-12 px-4 rounded-md border border-slate-200 bg-white text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-bilto-500 focus:ring-2 focus:ring-bilto-500/15 transition"
              />
              <button
                onClick={handleRegLookup}
                disabled={lookup.status === 'loading'}
                className="btn-primary h-12 px-6 text-[15px] whitespace-nowrap"
              >
                {lookup.status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Se vad din bil kan ge <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
            {lookup.status === 'not_found' && (
              <p className="mt-2 text-[14px] text-slate-500">Kunde inte hitta bilen — vi visar en demo i stället.</p>
            )}
            <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
              {[
                'Lägg in bilen på två minuter',
                'Få erbjudanden från flera förmedlare',
                'Välj den du vill ha',
              ].map(t => (
                <div key={t} className="flex items-start gap-2 text-left">
                  <Check className="w-4 h-4 text-bilto-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <span className="text-[14px] text-slate-600">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );

    function setRegnummer(v: string) { setRegnr(v); }
  }

  // ── SIDA 2 — LÄGG IN BIL ──
  if (view === 'add-car' && foundVehicle) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader onBack={() => setView('home')} />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-lg mx-auto">
            <StepIndicator current={1} total={3} />
            <h1 className="text-[24px] font-bold text-slate-900 mb-1 mt-6">Fordonsuppgifter</h1>
            <p className="text-slate-500 text-[15px] mb-8">Hämtat från registreringsnumret. Ändra om något stämmer dåligt.</p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Märke">
                  <input value={foundVehicle.marke} readOnly className="form-control bg-slate-50" />
                </Field>
                <Field label="Modell">
                  <input value={foundVehicle.modell} readOnly className="form-control bg-slate-50" />
                </Field>
                <Field label="Årsmodell">
                  <input value={foundVehicle.ar ? String(foundVehicle.ar) : ''} readOnly className="form-control bg-slate-50" />
                </Field>
                <Field label="Drivmedel">
                  <input value={foundVehicle.bransle} readOnly className="form-control bg-slate-50" />
                </Field>
              </div>
              <Field label="Mätarställning (mil)">
                <input type="text" value={mileage} onChange={e => setMileage(e.target.value.replace(/[^0-9]/g, ''))} className="form-control" placeholder="t.ex. 6 420" />
              </Field>
              <Field label="Ort">
                <input type="text" value={city} onChange={e => setCity(e.target.value)} className="form-control" placeholder="Stockholm" />
              </Field>
            </div>
            <button onClick={() => setView('add-car-step2')} className="btn-primary w-full h-12 mt-8 text-[15px]">
              Fortsätt <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (view === 'add-car-step2') {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader onBack={() => setView('add-car')} />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-lg mx-auto">
            <StepIndicator current={2} total={3} />
            <h1 className="text-[24px] font-bold text-slate-900 mb-1 mt-6">Skick och historik</h1>
            <p className="text-slate-500 text-[15px] mb-8">Beskriv bilens skick så förmedlarna kan bedöma den rätt.</p>
            <div className="space-y-5">
              <Field label="Servicebok">
                <ChoiceGroup options={[{ v: 'full', l: 'Fullständig' }, { v: 'partial', l: 'Delvis' }, { v: 'missing', l: 'Saknas' }]} value={serviceBook} onChange={setServiceBook} />
              </Field>
              <Field label="Antal ägare">
                <ChoiceGroup options={[{ v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' }, { v: '4+', l: '4+' }]} value={numOwners} onChange={setNumOwners} />
              </Field>
              <Field label="Kända fel">
                <input type="text" value={knownIssues} onChange={e => setKnownIssues(e.target.value)} className="form-control" placeholder="t.ex. repa på höger dörr" />
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <button type="button" onClick={() => setWinterTires(!winterTires)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${winterTires ? 'bg-bilto-500 border-bilto-500' : 'border-slate-300'}`}>
                  {winterTires && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
                <span className="text-[15px] text-slate-700">Vinterdäck ingår</span>
              </label>
              <Field label="Övrigt">
                <textarea value={freeText} onChange={e => setFreeText(e.target.value)} className="form-control h-24 resize-none" placeholder="Något mer du vill berätta om bilen?" />
              </Field>
            </div>
            <button onClick={() => setView('add-car-step3')} className="btn-primary w-full h-12 mt-8 text-[15px]">
              Fortsätt <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (view === 'add-car-step3') {
    const slots = ['Fram', 'Bak', 'Sida', 'Interiör', 'Hjul', 'Skador'];
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader onBack={() => setView('add-car-step2')} />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-lg mx-auto">
            <StepIndicator current={3} total={3} />
            <h1 className="text-[24px] font-bold text-slate-900 mb-1 mt-6">Bilder</h1>
            <p className="text-slate-500 text-[15px] mb-8">Lägg till minst fyra bilder. Bra bilder hjälper förmedlarna att bedöma bilen.</p>
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot) => {
                const filled = images.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => setImages(prev => filled ? prev.filter(s => s !== slot) : [...prev, slot])}
                    className={`aspect-[4/3] rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${filled ? 'border-bilto-500 bg-bilto-50' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    {filled ? <Check className="w-6 h-6 text-bilto-500" strokeWidth={2} /> : <Car className="w-6 h-6 text-slate-300" strokeWidth={1.5} />}
                    <span className="text-[12px] text-slate-500">{slot}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] text-slate-400 mt-4">{images.length} av 4 minst — {images.length >= 4 ? 'klart' : 'lägg till fler'}</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setView('submitted')} disabled={images.length < 4} className="btn-primary flex-1 h-12 text-[15px] disabled:opacity-40 disabled:cursor-not-allowed">
                Skicka in förfrågan
              </button>
              <button onClick={() => setView('submitted')} className="h-12 px-5 rounded-md border border-slate-200 text-slate-600 font-semibold text-[15px] hover:bg-slate-50 transition">
                Hoppa över
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── BEKRÄFTELSE ──
  if (view === 'submitted' && foundVehicle) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-lg mx-auto text-center pt-12">
            <div className="w-16 h-16 rounded-full bg-bilto-50 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-bilto-500" strokeWidth={2} />
            </div>
            <h1 className="text-[26px] font-bold text-slate-900 mb-3">Förfrågan skickad</h1>
            <p className="text-slate-500 text-[16px] mb-2">
              Din {foundVehicle.marke} {foundVehicle.modell} har skickats till förmedlare i {city || 'Stockholm'}.
            </p>
            <p className="text-slate-500 text-[16px] mb-10">Erbjudanden brukar komma inom 48 timmar.</p>
            <button onClick={() => setView('compare')} className="btn-primary h-12 px-8 text-[15px]">
              Se erbjudanden <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── SIDA 3 — JÄMFÖR ERBJUDANDEN ──
  if (view === 'compare' && foundVehicle) {
    const demoVehicle = VEHICLES[0]; // använder v1 för demo-erbjudanden
    const offers = getOffersForVehicle(demoVehicle.id);
    const pending = getPendingForVehicle(demoVehicle.id);
    const sorted = [...offers].sort((a, b) => ownerNet(b) - ownerNet(a));
    const highestId = highestNetOfferId(offers);

    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader onBack={() => setView('home')} />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="card-base p-4 mb-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={demoVehicle.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-slate-900">{foundVehicle.marke} {foundVehicle.modell}</p>
                <p className="text-[13px] text-slate-500">{foundVehicle.ar} · {Number(mileage).toLocaleString('sv-SE')} mil · {city || 'Stockholm'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold text-slate-900">{offers.length} erbjudanden</p>
                <p className="text-[12px] text-slate-500 flex items-center gap-1 justify-end mt-0.5">
                  <Clock className="w-3 h-3" /> Budgivning öppen 48 h
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {sorted.map(offer => {
                const dealer = getDealer(offer.dealerId);
                if (!dealer) return null;
                const isHighest = offer.id === highestId;
                const overpromising = isOverpromising(offer, offers);
                return (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    dealer={dealer}
                    isHighest={isHighest}
                    overpromising={overpromising}
                    onSelect={() => { setSelectedOfferId(offer.id); setView('chosen'); }}
                  />
                );
              })}
            </div>

            {pending.length > 0 && (
              <div className="mt-4 rounded-md bg-slate-50 border border-slate-100 p-4">
                {pending.map(p => (
                  <div key={p.dealerName} className="flex items-center gap-2 text-[14px] text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p.dealerName} i {p.city} tittar på din bil — erbjudande väntas inom ett dygn.</span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-[13px] text-slate-400 leading-relaxed">
              Väntat pris är förmedlarens bedömning, inte en garanti. Historiken visar vad förmedlaren faktiskt uppnått på tidigare uppdrag.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── BEKRÄFTELSEDIALOG ──
  if (view === 'chosen' && foundVehicle && selectedOfferId) {
    const demoVehicle = VEHICLES[0];
    const offers = getOffersForVehicle(demoVehicle.id);
    const offer = offers.find(o => o.id === selectedOfferId);
    const dealer = offer ? getDealer(offer.dealerId) : null;
    if (!offer || !dealer) return null;

    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader onBack={() => setView('compare')} />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-lg mx-auto">
            <div className="card-base p-6">
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">Du väljer {dealer.name}</h1>
              <p className="text-slate-500 text-[15px] mb-6">Bekräfta ditt val för att gå vidare.</p>
              <div className="space-y-3 mb-6">
                <SummaryRow label="Förväntat försäljningspris" value={formatSEK(offer.expectedSalePrice)} />
                <SummaryRow label="Förmedlarens avgift" value={`– ${formatSEK(offer.commission)}`} />
                <div className="h-px bg-slate-100" />
                <SummaryRow label="Du får" value={formatSEK(ownerNet(offer))} bold />
                <SummaryRow label="Förväntad säljtid" value={offer.expectedSaleTimeWeeks} />
              </div>
              <button onClick={() => setView('status')} className="btn-primary w-full h-12 text-[15px]">
                Bekräfta och gå vidare
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── SIDA 4 — STATUS ──
  if (view === 'status' && foundVehicle && selectedOfferId) {
    const demoVehicle = VEHICLES[0];
    const offers = getOffersForVehicle(demoVehicle.id);
    const offer = offers.find(o => o.id === selectedOfferId);
    const dealer = offer ? getDealer(offer.dealerId) : null;
    if (!offer || !dealer) return null;

    const timeline = [
      { label: 'Förfrågan inlagd', done: true },
      { label: 'Erbjudanden mottagna', done: true },
      { label: 'Förmedlare vald', done: true },
      { label: 'Bilen annonseras', done: false },
      { label: 'Köpare hittad', done: false },
      { label: 'Såld', done: false },
    ];

    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col">
        <FormedlingHeader onBack={() => setView('compare')} />
        <main className="flex-1 px-5 pt-28 pb-8">
          <div className="max-w-lg mx-auto">
            <h1 className="text-[24px] font-bold text-slate-900 mb-2">Status</h1>
            <p className="text-slate-500 text-[15px] mb-8">Här följer du försäljningen steg för steg.</p>

            <div className="card-base p-5 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-600">
                  {dealer.initials}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">{dealer.name}</p>
                  <p className="text-[13px] text-slate-500">{dealer.city} · {dealer.completedSales} genomförda förmedlingar</p>
                </div>
              </div>
              <div className="space-y-2">
                <SummaryRow label="Överenskommet pris" value={formatSEK(offer.expectedSalePrice)} />
                <SummaryRow label="Avgift" value={formatSEK(offer.commission)} />
                <SummaryRow label="Du får" value={formatSEK(ownerNet(offer))} bold />
                <SummaryRow label="Förväntad säljtid" value={offer.expectedSaleTimeWeeks} />
              </div>
            </div>

            <div className="card-base p-5">
              <div className="space-y-4">
                {timeline.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-bilto-500' : 'bg-slate-100'}`}>
                      {step.done ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <span className="text-[11px] font-bold text-slate-400">{i + 1}</span>}
                    </div>
                    <span className={`text-[15px] ${step.done ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return null;
}

// ── Delad header (samma stil som resten av sajten) ──
function FormedlingHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-14 lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
      <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
        {onBack ? (
          <button onClick={onBack} className="shrink-0 flex items-center text-white/80 hover:text-white transition text-[14px] font-medium mr-3">
            Tillbaka
          </button>
        ) : null}
        <a href="/formedling" className="shrink-0 flex items-center">
          <img
            src="/a_clean_graphic_logo_on_a_transparent_background.png"
            alt="Bilto"
            className="h-20 lg:h-32 w-auto object-contain"
            fetchPriority="high"
            decoding="async"
          />
        </a>
        <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80">Förmedling</span>
        <div className="ml-auto flex items-center gap-3">
          <a href="/formedling/forhandlare" className="hidden lg:inline-flex text-[14px] font-medium text-white/90 hover:text-white transition">Förmedlare</a>
          <a href="/formedling/partner" className="hidden lg:inline-flex text-[14px] font-medium text-white/90 hover:text-white transition">Partner</a>
          <a
            href="/formedling/forhandlare"
            className="inline-flex items-center bg-white text-[#0e6efe] text-[13px] font-semibold px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
          >
            Förmedlarportalen
          </a>
        </div>
      </div>
    </header>
  );
}

// ── Komponenter ──
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i < current ? 'bg-bilto-500' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

function ChoiceGroup({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={`px-4 py-2.5 rounded-md text-[14px] font-medium transition ${value === opt.v ? 'bg-bilto-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  );
}

function OfferCard({ offer, dealer, isHighest, overpromising, onSelect }: {
  offer: Offer;
  dealer: Dealer;
  isHighest: boolean;
  overpromising: boolean;
  onSelect: () => void;
}) {
  const net = ownerNet(offer);
  return (
    <div className={`card-base p-5 ${isHighest ? 'ring-2 ring-bilto-500' : ''}`}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-600">
            {dealer.initials}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-slate-900">{dealer.name}</p>
            <p className="text-[13px] text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {dealer.city} · {dealer.completedSales} förmedlingar
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isHighest && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bilto-50 text-bilto-700 text-[11px] font-bold">
              <Award className="w-3 h-3" /> Högst till dig
            </span>
          )}
          {overpromising && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
              <AlertTriangle className="w-3 h-3" /> Lovar högst
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-[11px] text-slate-400 mb-1">Du får</p>
          <p className="text-[20px] font-bold text-slate-900">{formatSEK(net)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 mb-1">Väntat pris</p>
          <p className="text-[14px] font-semibold text-slate-700">{formatSEK(offer.expectedSalePrice)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 mb-1">Avgift</p>
          <p className="text-[14px] font-semibold text-slate-700">{formatSEK(offer.commission)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 mb-1">Säljtid</p>
          <p className="text-[14px] font-semibold text-slate-700">{offer.expectedSaleTimeWeeks}</p>
        </div>
      </div>

      <div className={`rounded-md p-3 mb-4 ${overpromising ? 'bg-amber-50' : 'bg-slate-50'}`}>
        <p className={`text-[13px] ${overpromising ? 'text-amber-700' : 'text-slate-500'}`}>
          Uppnår i snitt {dealer.avgAchievedPct} % av utlovat pris · median {dealer.medianDaysToSale} dagar
        </p>
      </div>

      <button onClick={onSelect} className="btn-primary w-full h-11 text-[14px]">
        Välj {dealer.name}
      </button>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[14px] ${bold ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-[15px] ${bold ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>{value}</span>
    </div>
  );
}
