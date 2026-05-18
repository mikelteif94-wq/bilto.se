import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Send,
  Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import AdminUserLabel from '../components/AdminUserLabel';
import { CAR_BRANDS, POPULAR_BRANDS } from '../lib/carBrands';
import ConditionReportForm, {
  ConditionReport,
  EMPTY_CONDITION_REPORT,
  isConditionReportFilled,
} from '../components/forms/ConditionReportForm';
import CarImageUploader, {
  PendingImage,
  uploadCarImages,
} from '../components/forms/CarImageUploader';

type Dealer = Database['public']['Tables']['dealers']['Row'];

interface AdminAddCarProps {
  adminUserId: string;
  adminName: string;
  onBack: () => void;
  onCreated: (carId: string) => void;
}

const SKICK_OPTIONS = [
  { value: 'mycket_bra', label: 'Mycket bra' },
  { value: 'bra', label: 'Bra' },
  { value: 'okej', label: 'Okej' },
  { value: 'slitet', label: 'Slitet' },
  { value: 'skadat', label: 'Skadat' },
];

const AUCTION_HOURS = 48;

function generateToken(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export default function AdminAddCar({ adminUserId, adminName, onBack, onCreated }: AdminAddCarProps) {
  const [namn, setNamn] = useState('');
  const [telefon, setTelefon] = useState('');
  const [mejl, setMejl] = useState('');

  const [regnummer, setRegnummer] = useState('');
  const [marke, setMarke] = useState('');
  const [modell, setModell] = useState('');
  const [ar, setAr] = useState<string>(String(new Date().getFullYear()));
  const [miltal, setMiltal] = useState<string>('');
  const [skick, setSkick] = useState('bra');
  const [skickKommentar, setSkickKommentar] = useState('');
  const [notes, setNotes] = useState('');
  const [conditionReport, setConditionReport] = useState<ConditionReport>(EMPTY_CONDITION_REPORT);
  const [images, setImages] = useState<PendingImage[]>([]);

  const [salesType, setSalesType] = useState<'auction' | 'brokerage'>('auction');
  const [activateNow, setActivateNow] = useState<boolean>(true);
  const [startbud, setStartbud] = useState<string>('');
  const [accepteratPris, setAccepteratPris] = useState<string>('');
  const [tradeInInterest, setTradeInInterest] = useState<boolean>(false);
  const [tradeInWants, setTradeInWants] = useState<string>('');

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealerIds, setSelectedDealerIds] = useState<Set<string>>(new Set());
  const [dealerSearch, setDealerSearch] = useState('');
  const [sendToAllApproved, setSendToAllApproved] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const state = window.history.state?.fromQuote;
    if (state) {
      if (state.customerName) setNamn(state.customerName);
      if (state.customerPhone) setTelefon(state.customerPhone);
      if (state.customerEmail) setMejl(state.customerEmail);
      if (state.regnummer) setRegnummer(state.regnummer.toUpperCase());
      if (state.carModel) {
        const parts = state.carModel.split(' ');
        if (parts.length > 0) setMarke(parts[0]);
        if (parts.length > 1) setModell(parts.slice(1).join(' '));
      }
      if (state.budget) setNotes(`Budget: ${state.budget} kr`);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('dealers')
        .select('*')
        .eq('godkand', true)
        .order('foretagsnamn');
      setDealers((data ?? []) as Dealer[]);
    })();
  }, []);

  const filteredDealers = useMemo(() => {
    const q = dealerSearch.trim().toLowerCase();
    if (!q) return dealers;
    return dealers.filter((d) =>
      [d.foretagsnamn, d.kontaktperson, d.mejl, d.orgnr]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q)),
    );
  }, [dealers, dealerSearch]);

  const toggleDealer = (id: string) => {
    setSendToAllApproved(false);
    setSelectedDealerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const valid =
    namn.trim().length > 1 &&
    telefon.trim().length >= 6 &&
    mejl.trim().length > 3 &&
    regnummer.trim().length >= 3 &&
    miltal.trim().length > 0 &&
    Number(miltal) >= 0 &&
    ar.trim().length === 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data: customerRow, error: cErr } = await supabase
        .from('customers')
        .insert({
          namn: namn.trim(),
          telefon: telefon.trim(),
          mejl: mejl.trim(),
        })
        .select('id')
        .maybeSingle();

      if (cErr || !customerRow) {
        setError('Kunde inte spara kunden. Försök igen.');
        setSubmitting(false);
        return;
      }

      const accessToken = generateToken();
      const auktionSlut =
        salesType === 'auction' && activateNow
          ? new Date(Date.now() + AUCTION_HOURS * 60 * 60 * 1000).toISOString()
          : null;

      const { data: carRow, error: carErr } = await supabase
        .from('cars')
        .insert({
          regnummer: regnummer.trim().toUpperCase(),
          marke: marke.trim(),
          modell: modell.trim(),
          ar: Number(ar),
          miltal: Number(miltal),
          skick,
          skick_kommentar: skickKommentar.trim(),
          utrustning: [],
          customer_id: customerRow.id,
          access_token: accessToken,
          sales_type: salesType,
          status: activateNow ? 'aktiv' : 'ny',
          auktion_slut: auktionSlut,
          notes: notes.trim(),
          condition_report: isConditionReportFilled(conditionReport) ? conditionReport : null,
          startbud: startbud.trim() === '' ? null : Math.floor(Number(startbud.replace(/\s/g, '').replace(/,/g, '.'))),
          reservationspris: accepteratPris.trim() === '' ? null : Math.floor(Number(accepteratPris.replace(/\s/g, '').replace(/,/g, '.'))),
          trade_in_interest: tradeInInterest,
          trade_in_wants: tradeInInterest ? tradeInWants.trim() : '',
        })
        .select('id')
        .maybeSingle();

      if (carErr || !carRow) {
        setError('Kunde inte spara bilen. Försök igen.');
        setSubmitting(false);
        return;
      }

      await supabase.from('car_activities').insert({
        car_id: carRow.id,
        type: 'note',
        title: 'Bil skapad manuellt av admin',
        body: `Skapad av ${adminName}`,
        data: { source: 'admin_manual' },
        created_by: adminUserId,
        created_by_name: adminName,
      });

      if (tradeInInterest) {
        await supabase.from('car_activities').insert({
          car_id: carRow.id,
          type: 'note',
          title: 'Inbytes-lead: Kunden vill byta till annan bil',
          body: tradeInWants.trim() || '(Ingen önskebil angiven)',
          data: { source: 'admin_manual', kind: 'trade_in_lead' },
          created_by: adminUserId,
          created_by_name: adminName,
        });
      }

      if (images.length > 0) {
        const up = await uploadCarImages(supabase, carRow.id, images);
        if (!up.ok) {
          setError(up.error ?? 'Bilen är skapad men bilderna kunde inte laddas upp.');
          setSubmitting(false);
          return;
        }
      }

      let sentInfo = '';
      if (activateNow) {
        const dealerIds = sendToAllApproved
          ? dealers.map((d) => d.id)
          : Array.from(selectedDealerIds);

        if (dealerIds.length > 0) {
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-dealers-new-car`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ car_id: carRow.id, dealer_ids: dealerIds }),
              },
            );
            const j = await resp.json().catch(() => ({}));
            if (j?.ok) {
              sentInfo = ` Skickat till ${j.sent ?? dealerIds.length} handlare.`;
              await supabase.from('car_activities').insert({
                car_id: carRow.id,
                type: 'lead_sent',
                title: `Leads skickade till ${j.sent ?? dealerIds.length} handlare`,
                body: sendToAllApproved ? 'Alla godkända handlare' : '',
                data: {
                  sent: j.sent,
                  failed: j.failed,
                  total: j.total,
                  dealer_ids: dealerIds,
                  source: 'admin_manual',
                },
                created_by: adminUserId,
                created_by_name: adminName,
              });
            }
          } catch {
            // non-fatal
          }
        }
      }

      setSuccess(`Bilen är skapad.${sentInfo}`);
      setTimeout(() => onCreated(carRow.id), 700);
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-10 gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Tillbaka</span>
        </button>
        <h1 className="text-white font-semibold ml-2 sm:ml-4 text-base sm:text-lg">
          Lägg till bil manuellt
        </h1>
        <div className="ml-auto">
          <AdminUserLabel />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Kund</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Namn *">
                <input
                  type="text"
                  required
                  value={namn}
                  onChange={(e) => setNamn(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
              <Field label="Telefon *">
                <input
                  type="tel"
                  required
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
              <Field label="Mejl *" className="sm:col-span-2">
                <input
                  type="email"
                  required
                  value={mejl}
                  onChange={(e) => setMejl(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Bil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Regnummer *">
                <input
                  type="text"
                  required
                  value={regnummer}
                  onChange={(e) => setRegnummer(e.target.value.toUpperCase())}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none uppercase tracking-wider font-mono"
                />
              </Field>
              <Field label="Miltal (mil) *">
                <input
                  type="number"
                  required
                  min={0}
                  value={miltal}
                  onChange={(e) => setMiltal(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
              <Field label="Märke">
                <select
                  value={marke}
                  onChange={(e) => {
                    setMarke(e.target.value);
                    setModell('');
                  }}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none bg-white"
                >
                  <option value="">Välj märke</option>
                  {POPULAR_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Modell">
                <input
                  type="text"
                  list={marke ? `admin-models-${marke}` : undefined}
                  value={modell}
                  onChange={(e) => setModell(e.target.value)}
                  disabled={!marke}
                  placeholder={marke ? 'Välj eller skriv modell' : 'Välj märke först'}
                  autoComplete="off"
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                />
                {marke && (
                  <datalist id={`admin-models-${marke}`}>
                    {(CAR_BRANDS[marke] ?? []).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                )}
              </Field>
              <Field label="Årsmodell *">
                <input
                  type="number"
                  required
                  min={1950}
                  max={2100}
                  value={ar}
                  onChange={(e) => setAr(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
              <Field label="Skick">
                <select
                  value={skick}
                  onChange={(e) => setSkick(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none bg-white"
                >
                  {SKICK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kommentar om skick" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={skickKommentar}
                  onChange={(e) => setSkickKommentar(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
              <Field label="Anteckningar (intern)" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Bilder
              </h2>
              <span className="text-xs text-slate-400">Frivilligt</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Säljaren kan komplettera bilderna senare via sin personliga länk.
            </p>
            <CarImageUploader
              images={images}
              onChange={setImages}
              maxImages={12}
              hint="Lägg till exteriör, interiör, mätarställning, eventuella skador."
            />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Skickrapport
              </h2>
              <span className="text-xs text-slate-400">Frivilligt</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Strukturerad checklista — säljaren kan komplettera senare om du hoppar över.
            </p>
            <ConditionReportForm
              value={conditionReport}
              onChange={setConditionReport}
              collapsible
            />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Försäljning
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSalesType('auction')}
                className={`h-11 rounded-lg border text-sm font-semibold transition ${
                  salesType === 'auction'
                    ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                Sälj direkt (bud)
              </button>
              <button
                type="button"
                onClick={() => setSalesType('brokerage')}
                className={`h-11 rounded-lg border text-sm font-semibold transition ${
                  salesType === 'brokerage'
                    ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                Maxpris (förmedling)
              </button>
            </div>

            {salesType === 'auction' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Field label="Startbud (valfritt)">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={startbud}
                      onChange={(e) => setStartbud(e.target.value)}
                      placeholder="0"
                      className="w-full pl-3 pr-10 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm font-medium">
                      kr
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Synligt för handlare. Lägsta nivå för budgivning.
                  </p>
                </Field>
                <Field label="Accepterat pris (valfritt)">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={accepteratPris}
                      onChange={(e) => setAccepteratPris(e.target.value)}
                      placeholder="0"
                      className="w-full pl-3 pr-10 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm font-medium">
                      kr
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Internt. Pris kunden accepterar att sälja för.
                  </p>
                </Field>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 p-4 mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tradeInInterest}
                  onChange={(e) => setTradeInInterest(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#0e6efe]"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    Kunden vill byta till annan bil
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Markeras som inbytes-lead i kundens ärende.
                  </span>
                </span>
              </label>
              {tradeInInterest && (
                <div className="mt-3 pl-7">
                  <Field label="Vad vill kunden byta till?">
                    <textarea
                      rows={2}
                      value={tradeInWants}
                      onChange={(e) => setTradeInWants(e.target.value)}
                      placeholder="T.ex. Volvo XC60 hybrid, max 30 000 mil, budget 350 000 kr"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                    />
                  </Field>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 mb-1">
              <input
                type="checkbox"
                checked={activateNow}
                onChange={(e) => setActivateNow(e.target.checked)}
                className="w-4 h-4 accent-[#0e6efe]"
              />
              <span className="text-sm font-medium text-slate-800">
                Aktivera direkt och skicka till handlare
              </span>
            </label>
            {salesType === 'auction' && activateNow && (
              <p className="text-xs text-slate-500 ml-7">
                Auktionen är öppen i 48 timmar.
              </p>
            )}
          </section>

          {activateNow && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Skicka till handlare
                </h2>
                <span className="text-xs text-slate-400">
                  {sendToAllApproved
                    ? `Alla godkända (${dealers.length})`
                    : `${selectedDealerIds.size} valda`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSendToAllApproved(true);
                    setSelectedDealerIds(new Set());
                  }}
                  className={`h-9 px-4 rounded-full text-sm font-semibold border transition ${
                    sendToAllApproved
                      ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Alla godkända
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendToAllApproved(false);
                  }}
                  className={`h-9 px-4 rounded-full text-sm font-semibold border transition ${
                    !sendToAllApproved
                      ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Välj specifika
                </button>
              </div>

              {!sendToAllApproved && (
                <>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
                    <input
                      type="text"
                      value={dealerSearch}
                      onChange={(e) => setDealerSearch(e.target.value)}
                      placeholder="Sök handlare..."
                      className="w-full pl-9 pr-3 h-10 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {filteredDealers.length === 0 ? (
                      <p className="text-sm text-slate-400 p-4 text-center">Inga handlare</p>
                    ) : (
                      filteredDealers.map((d) => {
                        const checked = selectedDealerIds.has(d.id);
                        return (
                          <label
                            key={d.id}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDealer(d.id)}
                              className="w-4 h-4 accent-[#0e6efe]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {d.foretagsnamn}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {d.kontaktperson} · {d.mejl}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
              <XCircle className="w-5 h-5 shrink-0 mt-[1px]" />
              <span className="leading-snug">{error}</span>
            </div>
          )}
          {success && (
            <div role="status" className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-[1px]" />
              <span className="leading-snug">{success}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="h-12 px-5 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!valid || submitting}
              className="flex-1 h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {activateNow ? 'Skapa & skicka' : 'Skapa bil'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
