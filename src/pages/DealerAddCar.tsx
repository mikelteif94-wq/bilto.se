import { useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, XCircle, Send } from 'lucide-react';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabase';
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

interface DealerAddCarProps {
  dealerId: string;
  foretagsnamn: string;
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

function generateToken(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const out: string[] = [];
  const buf = new Uint8Array(1);
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  while (out.length < 32) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) out.push(alphabet[buf[0] % alphabet.length]);
  }
  return out.join('');
}

export default function DealerAddCar({
  dealerId,
  foretagsnamn,
  onBack,
  onCreated,
}: DealerAddCarProps) {
  const [namn, setNamn] = useState('');
  const [salesType] = useState<'auction'>('auction');
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const arNum = Number(ar);
  const currentYear = new Date().getFullYear();
  const valid =
    namn.trim().length > 1 &&
    telefon.trim().length >= 6 &&
    emailRe.test(mejl.trim()) &&
    regnummer.trim().length >= 3 &&
    miltal.trim().length > 0 &&
    Number(miltal) >= 0 &&
    Number.isInteger(arNum) &&
    arNum >= 1950 &&
    arNum <= currentYear + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const customerId = crypto.randomUUID();
      const { error: cErr } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          namn: namn.trim(),
          telefon: telefon.trim(),
          mejl: mejl.trim(),
        });

      if (cErr) {
        setError('Kunde inte spara säljaren. Försök igen.');
        setSubmitting(false);
        return;
      }

      const accessToken = generateToken();
      const carId = crypto.randomUUID();
      const { error: carErr } = await supabase
        .from('cars')
        .insert({
          id: carId,
          regnummer: regnummer.trim().toUpperCase(),
          marke: marke.trim(),
          modell: modell.trim(),
          ar: Number(ar),
          miltal: Number(miltal),
          skick,
          skick_kommentar: skickKommentar.trim(),
          utrustning: [],
          customer_id: customerId,
          access_token: accessToken,
          sales_type: salesType,
          status: 'ny',
          notes: notes.trim()
            ? `[Inlagd av handlare: ${foretagsnamn}]\n${notes.trim()}`
            : `[Inlagd av handlare: ${foretagsnamn}]`,
          condition_report: isConditionReportFilled(conditionReport) ? conditionReport : null,
        });

      if (carErr) {
        setError('Kunde inte spara bilen. Försök igen.');
        setSubmitting(false);
        return;
      }
      const carRow = { id: carId };

      await supabase.from('car_activities').insert({
        car_id: carRow.id,
        type: 'note',
        title: 'Bil inlagd av handlare',
        body: `Skapad av ${foretagsnamn}`,
        data: { source: 'dealer_self', dealer_id: dealerId },
      });

      const trackingUrl = `${window.location.origin}/min-bil/${accessToken}`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      };
      void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-customer-submitted`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ car_id: carRow.id, tracking_url: trackingUrl }),
      }).catch(() => {});

      if (images.length > 0) {
        const up = await uploadCarImages(supabase, carRow.id, images);
        if (!up.ok) {
          setError(up.error ?? 'Bilen är skapad men bilderna kunde inte laddas upp.');
          setSubmitting(false);
          return;
        }
      }

      setSuccess('Bilen är skickad och väntar på godkännande av Bilto.');
      setTimeout(() => onCreated(carRow.id), 800);
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbEl = (
    <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 transition font-medium">
      <ChevronLeft className="w-4 h-4" />
      Tillbaka
    </button>
  );

  return (
    <PortalLayout
      navItems={[]}
      identity={foretagsnamn}
      identityRole="Handlare"
      breadcrumb={breadcrumbEl}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <p className="text-sm text-slate-500 mb-6">
          Lägg in en kunds bil så samlar vi in bud från hela vårt handlarnätverk.
          Bilto granskar och aktiverar uppdraget innan budgivningen startar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">
              Säljare
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Bilägarens kontaktuppgifter. Vi mejlar säljaren en personlig länk så att hen kan följa budgivningen.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Säljarens namn *">
                <input
                  type="text"
                  required
                  value={namn}
                  onChange={(e) => setNamn(e.target.value)}
                  placeholder="Bilägarens för- och efternamn"
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

          <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Bil
            </h2>
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
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none bg-[#faf8f5]"
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
                  list={marke ? `dealer-models-${marke}` : undefined}
                  value={modell}
                  onChange={(e) => setModell(e.target.value)}
                  disabled={!marke}
                  placeholder={marke ? 'Välj eller skriv modell' : 'Välj märke först'}
                  autoComplete="off"
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none bg-[#faf8f5] disabled:bg-slate-50 disabled:text-slate-400"
                />
                {marke && (
                  <datalist id={`dealer-models-${marke}`}>
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
                  className="w-full px-3 h-11 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none bg-[#faf8f5]"
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
              <Field label="Övriga noteringar" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                />
              </Field>
            </div>
          </section>

          <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Bilder
              </h2>
              <span className="text-xs text-slate-400">Frivilligt</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Säljaren kan komplettera senare via sin personliga länk. Du kan hoppa över.
            </p>
            <CarImageUploader
              images={images}
              onChange={setImages}
              maxImages={12}
              hint="Lägg till exteriör, interiör, mätarställning, eventuella skador."
            />
          </section>

          <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Skickrapport
              </h2>
              <span className="text-xs text-slate-400">Frivilligt</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Detaljerad skickrapport ger högre bud. Säljaren kan komplettera senare.
            </p>
            <ConditionReportForm
              value={conditionReport}
              onChange={setConditionReport}
              collapsible
            />
          </section>

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
              className="h-12 px-5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!valid || submitting}
              className="flex-1 h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Skicka in bil
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
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
