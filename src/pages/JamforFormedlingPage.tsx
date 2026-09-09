import { useState, useEffect } from 'react';
import { ArrowRight, Check, Clock, MapPin, AlertTriangle, Award, Car } from 'lucide-react';
import { setPageMeta } from '../lib/pageMeta';
import {
  VEHICLES, DEALERS, getOffersForVehicle, getPendingForVehicle, getDealer,
  lookupByRegnr, ownerNet, formatSEK, medianExpectedPrice, isOverpromising,
  highestNetOfferId, type Vehicle, type Offer, type Dealer,
} from '../lib/formedling-data';

type View = 'home' | 'add-car' | 'add-car-step2' | 'add-car-step3' | 'submitted' | 'compare' | 'chosen' | 'status';

export default function JamforFormedlingPage() {
  const [view, setView] = useState<View>('home');
  const [regnr, setRegnr] = useState('');
  const [regError, setRegError] = useState('');
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [mileage, setMileage] = useState('');
  const [city, setCity] = useState('');
  const [serviceBook, setServiceBook] = useState<'full' | 'partial' | 'missing'>('');
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

  // ── SIDA 1 — STARTSIDA ──
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar />
        <main className="flex-1 flex flex-col items-center justify-center px-5 py-16">
          <div className="w-full max-w-lg text-center">
            <h1 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-slate-900 leading-tight mb-3">
              En bil. En förfrågan. Flera förmedlare.
            </h1>
            <p className="text-slate-500 text-[16px] mb-10">
              Lägg in bilen en gång. Låt förmedlarna tävla om att sälja den.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={regnr}
                onChange={e => { setRegnr(e.target.value); setRegError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRegLookup()}
                placeholder="Registreringsnummer"
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition"
              />
              <button
                onClick={handleRegLookup}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Se vad din bil kan ge
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {regError && <p className="mt-2 text-[14px] text-red-500">{regError}</p>}
            <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
              {[
                'Lägg in bilen på två minuter',
                'Få erbjudanden från flera förmedlare',
                'Välj den du vill ha',
              ].map(t => (
                <div key={t} className="flex items-start gap-2 text-left">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <span className="text-[14px] text-slate-600">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  function handleRegLookup() {
    const clean = regnr.trim().toUpperCase().replace(/\s/g, '');
    if (clean.length < 5) { setRegError('Ange ett giltigt registreringsnummer'); return; }
    const v = lookupByRegnr(clean);
    if (v) {
      setFoundVehicle(v);
      setMileage(String(v.mileage));
      setCity(v.city);
      setView('add-car');
    } else {
      // fallback till första bilen för demo
      setFoundVehicle(VEHICLES[0]);
      setMileage(String(VEHICLES[0].mileage));
      setCity(VEHICLES[0].city);
      setView('add-car');
    }
  }

  // ── SIDA 2 — LÄGG IN BIL ──
  if (view === 'add-car' && foundVehicle) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar onBack={() => setView('home')} />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-lg mx-auto">
            <StepIndicator current={1} total={3} />
            <h1 className="text-[24px] font-bold text-slate-900 mb-1 mt-6">Fordonsuppgifter</h1>
            <p className="text-slate-500 text-[15px] mb-8">Hämtat från registreringsnumret. Ändra om något stämmer dåligt.</p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Märke">
                  <input value={foundVehicle.make} readOnly className="form-input bg-slate-50" />
                </Field>
                <Field label="Modell">
                  <input value={foundVehicle.model} readOnly className="form-input bg-slate-50" />
                </Field>
                <Field label="Årsmodell">
                  <input value={String(foundVehicle.year)} readOnly className="form-input bg-slate-50" />
                </Field>
                <Field label="Drivmedel">
                  <input value={foundVehicle.fuel} readOnly className="form-input bg-slate-50" />
                </Field>
              </div>
              <Field label="Mätarställning (mil)">
                <input type="text" value={mileage} onChange={e => setMileage(e.target.value.replace(/[^0-9]/g, ''))} className="form-input" placeholder="t.ex. 6 420" />
              </Field>
              <Field label="Ort">
                <input type="text" value={city} onChange={e => setCity(e.target.value)} className="form-input" placeholder="Stockholm" />
              </Field>
            </div>
            <button onClick={() => setView('add-car-step2')} className="w-full h-12 mt-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2">
              Fortsätt
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (view === 'add-car-step2') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar onBack={() => setView('add-car')} />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-lg mx-auto">
            <StepIndicator current={2} total={3} />
            <h1 className="text-[24px] font-bold text-slate-900 mb-1 mt-6">Skick och historik</h1>
            <p className="text-slate-500 text-[15px] mb-8">Beskriv bilens skick så förmedlarna kan bedöma den rätt.</p>
            <div className="space-y-5">
              <Field label="Servicebok">
                <ChoiceGroup options={[{ v: 'full', l: 'Fullständig' }, { v: 'partial', l: 'Delvis' }, { v: 'missing', l: 'Saknas' }]} value={serviceBook} onChange={v => setServiceBook(v as 'full' | 'partial' | 'missing')} />
              </Field>
              <Field label="Antal ägare">
                <ChoiceGroup options={[{ v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' }, { v: '4+', l: '4+' }]} value={numOwners} onChange={setNumOwners} />
              </Field>
              <Field label="Kända fel">
                <input type="text" value={knownIssues} onChange={e => setKnownIssues(e.target.value)} className="form-input" placeholder="t.ex. repa på höger dörr" />
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <button type="button" onClick={() => setWinterTires(!winterTires)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${winterTires ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                  {winterTires && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
                <span className="text-[15px] text-slate-700">Vinterdäck ingår</span>
              </label>
              <Field label="Övrigt">
                <textarea value={freeText} onChange={e => setFreeText(e.target.value)} className="form-input h-24 resize-none" placeholder="Något mer du vill berätta om bilen?" />
              </Field>
            </div>
            <button onClick={() => setView('add-car-step3')} className="w-full h-12 mt-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2">
              Fortsätt
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (view === 'add-car-step3') {
    const slots = ['Fram', 'Bak', 'Sida', 'Interiör', 'Hjul', 'Skador'];
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar onBack={() => setView('add-car-step2')} />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-lg mx-auto">
            <StepIndicator current={3} total={3} />
            <h1 className="text-[24px] font-bold text-slate-900 mb-1 mt-6">Bilder</h1>
            <p className="text-slate-500 text-[15px] mb-8">Lägg till minst fyra bilder. Bra bilder hjälper förmedlarna att bedöma bilen.</p>
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot, i) => {
                const filled = images.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => setImages(prev => filled ? prev.filter(s => s !== slot) : [...prev, slot])}
                    className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${filled ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    {filled ? <Check className="w-6 h-6 text-emerald-600" strokeWidth={2} /> : <Car className="w-6 h-6 text-slate-300" strokeWidth={1.5} />}
                    <span className="text-[12px] text-slate-500">{slot}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] text-slate-400 mt-4">{images.length} av 4 minst — {images.length >= 4 ? 'klart' : 'lägg till fler'}</p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setView('submitted')}
                disabled={images.length < 4}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[15px] transition"
              >
                Skicka in förfrågan
              </button>
              <button
                onClick={() => setView('submitted')}
                className="h-12 px-5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[15px] hover:bg-slate-50 transition"
              >
                Hoppa över
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── BEKRÄFTELSE ──
  if (view === 'submitted' && foundVehicle) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-lg mx-auto text-center pt-12">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" strokeWidth={2} />
            </div>
            <h1 className="text-[26px] font-bold text-slate-900 mb-3">Förfrågan skickad</h1>
            <p className="text-slate-500 text-[16px] mb-2">
              Din {foundVehicle.make} {foundVehicle.model} har skickats till förmedlare i {city || foundVehicle.city}.
            </p>
            <p className="text-slate-500 text-[16px] mb-10">
              Erbjudanden brukar komma inom 48 timmar.
            </p>
            <button
              onClick={() => setView('compare')}
              className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] transition inline-flex items-center gap-2"
            >
              Se erbjudanden
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── SIDA 3 — JÄMFÖR ERBJUDANDEN ──
  if (view === 'compare' && foundVehicle) {
    const offers = getOffersForVehicle(foundVehicle.id);
    const pending = getPendingForVehicle(foundVehicle.id);
    const sorted = [...offers].sort((a, b) => ownerNet(b) - ownerNet(a));
    const highestId = highestNetOfferId(offers);

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar onBack={() => setView('home')} />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Bil-kort */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={foundVehicle.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-slate-900">{foundVehicle.make} {foundVehicle.model}</p>
                <p className="text-[13px] text-slate-500">{foundVehicle.year} · {Number(mileage).toLocaleString('sv-SE')} mil · {city || foundVehicle.city}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold text-slate-900">{offers.length} erbjudanden</p>
                <p className="text-[12px] text-slate-500 flex items-center gap-1 justify-end mt-0.5">
                  <Clock className="w-3 h-3" /> Budgivning öppen 48 h
                </p>
              </div>
            </div>

            {/* Erbjudanden */}
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

            {/* Väntande förmedlare */}
            {pending.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                {pending.map(p => (
                  <div key={p.dealerName} className="flex items-center gap-2 text-[14px] text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p.dealerName} i {p.city} tittar på din bil — erbjudande väntas inom ett dygn.</span>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <p className="mt-6 text-[13px] text-slate-400 leading-relaxed">
              Väntat pris är förmedlarens bedömning, inte en garanti. Historiken visar vad förmedlaren faktiskt uppnått på tidigare uppdrag.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── BEKRÄFTELSEDIALOG ──
  if (view === 'chosen' && foundVehicle && selectedOfferId) {
    const offers = getOffersForVehicle(foundVehicle.id);
    const offer = offers.find(o => o.id === selectedOfferId);
    const dealer = offer ? getDealer(offer.dealerId) : null;
    if (!offer || !dealer) return null;

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar onBack={() => setView('compare')} />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-lg mx-auto">
            <div className="rounded-xl border border-slate-200 p-6">
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">Du väljer {dealer.name}</h1>
              <p className="text-slate-500 text-[15px] mb-6">Bekräfta ditt val för att gå vidare.</p>
              <div className="space-y-3 mb-6">
                <SummaryRow label="Förväntat försäljningspris" value={formatSEK(offer.expectedSalePrice)} />
                <SummaryRow label="Förmedlarens avgift" value={`– ${formatSEK(offer.commission)}`} />
                <div className="h-px bg-slate-100" />
                <SummaryRow label="Du får" value={formatSEK(ownerNet(offer))} bold />
                <SummaryRow label="Förväntad säljtid" value={offer.expectedSaleTimeWeeks} />
              </div>
              <button
                onClick={() => setView('status')}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] transition"
              >
                Bekräfta och gå vidare
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── SIDA 4 — STATUS ──
  if (view === 'status' && foundVehicle && selectedOfferId) {
    const offers = getOffersForVehicle(foundVehicle.id);
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
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar onBack={() => setView('compare')} />
        <main className="flex-1 px-5 py-8">
          <div className="max-w-lg mx-auto">
            <h1 className="text-[24px] font-bold text-slate-900 mb-2">Status</h1>
            <p className="text-slate-500 text-[15px] mb-8">Här följer du försäljningen steg för steg.</p>

            <div className="rounded-xl border border-slate-200 p-5 mb-6">
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

            <div className="rounded-xl border border-slate-200 p-5">
              <div className="space-y-4">
                {timeline.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-600' : 'bg-slate-100'}`}>
                      {step.done ? (
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[15px] ${step.done ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return null;
}

// ── Komponenter ──

function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <header className="h-14 border-b border-slate-200 flex items-center px-5 sticky top-0 bg-white z-30">
      {onBack && (
        <button onClick={onBack} className="text-[14px] text-slate-500 hover:text-slate-900 transition mr-3">
          Tillbaka
        </button>
      )}
      <span className="text-[18px] font-bold text-slate-900">Bilto</span>
      <span className="ml-2 text-[12px] text-slate-400">Förmedling</span>
      <div className="ml-auto">
        <a href="/formedling/forhandlare" className="text-[13px] text-slate-500 hover:text-slate-900 transition">
          Förmedlare
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 py-8 px-5 text-center">
      <p className="text-[13px] text-slate-400">Detta är en demo med påhittad data. Inga riktiga erbjudanden.</p>
    </footer>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition ${i < current ? 'bg-emerald-600' : 'bg-slate-200'}`}
        />
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
          className={`px-4 py-2.5 rounded-xl text-[14px] font-medium transition ${value === opt.v ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
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
    <div className={`rounded-xl border p-5 transition ${isHighest ? 'border-emerald-600 border-2' : 'border-slate-200'}`}>
      {/* Förmedlare */}
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
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

      {/* Siffror */}
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

      {/* Historik */}
      <div className={`rounded-lg p-3 mb-4 ${overpromising ? 'bg-amber-50' : 'bg-slate-50'}`}>
        <p className={`text-[13px] ${overpromising ? 'text-amber-700' : 'text-slate-500'}`}>
          Uppnår i snitt {dealer.avgAchievedPct} % av utlovat pris · median {dealer.medianDaysToSale} dagar
        </p>
      </div>

      <button
        onClick={onSelect}
        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[14px] transition"
      >
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
