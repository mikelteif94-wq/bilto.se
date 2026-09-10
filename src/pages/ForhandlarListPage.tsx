import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Users, TrendingUp, Clock, ChevronRight, Search, Sparkles, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Forhandlare } from '../lib/forhandlare.types';
import { SiteFooter } from '../components/SiteFooter';

const CERT_ORDER: Record<string, number> = { Master: 5, Elite: 4, Senior: 3, Certifierad: 2, Trainee: 1 };
const CERT_COLOR: Record<string, string> = {
  Master:      'bg-amber-100 text-amber-800 border-amber-200',
  Elite:       'bg-blue-100 text-[#0e6efe] border-blue-200',
  Senior:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  Certifierad: 'bg-slate-100 text-slate-700 border-slate-200',
  Trainee:     'bg-slate-50 text-slate-500 border-slate-200',
};

function ForhandlarCard({ f, onSelect }: { f: Forhandlare; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full bg-white rounded-2xl border border-slate-200 hover:border-[#0e6efe]/40 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200 text-left p-5 active:scale-[0.99]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 shrink-0 overflow-hidden">
          {f.avatar_url ? (
            <img src={f.avatar_url} alt={f.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
              {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
        </div>

        {/* Name + cert */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900 truncate">{f.name}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${CERT_COLOR[f.certifiering] ?? CERT_COLOR.Certifierad}`}>
              <Shield className="w-3 h-3" />
              {f.certifiering}
            </span>
          </div>
          {f.city && (
            <div className="flex items-center gap-1 mt-0.5 text-[12px] text-slate-400">
              <MapPin className="w-3 h-3 shrink-0" />
              {f.city}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[13px] font-bold text-slate-800">{f.rating.toFixed(1)}</span>
              <span className="text-[12px] text-slate-400">({f.review_count})</span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-slate-500">
              <Users className="w-3.5 h-3.5 shrink-0" />
              {f.deal_count} affärer
            </div>
            <div className="flex items-center gap-1 text-[12px] text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              {f.avg_saving_kr > 0 ? `${f.avg_saving_kr.toLocaleString('sv-SE')} kr snitt` : '–'}
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] shrink-0 mt-1 transition-colors" />
      </div>

      {/* Specialties */}
      {f.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {f.specialties.slice(0, 4).map(s => (
            <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-100">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Fee row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-400">
            Svarar inom {f.response_time_hours < 1 ? '< 1 timme' : `${f.response_time_hours} h`}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[14px] font-bold text-slate-900">{f.fee_kr.toLocaleString('sv-SE')} kr</span>
          <span className="text-[11px] text-slate-400 block">bara om affären blir av</span>
        </div>
      </div>
    </button>
  );
}

interface Props {
  onBack: () => void;
  onSelectForhandlare: (slug: string) => void;
  onOpenConsultation: () => void;
}

export default function ForhandlarListPage({ onBack, onSelectForhandlare, onOpenConsultation }: Props) {
  const [forhandlare, setForhandlare] = useState<Forhandlare[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('forhandlare')
        .select('*')
        .eq('is_active', true)
        .order('certifiering');
      if (data) {
        setForhandlare([...data].sort((a, b) => (CERT_ORDER[b.certifiering] ?? 0) - (CERT_ORDER[a.certifiering] ?? 0)));
      }
      setLoading(false);
    })();
  }, []);

  const cities = [...new Set(forhandlare.map(f => f.city).filter(Boolean))] as string[];

  const filtered = forhandlare.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q) || f.specialties.some(s => s.toLowerCase().includes(q));
    const matchCity = !filterCity || f.city === filterCity;
    return matchSearch && matchCity;
  });

  const totalDeals = forhandlare.reduce((s, f) => s + f.deal_count, 0);
  const avgRating = forhandlare.length > 0 ? (forhandlare.reduce((s, f) => s + f.rating, 0) / forhandlare.length).toFixed(1) : '–';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      {/* Nav */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8 gap-4">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" decoding="async" />
          </button>
          <div className="flex items-center ml-auto">
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-12 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-6 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tillbaka
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0e6efe]/8 rounded-full text-[12px] font-semibold text-[#0e6efe] mb-4 border border-[#0e6efe]/20">
            <Shield className="w-3.5 h-3.5" />
            Certifierade bilförhandlare
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-extrabold text-slate-900 leading-[1.1] mb-3">
            Hitta din<br />förhandlare
          </h1>
          <p className="text-[16px] text-slate-500 leading-relaxed mb-6">
            Alla förhandlare är certifierade och betalda bara om affären blir av — aldrig i förväg.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-8">
            <div>
              <div className="text-[22px] font-extrabold text-slate-900">{forhandlare.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">aktiva förhandlare</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[22px] font-extrabold text-slate-900">{totalDeals.toLocaleString('sv-SE')}</div>
              <div className="text-[11px] text-slate-400 font-medium">genomförda affärer</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[22px] font-extrabold text-slate-900">{avgRating}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">snittbetyg</div>
            </div>
          </div>

          {/* Matchning CTA */}
          <button
            type="button"
            onClick={onOpenConsultation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl text-white font-bold text-[15px] transition active:scale-[0.98] mb-8"
            style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 60%,#0a57cc 100%)', boxShadow: '0 4px 16px rgba(14,110,254,0.30)' }}
          >
            <Sparkles className="w-4 h-4" />
            Matcha mig automatiskt
          </button>
        </div>
      </section>

      {/* Filter + list */}
      <section className="pb-20 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto">

          {/* Search + city filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Sök på namn, stad eller specialitet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
              />
            </div>
            {cities.length > 1 && (
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
              >
                <option value="">Alla städer</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-[15px]">Inga förhandlare hittades.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(f => (
                <ForhandlarCard
                  key={f.id}
                  f={f}
                  onSelect={() => onSelectForhandlare(f.slug)}
                />
              ))}
            </div>
          )}

          {/* Trust note */}
          <div className="mt-10 p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900 mb-1">Hur certifieringen fungerar</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Alla förhandlare genomgår bakgrundskontroll, utbildning och prov innan de certifieras. Betyg baseras enbart på verifierade affärer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
