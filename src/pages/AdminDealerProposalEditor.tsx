import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Send,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import PortalLayout from '../components/PortalLayout';
import { formatKr, SKICK_LABELS } from '../lib/dealer-utils';

interface AdminDealerProposalEditorProps {
  carId: string;
  onBack: () => void;
  onLoggedOut: () => void;
  onSent?: (proposalId: string) => void;
}

type Car = Database['public']['Tables']['cars']['Row'];
type Dealer = Database['public']['Tables']['dealers']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface CarDetail extends Car {
  customers: Customer | null;
}

type Dealtyp =
  | 'lagre_manadskostnad'
  | 'battre_bil_samma_kostnad'
  | 'premium_byte'
  | 'snabb_affar';

interface InventoryCar {
  id: string;
  marke: string;
  modell: string;
  ar: number;
  miltal: number;
  skick: string;
  utrustning: string[];
}

const DEAL_TYPES: { value: Dealtyp; title: string; desc: string }[] = [
  {
    value: 'lagre_manadskostnad',
    title: 'Lagre manadskostnad',
    desc: 'Samma bilklass, billigare per manad',
  },
  {
    value: 'battre_bil_samma_kostnad',
    title: 'Battre bil, samma kostnad',
    desc: 'Uppgradera utan okad utgift',
  },
  {
    value: 'premium_byte',
    title: 'Premium-byte',
    desc: 'Bättre bil, något dyrare',
  },
  {
    value: 'snabb_affar',
    title: 'Snabb affar',
    desc: 'Snabb och smidig bilaffär',
  },
];

const DACK_OPTIONS = [
  { value: 'helarsdack', label: 'Helarsdäck' },
  { value: 'vinterdack', label: 'Vinterdäck' },
  { value: 'sommardack', label: 'Sommardäck' },
  { value: 'ingen', label: 'Ej specificerat' },
];

function parseMoney(s: string): number {
  const n = Number(s.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function numericInput(val: string, set: (v: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.,]/g, '');
    set(raw);
    void val;
  };
}

