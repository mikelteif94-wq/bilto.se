import { useEffect, useState } from 'react';
import {
  Plus, Loader2, LayoutDashboard, Car as CarIcon, Settings as SettingsIcon,
  Trash2, Tag, Calendar, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  TrendingDown, Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout, { NavItem } from '../components/PortalLayout';
import { useVehicleLookup } from '../lib/useVehicleLookup';
import { formatKr } from '../lib/dealer-utils';

interface DealerCampaignsProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
  onNavigateOverview?: () => void;
  onNavigateCars?: () => void;
  onNavigateSettings?: () => void;
}

interface CampaignCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
  regnr: string | null;
  image_url: string | null;
  regular_price: number;
  campaign_price: number;
  campaign_type: string;
  valid_until: string;
  sale_type: string;
  price_certified: boolean;
  created_at: string;
}

const CAMPAIGN_TYPES = ['Kampanj', 'Förhandlingsklar', 'Offert', 'Lagerrensning', 'Demobil'] as const;
const SALE_TYPES = ['Köp', 'Privatleasing'] as const;

function daysLeft(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

function maxValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

function minValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function RegLookupSection({
  regnr, setRegnr, onApply,
}: {
  regnr: string;
  setRegnr: (v: string) => void;
  onApply: (make: string, model: string, year: number | null) => void;
}) {
  const lookup = useVehicleLookup(regnr);

  useEffect(() => {
    if (lookup.status === 'found') {
      onApply(lookup.data.marke, lookup.data.modell, lookup.data.ar ?? null);
    }
  }, [lookup.status]);

  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
        Registreringsnummer (valfritt)
      </label>
      <div className="relative">
        <input
          type="text"
          value={regnr}
          onChange={e => setRegnr(e.target.value.toUpperCase().replace(/\s/g, ''))}
          placeholder="ABC123"
          maxLength={7}
          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[14px] font-mono text-slate-900 focus:outline-none focus:border-[#0e6efe] focus:bg-white transition uppercase"
        />
        {lookup.status === 'loading' && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
        {lookup.status === 'found' && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
        {lookup.status === 'not_found' && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        )}
      </div>
      {lookup.status === 'found' && (
        <p className="text-[12px] text-emerald-600 mt-1">
          Hittad: {lookup.data.marke} {lookup.data.modell} ({lookup.data.ar})
        </p>
      )}
    </div>
  );
}

function NewCampaignForm({
  dealerId,
  dealerName,
  onCreated,
}: {
  dealerId: string;
  dealerName: string;
  onCreated: () => void;
}) {
  const [regnr, setRegnr] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [campaignPrice, setCampaignPrice] = useState('');
  const [campaignType, setCampaignType] = useState<typeof CAMPAIGN_TYPES[number]>('Kampanj');
  const [saleType, setSaleType] = useState<typeof SALE_TYPES[number]>('Köp');
  const [validUntil, setValidUntil] = useState(maxValidUntil());
  const [priceCertified, setPriceCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyLookup(m: string, mod: string, yr: number | null) {
    setMake(m);
    setModel(mod);
    setYear(yr ? String(yr) : '');
  }

  const savings = (Number(regularPrice) || 0) - (Number(campaignPrice) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!make.trim() || !model.trim()) { setError('Fyll i märke och modell.'); return; }
    if (!regularPrice || !campaignPrice) { setError('Fyll i ordinarie pris och kampanjpris.'); return; }
    if (Number(campaignPrice) >= Number(regularPrice)) { setError('Kampanjpriset måste vara lägre än ordinarie pris.'); return; }
    if (!priceCertified) { setError('Du måste intyga prisuppgiften.'); return; }
    if (!validUntil || validUntil > maxValidUntil()) { setError('Giltighetstiden får vara max 30 dagar.'); return; }

    setSubmitting(true);
    const { error: err } = await supabase.from('campaign_cars').insert({
      dealer_id: dealerId,
      dealer_name: dealerName,
      regnr: regnr.trim() || null,
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : null,
      image_url: imageUrl.trim() || null,
      regular_price: Number(regularPrice),
      campaign_price: Number(campaignPrice),
      campaign_type: campaignType,
      sale_type: saleType,
      valid_until: validUntil,
      price_certified: true,
      price_certified_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (err) { setError('Kunde inte spara kampanjen. Försök igen.'); return; }
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
      <h2 className="text-[18px] font-bold text-slate-900 mb-6">Ny kampanjbil</h2>

      <div className="grid sm:grid-cols-2 gap-5">
        <RegLookupSection regnr={regnr} setRegnr={setRegnr} onApply={applyLookup} />

        <div />

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Märke *</label>
          <input type="text" value={make} onChange={e => setMake(e.target.value)} required placeholder="Volvo" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Modell *</label>
          <input type="text" value={model} onChange={e => setModel(e.target.value)} required placeholder="XC60" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Årsmodell</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2022" min="1980" max={new Date().getFullYear() + 1} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Bildbild-URL</label>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Ordinarie pris (kr) *</label>
          <input type="number" value={regularPrice} onChange={e => setRegularPrice(e.target.value)} required placeholder="350 000" min="1" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Kampanjpris (kr) *</label>
          <input type="number" value={campaignPrice} onChange={e => setCampaignPrice(e.target.value)} required placeholder="299 000" min="1" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
          {savings > 0 && (
            <p className="text-[12px] text-emerald-600 mt-1 font-semibold">
              Besparing: {formatKr(savings)} kr ({Math.round((savings / Number(regularPrice)) * 100)}%)
            </p>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Kampanjtyp *</label>
          <select value={campaignType} onChange={e => setCampaignType(e.target.value as typeof CAMPAIGN_TYPES[number])} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition bg-white">
            {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Typ av affär *</label>
          <select value={saleType} onChange={e => setSaleType(e.target.value as typeof SALE_TYPES[number])} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition bg-white">
            {SALE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Giltig till (max 30 dagar) *</label>
          <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} min={minValidUntil()} max={maxValidUntil()} required className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>
      </div>

      {/* Price certification checkbox */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={priceCertified}
            onChange={e => setPriceCertified(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#0e6efe] shrink-0"
          />
          <span className="text-[13px] text-amber-900 leading-relaxed">
            <strong>Obligatoriskt:</strong> Jag intygar att det ordinarie priset är det pris bilen faktiskt sålts till eller annonserats för under de senaste 30 dagarna. Falskt intygande kan leda till att kampanjen tas bort och att kontot spärras.
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[14px] transition disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Publicera kampanj
        </button>
      </div>
    </form>
  );
}

function CampaignRow({ car, onDeactivate }: { car: CampaignCar; onDeactivate: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const days = daysLeft(car.valid_until);
  const savings = car.regular_price - car.campaign_price;
  const pct = Math.round((savings / car.regular_price) * 100);

  async function doDeactivate() {
    setLoading(true);
    await supabase.from('campaign_cars').update({ is_active: false }).eq('id', car.id);
    setLoading(false);
    onDeactivate();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {car.image_url ? (
        <img src={car.image_url} alt={`${car.make} ${car.model}`} className="w-full sm:w-20 h-16 sm:h-14 object-cover rounded-lg shrink-0" />
      ) : (
        <div className="w-full sm:w-20 h-16 sm:h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
          <CarIcon className="w-6 h-6 text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900 truncate">
          {car.make} {car.model} {car.year ?? ''}
          {car.regnr && <span className="ml-2 text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{car.regnr}</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-[12px] text-emerald-600 font-semibold">Spara {formatKr(savings)} kr ({pct}%)</span>
          <span className="text-slate-300">·</span>
          <span className="text-[12px] text-slate-500">{car.campaign_type}</span>
          <span className="text-slate-300">·</span>
          <span className={`text-[12px] font-medium ${days <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
            {days > 0 ? `${days} dagar kvar` : 'Utgången'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[13px] text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={doDeactivate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[13px] text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Ta bort
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-[13px] text-slate-400 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-50"
            title="Ta bort kampanj"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DealerCampaigns({
  dealerId,
  foretagsnamn,
  onLoggedOut,
  onNavigateOverview,
  onNavigateCars,
  onNavigateSettings,
}: DealerCampaignsProps) {
  const [campaigns, setCampaigns] = useState<CampaignCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const navItems: NavItem[] = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Översikt', onClick: onNavigateOverview },
    { icon: <CarIcon className="w-4 h-4" />, label: 'Bilar', onClick: onNavigateCars },
    { icon: <Tag className="w-4 h-4" />, label: 'Kampanjer', active: true },
    { icon: <SettingsIcon className="w-4 h-4" />, label: 'Inställningar', onClick: onNavigateSettings },
  ];

  async function fetchCampaigns() {
    setLoading(true);
    const { data } = await supabase
      .from('campaign_cars')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false });
    setCampaigns((data as CampaignCar[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCampaigns(); }, [dealerId]);

  const active = campaigns.filter(c => daysLeft(c.valid_until) > 0);
  const expired = campaigns.filter(c => daysLeft(c.valid_until) <= 0);

  return (
    <PortalLayout
      navItems={navItems}
      identity={foretagsnamn}
      identityRole="Handlare"
      onLogout={onLoggedOut}
      pageTitle="Kampanjer"
    >
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900">Kampanjbilar</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Publicera prissänkta bilar på Bilspara-sidan</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(o => !o)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[13px] transition"
          >
            {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Dölj' : 'Ny kampanj'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Aktiva', value: active.length, icon: <TrendingDown className="w-4 h-4 text-emerald-500" /> },
            { label: 'Totalt skapade', value: campaigns.length, icon: <Tag className="w-4 h-4 text-[#0e6efe]" /> },
            { label: 'Utgångna', value: expired.length, icon: <Calendar className="w-4 h-4 text-slate-400" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-[18px] font-bold text-slate-900 leading-tight">{s.value}</p>
                <p className="text-[11px] text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* New campaign form */}
        {showForm && (
          <div className="mb-8">
            <NewCampaignForm
              dealerId={dealerId}
              dealerName={foretagsnamn}
              onCreated={() => { setShowForm(false); fetchCampaigns(); }}
            />
          </div>
        )}

        {/* Active campaigns */}
        <div className="mb-8">
          <h2 className="text-[14px] font-bold text-slate-900 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Aktiva kampanjer ({active.length})
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 h-20 animate-pulse" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] text-slate-500">Inga aktiva kampanjer. Klicka på "Ny kampanj" för att komma igång.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map(c => <CampaignRow key={c.id} car={c} onDeactivate={fetchCampaigns} />)}
            </div>
          )}
        </div>

        {/* Expired campaigns */}
        {expired.length > 0 && (
          <div>
            <h2 className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">
              Utgångna ({expired.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {expired.map(c => <CampaignRow key={c.id} car={c} onDeactivate={fetchCampaigns} />)}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