export default function AdminDealerProposalEditor({
  carId,
  onBack,
  onLoggedOut,
  onSent,
}: AdminDealerProposalEditorProps) {
  const [car, setCar] = useState<CarDetail | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [inventoryCars, setInventoryCars] = useState<InventoryCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Step 0 — Inbytespris
  const [inbytespris, setInbytespris] = useState('');
  const [kundNuvarandeMaand, setKundNuvarandeMaand] = useState('');
  const [kundNuvarandeRanta, setKundNuvarandeRanta] = useState('');
  const [kundLanerest, setKundLanerest] = useState('');

  // Step 1 — Dealtyp
  const [dealtyp, setDealtyp] = useState<Dealtyp>('lagre_manadskostnad');

  // Step 2 — Dealer + offered car
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [erbjudenMarke, setErbjudenMarke] = useState('');
  const [erbjudenModell, setErbjudenModell] = useState('');
  const [erbjudenAr, setErbjudenAr] = useState('');
  const [erbjudenMiltal, setErbjudenMiltal] = useState('');
  const [erbjudenSkick, setErbjudenSkick] = useState('');
  const [erbjudenDack, setErbjudenDack] = useState('helarsdack');
  const [bildUrls, setBildUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Step 3 — Villkor
  const [manadskostnad, setManadskostnad] = useState('');
  const [loptid, setLoptid] = useState('36');
  const [ranta, setRanta] = useState('');

  // Step 4 — Extras
  const [garantiAr, setGarantiAr] = useState(0);
  const [vinterdackInkl, setVinterdackInkl] = useState(false);
  const [personligtMeddelande, setPersonligtMeddelande] = useState('');

  useEffect(() => {
    void loadData();
  }, [carId]);

  const loadData = async () => {
    setLoading(true);
    const [carRes, dealerRes] = await Promise.all([
      supabase.from('cars').select('*, customers(*)').eq('id', carId).maybeSingle(),
      supabase.from('dealers').select('*').eq('godkand', true).order('foretagsnamn'),
    ]);
    if (carRes.error || !carRes.data) {
      setError('Kunde inte hämta bilen.');
      setLoading(false);
      return;
    }
    setCar(carRes.data as CarDetail);
    setDealers((dealerRes.data ?? []) as Dealer[]);

    // Pre-fill loan rest from car context if available
    if ((carRes.data as Car).direct_bid_estimate) {
      // no auto-fill for loan; admin enters manually
    }
    setLoading(false);
  };

  const loadInventory = async (dealerId: string) => {
    if (!dealerId) { setInventoryCars([]); return; }
    // For now: load dealer's own cars - in real scenario this would be dealer inventory
    // Using the cars table filtered by some dealer association.
    // Since the current schema doesn't have a direct dealer→car inventory link in this path,
    // we load recently added active cars as a proxy for lager.
    const { data } = await supabase
      .from('cars')
      .select('id, marke, modell, ar, miltal, skick, utrustning')
      .eq('status', 'aktiv')
      .order('created_at', { ascending: false })
      .limit(50);
    setInventoryCars((data ?? []) as InventoryCar[]);
  };

  const handleDealerChange = (id: string) => {
    setSelectedDealerId(id);
    setSelectedInventoryId('');
    void loadInventory(id);
    const d = dealers.find((x) => x.id === id);
    if (d) {
      // dealer name will be used when saving
    }
  };

  const handleInventorySelect = (carItemId: string) => {
    setSelectedInventoryId(carItemId);
    const found = inventoryCars.find((c) => c.id === carItemId);
    if (found) {
      setErbjudenMarke(found.marke);
      setErbjudenModell(found.modell);
      setErbjudenAr(String(found.ar));
      setErbjudenMiltal(String(found.miltal));
      setErbjudenSkick(found.skick);
      // Check utrustning for winter tyres hint
      const utr = Array.isArray(found.utrustning) ? found.utrustning : [];
      const hasWinter = utr.some((u: string) => u.toLowerCase().includes('vinter'));
      setErbjudenDack(hasWinter ? 'vinterdack' : 'helarsdack');
    }
  };

  const uploadImages = async (files: File[]) => {
    if (!files.length) return;
    setUploadingImages(true);
    const uploaded: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `proposal-images/${carId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('car-images')
        .upload(path, file, { upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('car-images').getPublicUrl(path);
        if (urlData?.publicUrl) uploaded.push(urlData.publicUrl);
      }
    }
    setBildUrls((prev) => [...prev, ...uploaded]);
    setUploadingImages(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    void uploadImages(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    void uploadImages(files);
  };

  const removeImage = (url: string) => {
    setBildUrls((prev) => prev.filter((u) => u !== url));
  };

  // Computed summary values
  const inbytesprisNum = parseMoney(inbytespris);
  const lanerestNum = parseMoney(kundLanerest);
  const kundFarOver = inbytesprisNum - lanerestNum;
  const nuvarandeEquity = parseMoney(kundNuvarandeMaand) > 0 ? parseMoney(kundNuvarandeMaand) : null;
  const nuvarandeMaandNum = parseMoney(kundNuvarandeMaand);
  const nuvarandeRantaNum = parseFloat(kundNuvarandeRanta.replace(',', '.')) || 0;
  const manadskostnadNum = parseMoney(manadskostnad);
  const loptidNum = parseInt(loptid) || 36;
  const rantaNum = parseFloat(ranta.replace(',', '.')) || 0;
  const maandDiff = manadskostnadNum - nuvarandeMaandNum;
  const totalFordel = nuvarandeMaandNum > 0 ? -maandDiff * loptidNum : null;
  const rantaDiff = rantaNum - nuvarandeRantaNum;

  const validate = (): string | null => {
    if (!selectedDealerId) return 'Välj en handlare.';
    if (inbytesprisNum <= 0) return 'Ange inbytespris.';
    if (!erbjudenMarke || !erbjudenModell) return 'Fyll i bil (märke och modell).';
    if (manadskostnadNum <= 0) return 'Ange månadskostnad.';
    if (rantaNum <= 0) return 'Ange ränta.';
    return null;
  };

  const buildPayload = (status: 'draft' | 'sent') => {
    const dealer = dealers.find((d) => d.id === selectedDealerId);
    return {
      car_id: carId,
      dealer_id: selectedDealerId || null,
      dealer_name: dealer?.foretagsnamn ?? '',
      inbytespris: inbytesprisNum,
      kund_nuvarande_manad: nuvarandeMaandNum,
      kund_nuvarande_ranta: nuvarandeRantaNum,
      kund_lanerest: lanerestNum,
      dealtyp,
      offered_car_id: selectedInventoryId || null,
      erbjuden_marke: erbjudenMarke.trim(),
      erbjuden_modell: erbjudenModell.trim(),
      erbjuden_ar: erbjudenAr ? parseInt(erbjudenAr) : null,
      erbjuden_miltal: erbjudenMiltal ? parseMoney(erbjudenMiltal) : null,
      erbjuden_skick: erbjudenSkick,
      erbjuden_dack: erbjudenDack,
      erbjuden_bild_urls: bildUrls,
      manadskostnad: manadskostnadNum,
      loptid_manader: loptidNum,
      ranta: rantaNum,
      garanti_ar: garantiAr,
      vinterdack_inkl: vinterdackInkl,
      personligt_meddelande: personligtMeddelande.trim(),
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    };
  };

  const handleSaveDraft = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSaving(true);
    const { error: insErr } = await supabase.from('dealer_proposals').insert(buildPayload('draft'));
    setSaving(false);
    if (insErr) { setError('Kunde inte spara utkast.'); return; }
    onBack();
  };

  const handleSend = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!car?.customers?.mejl && !car?.customers?.namn) {
      setError('Kunden saknar e-postadress.');
      return;
    }
    setError(null);
    setSending(true);
    const { data: insertData, error: insErr } = await supabase
      .from('dealer_proposals')
      .insert(buildPayload('sent'))
      .select('id')
      .maybeSingle();
    if (insErr || !insertData) {
      setSending(false);
      setError('Kunde inte skicka förslaget.');
      return;
    }
    // Notify customer via edge function
    const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
      ?? import.meta.env.VITE_SUPABASE_URL;
    await fetch(`${supabaseUrl}/functions/v1/notify-dealer-proposal`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ proposalId: insertData.id, carId }),
    });
    setSending(false);
    setSent(true);
    onSent?.(insertData.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const breadcrumb = (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 transition font-medium"
    >
      <ChevronLeft className="w-4 h-4" />
      Tillbaka till bilen
    </button>
  );

  if (loading) {
    return (
      <PortalLayout navItems={[]} identity="" identityRole="Admin" onLogout={handleLogout} breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </PortalLayout>
    );
  }

  if (sent) {
    return (
      <PortalLayout navItems={[]} identity="" identityRole="Admin" onLogout={handleLogout} breadcrumb={breadcrumb}>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Förslag skickat!</h2>
          <p className="text-slate-500 mb-8">Kunden har notifierats och kan se förslaget i sin portal.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0e6efe] text-white font-semibold text-sm hover:bg-[#0a57cc] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka till bilen
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout navItems={[]} identity="" identityRole="Admin" onLogout={handleLogout} breadcrumb={breadcrumb}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Skapa handlarförslag</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bygg ett strukturerat erbjudande som kunden ser i sin portal.</p>
        </div>

        {/* Sticky context bar */}
        {car && (
          <div className="sticky top-0 z-10 bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Kundens bil</span>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5 items-center">
              <span className="font-mono font-bold text-slate-900 tracking-widest text-base">{car.regnummer}</span>
              <span className="text-sm font-semibold text-slate-700">
                {[car.marke, car.modell].filter(Boolean).join(' ')} {car.ar}
              </span>
              <span className="text-sm text-slate-500">{car.miltal.toLocaleString('sv-SE')} mil</span>
              <span className="text-sm text-slate-500">{SKICK_LABELS[car.skick] ?? car.skick}</span>
              {car.direct_bid_estimate && (
                <span className="text-sm text-slate-500">
                  Est. {formatKr(car.direct_bid_estimate)} kr
                </span>
              )}
              {car.customers && (
                <span className="text-sm text-slate-400 ml-auto">{car.customers.namn}</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <X className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Step 0 — Handlare */}
          <StepCard number={0} title="Handlare">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Välj handlare" required>
                <div className="relative">
                  <select
                    value={selectedDealerId}
                    onChange={(e) => handleDealerChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] pr-8"
                  >
                    <option value="">Välj handlare...</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>{d.foretagsnamn}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </FormGroup>
            </div>
          </StepCard>

          {/* Step 0b — Inbytespris */}
          <StepCard number={1} title="Vad ger du for kundens bil?">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <FormGroup label="Inbytespris (kr)" required>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="245 000"
                  value={inbytespris}
                  onChange={numericInput(inbytespris, setInbytespris)}
                  className={inputCls}
                />
              </FormGroup>
              <FormGroup label="Kundens lånerest (kr)">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="176 400"
                  value={kundLanerest}
                  onChange={numericInput(kundLanerest, setKundLanerest)}
                  className={inputCls}
                />
              </FormGroup>
              <FormGroup label="Kundens nuv. månadskostnad (kr)">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="4 800"
                  value={kundNuvarandeMaand}
                  onChange={numericInput(kundNuvarandeMaand, setKundNuvarandeMaand)}
                  className={inputCls}
                />
              </FormGroup>
              <FormGroup label="Kundens nuv. ränta (%)">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="6.9"
                  value={kundNuvarandeRanta}
                  onChange={(e) => setKundNuvarandeRanta(e.target.value)}
                  className={inputCls}
                />
              </FormGroup>
            </div>
            {inbytesprisNum > 0 && (
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-2">
                <SummaryRow label="Inbytespris" value={`${formatKr(inbytesprisNum)} kr`} />
                <SummaryRow
                  label="Lånerest som löses"
                  value={lanerestNum > 0 ? `−${formatKr(lanerestNum)} kr` : '—'}
                  valueClass="text-slate-600"
                />
                <SummaryRow
                  label="Kunden får över"
                  value={lanerestNum > 0 ? `${formatKr(kundFarOver)} kr` : '—'}
                  valueClass={kundFarOver >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}
                />
              </div>
            )}
          </StepCard>

          {/* Step 1 — Dealtyp */}
          <StepCard number={2} title="Dealtyp">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEAL_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDealtyp(dt.value)}
                  className={`text-left px-4 py-3.5 rounded-xl border-2 transition ${
                    dealtyp === dt.value
                      ? 'border-[#0e6efe] bg-blue-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-0.5 ${dealtyp === dt.value ? 'text-[#0e6efe]' : 'text-slate-800'}`}>
                    {dt.title}
                  </div>
                  <div className="text-xs text-slate-500">{dt.desc}</div>
                </button>
              ))}
            </div>
          </StepCard>

          {/* Step 2 — Bilen du erbjuder */}
          <StepCard number={3} title="Bilen du erbjuder">
            {selectedDealerId && inventoryCars.length > 0 && (
              <FormGroup label="Välj från lager (valfritt)" className="mb-4">
                <div className="relative">
                  <select
                    value={selectedInventoryId}
                    onChange={(e) => handleInventorySelect(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] pr-8"
                  >
                    <option value="">Välj bil från lager...</option>
                    {inventoryCars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.marke} {c.modell} {c.ar} ({c.miltal.toLocaleString('sv-SE')} mil)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </FormGroup>
            )}
            <div className="grid sm:grid-cols-3 gap-4">
              <FormGroup label="Märke" required>
                <input type="text" value={erbjudenMarke} onChange={(e) => setErbjudenMarke(e.target.value)} placeholder="Volvo" className={inputCls} />
              </FormGroup>
              <FormGroup label="Modell" required>
                <input type="text" value={erbjudenModell} onChange={(e) => setErbjudenModell(e.target.value)} placeholder="XC60 T8" className={inputCls} />
              </FormGroup>
              <FormGroup label="Årsmodell">
                <input type="text" inputMode="numeric" value={erbjudenAr} onChange={(e) => setErbjudenAr(e.target.value.replace(/\D/g, ''))} placeholder="2023" className={inputCls} />
              </FormGroup>
              <FormGroup label="Miltal">
                <input type="text" inputMode="numeric" value={erbjudenMiltal} onChange={numericInput(erbjudenMiltal, setErbjudenMiltal)} placeholder="2 800" className={inputCls} />
              </FormGroup>
              <FormGroup label="Skick">
                <div className="relative">
                  <select value={erbjudenSkick} onChange={(e) => setErbjudenSkick(e.target.value)} className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] pr-8">
                    <option value="">Välj skick...</option>
                    {Object.entries(SKICK_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </FormGroup>
              <FormGroup label="Däck">
                <div className="relative">
                  <select value={erbjudenDack} onChange={(e) => setErbjudenDack(e.target.value)} className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] pr-8">
                    {DACK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </FormGroup>
            </div>

            {/* Image upload */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Bilder</label>
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  dragging ? 'border-[#0e6efe] bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                {uploadingImages ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                ) : (
                  <>
                    <ImageIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Dra och släpp bilder här, eller klicka för att välja</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              {bildUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {bildUrls.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StepCard>

          {/* Step 3 — Villkor */}
          <StepCard number={4} title="Villkor">
            <div className="grid sm:grid-cols-3 gap-4">
              <FormGroup label="Månadskostnad (kr)" required>
                <input type="text" inputMode="numeric" placeholder="3 890" value={manadskostnad} onChange={numericInput(manadskostnad, setManadskostnad)} className={inputCls} />
              </FormGroup>
              <FormGroup label="Löptid (mån)">
                <input type="text" inputMode="numeric" placeholder="36" value={loptid} onChange={(e) => setLoptid(e.target.value.replace(/\D/g, ''))} className={inputCls} />
              </FormGroup>
              <FormGroup label="Ränta (%)" required>
                <input type="text" inputMode="decimal" placeholder="4.9" value={ranta} onChange={(e) => setRanta(e.target.value)} className={inputCls} />
              </FormGroup>
            </div>
          </StepCard>

          {/* Step 4 — Extras */}
          <StepCard number={5} title="Vad ingar i erbjudandet?">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Toggle checked={garantiAr > 0} onChange={(v) => setGarantiAr(v ? 2 : 0)} />
                  <span className="text-sm font-medium text-slate-700">Garanti</span>
                </div>
                {garantiAr > 0 && (
                  <div className="relative">
                    <select
                      value={garantiAr}
                      onChange={(e) => setGarantiAr(Number(e.target.value))}
                      className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 pr-7 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
                    >
                      <option value={1}>1 år</option>
                      <option value={2}>2 år</option>
                      <option value={3}>3 år</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <Toggle checked={vinterdackInkl} onChange={setVinterdackInkl} />
                <span className="text-sm font-medium text-slate-700">Vinterdäck inkluderat</span>
              </div>
              <FormGroup label={`Personligt meddelande (${personligtMeddelande.length}/200)`}>
                <textarea
                  maxLength={200}
                  rows={3}
                  placeholder="Vi har en närmast identisk bil i lager med 1 år nyare modellår och full historik."
                  value={personligtMeddelande}
                  onChange={(e) => setPersonligtMeddelande(e.target.value)}
                  className={`${inputCls} resize-none ${personligtMeddelande.length >= 180 ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-400' : ''}`}
                />
              </FormGroup>
            </div>
          </StepCard>

          {/* Step 5 — Live summary */}
          <StepCard number={6} title="Sammanfattning – vad kunden ser" accent="bg-slate-900">
            <div className="bg-slate-900 rounded-xl p-5 space-y-3 text-sm">
              {/* Dealer + car */}
              <div className="pb-3 border-b border-slate-700">
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                  {dealers.find((d) => d.id === selectedDealerId)?.foretagsnamn ?? 'Handlare ej vald'}
                </p>
                <p className="text-white font-bold text-base">
                  {[erbjudenMarke, erbjudenModell].filter(Boolean).join(' ') || 'Bil ej angiven'}
                  {erbjudenAr ? ` ${erbjudenAr}` : ''}
                </p>
                {(erbjudenMiltal || erbjudenSkick) && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {erbjudenMiltal ? `${parseMoney(erbjudenMiltal).toLocaleString('sv-SE')} mil` : ''}
                    {erbjudenMiltal && erbjudenSkick ? ' · ' : ''}
                    {erbjudenSkick ? (SKICK_LABELS[erbjudenSkick] ?? erbjudenSkick) : ''}
                    {erbjudenDack ? ` · ${DACK_OPTIONS.find((o) => o.value === erbjudenDack)?.label ?? erbjudenDack}` : ''}
                  </p>
                )}
                {bildUrls.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {bildUrls.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-12 object-cover rounded-md" />
                    ))}
                    {bildUrls.length > 3 && (
                      <div className="w-16 h-12 rounded-md bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-medium">
                        +{bildUrls.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dealtyp tag */}
              <div className="pb-3 border-b border-slate-700">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                  {DEAL_TYPES.find((d) => d.value === dealtyp)?.title ?? ''}
                </span>
              </div>

              {/* Financial summary rows */}
              <SummaryRowDark
                label="Du ger för kundens bil"
                value={inbytesprisNum > 0 ? `${formatKr(inbytesprisNum)} kr` : '—'}
                valueClass="text-white font-semibold"
              />
              {lanerestNum > 0 && (
                <SummaryRowDark
                  label="Kunden får över efter lånelösen"
                  value={`${formatKr(kundFarOver)} kr`}
                  valueClass={kundFarOver >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}
                  icon={kundFarOver >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                />
              )}
              <SummaryRowDark
                label="Din månadskostnad på nya bilen"
                value={manadskostnadNum > 0 ? `${formatKr(manadskostnadNum)} kr/mån` : '—'}
                valueClass="text-white font-semibold"
              />
              {nuvarandeMaandNum > 0 && (
                <SummaryRowDark
                  label="Kundens nuvarande"
                  value={`${formatKr(nuvarandeMaandNum)} kr/mån`}
                  valueClass="text-slate-400"
                />
              )}
              {nuvarandeMaandNum > 0 && manadskostnadNum > 0 && (
                <SummaryRowDark
                  label="Skillnad"
                  value={`${maandDiff <= 0 ? '' : '+'}${formatKr(maandDiff)} kr/mån`}
                  valueClass={maandDiff <= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}
                  icon={maandDiff <= 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                />
              )}
              {nuvarandeRantaNum > 0 && rantaNum > 0 && (
                <SummaryRowDark
                  label="Ränta"
                  value={`${rantaNum}% (vs ${nuvarandeRantaNum}%)`}
                  valueClass={rantaDiff <= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}
                />
              )}
              {garantiAr > 0 && (
                <SummaryRowDark label="Garanti" value={`${garantiAr} år`} valueClass="text-emerald-400" />
              )}
              {vinterdackInkl && (
                <SummaryRowDark label="Vinterdäck" value="Inkluderat" valueClass="text-emerald-400" />
              )}

              {/* Money shot */}
              {totalFordel !== null && (
                <div className="mt-2 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs">Total fördel över löptiden ({loptidNum} mån)</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {totalFordel > 0 ? (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xl font-bold tabular-nums ${totalFordel > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalFordel > 0 ? '−' : '+'}{formatKr(Math.abs(totalFordel))} kr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal message */}
              {personligtMeddelande && (
                <div className="mt-2 pt-3 border-t border-slate-700">
                  <p className="text-slate-400 text-xs mb-1">Personligt meddelande</p>
                  <p className="text-white text-sm italic">"{personligtMeddelande}"</p>
                </div>
              )}
            </div>
          </StepCard>
        </div>

        {/* Action row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-800 transition font-medium"
          >
            Avbryt
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving || sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Spara utkast
            </button>
            <button
              onClick={handleSend}
              disabled={saving || sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Skicka förslag
              {!sending && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition';

function StepCard({
  number,
  title,
  children,
  accent: _accent,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormGroup({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = 'text-slate-900',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function SummaryRowDark({
  label,
  value,
  valueClass = 'text-white',
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`flex items-center gap-1.5 ${valueClass}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition ${checked ? 'bg-[#0e6efe]' : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}
