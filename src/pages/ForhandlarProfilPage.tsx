import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Users, TrendingUp, Clock, Shield, Phone, Car, Share2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Forhandlare } from '../lib/forhandlare.types';
import { SiteFooter } from '../components/SiteFooter';
import { captureAttribution } from '../lib/attribution';

const CERT_COLOR: Record<string, string> = {
  Master:      'bg-amber-100 text-amber-800 border-amber-200',
  Elite:       'bg-[#0e6efe]/10 text-[#0e6efe] border-[#0e6efe]/20',
  Senior:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  Certifierad: 'bg-slate-100 text-slate-700 border-slate-200',
  Trainee:     'bg-slate-50 text-slate-500 border-slate-200',
};

const CERT_STARS: Record<string, number> = { Master: 5, Elite: 4, Senior: 3, Certifierad: 2, Trainee: 1 };

function CertBadge({ cert }: { cert: string }) {
  const stars = CERT_STARS[cert] ?? 2;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold border ${CERT_COLOR[cert] ?? CERT_COLOR.Certifierad}`}>
      <Shield className="w-3.5 h-3.5" />
      {cert}
      <div className="flex gap-0.5 ml-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < stars ? 'bg-current' : 'bg-current opacity-20'}`} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  slug: string;
  onBack: () => void;
  onOpenConsultation: (forhandlare?: Forhandlare) => void;
  onNavigateBuy: () => void;
  onNavigateSell: () => void;
}

export default function ForhandlarProfilPage({ slug, onBack, onOpenConsultation, onNavigateBuy, onNavigateSell }: Props) {
  const [forhandlare, setForhandlare] = useState<Forhandlare | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Capture ?via= attribution from URL
    captureAttribution();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('forhandlare')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!data) setNotFound(true);
      else setForhandlare(data as Forhandlare);
      setLoading(false);
    })();
  }, [slug]);

  const handleShare = async () => {
    const url = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0e6efe]/20 border-t-[#0e6efe] animate-spin" />
      </div>
    );
  }

  if (notFound || !forhandlare) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-5 text-center">
        <p className="text-[17px] font-semibold text-slate-700 mb-2">Förhandlaren hittades inte</p>
        <p className="text-slate-400 text-[14px] mb-6">Länken kan vara felaktig eller inaktiv.</p>
        <button type="button" onClick={onBack} className="text-[#0e6efe] font-semibold text-[14px] hover:underline">
          Se alla förhandlare
        </button>
      </div>
    );
  }

  const f = forhandlare;
  const profileUrl = `${window.location.origin}/f/${f.slug}`;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      {/* Nav */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8 gap-4">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" decoding="async" />
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

      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-28 pb-20">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-8 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Alla förhandlare
        </button>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5 mb-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 shrink-0 overflow-hidden shadow-sm">
                {f.avatar_url ? (
                  <img src={f.avatar_url} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-slate-500">
                    {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-[24px] font-extrabold text-slate-900 leading-tight mb-2">{f.name}</h1>
                <CertBadge cert={f.certifiering} />
                {f.city && (
                  <div className="flex items-center gap-1.5 mt-2 text-[13px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {f.city}
                    {f.languages.length > 1 && (
                      <span className="ml-1">· {f.languages.join(', ')}</span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition shrink-0"
                title="Kopiera länk"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
              </button>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { icon: Star, label: 'Betyg', value: `${f.rating.toFixed(1)}`, sub: `(${f.review_count} recensioner)`, color: 'text-amber-500' },
                { icon: Users, label: 'Affärer', value: String(f.deal_count), sub: 'genomförda', color: 'text-slate-500' },
                { icon: TrendingUp, label: 'Snittbesparing', value: `${(f.avg_saving_kr / 1000).toFixed(0)} tkr`, sub: 'per affär', color: 'text-emerald-600' },
                { icon: Clock, label: 'Svarstid', value: f.response_time_hours < 1 ? '< 1h' : `${f.response_time_hours}h`, sub: 'i snitt', color: 'text-[#0e6efe]' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#faf8f5] rounded-xl p-3 text-center">
                  <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1 ${stat.label === 'Betyg' ? 'fill-amber-400' : ''}`} />
                  <div className="text-[16px] font-extrabold text-slate-900 leading-tight">{stat.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Bio */}
            {f.bio && (
              <p className="text-[14px] text-slate-600 leading-relaxed mb-6">{f.bio}</p>
            )}

            {/* Specialties */}
            {f.specialties.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Specialiteter</p>
                <div className="flex flex-wrap gap-2">
                  {f.specialties.map(s => (
                    <span key={s} className="px-3 py-1 bg-[#0e6efe]/6 text-[#0e6efe] text-[12px] font-semibold rounded-lg border border-[#0e6efe]/15">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fee note */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-emerald-800">
                  {f.fee_kr.toLocaleString('sv-SE')} kr — betalas bara om affären blir av
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {f.name.split(' ')[0]} får ersättning vid avslutad affär. Det kostar dig inget extra.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => onOpenConsultation(f)}
            className="w-full h-14 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-3 transition active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 60%,#0a57cc 100%)', boxShadow: '0 4px 16px rgba(14,110,254,0.30)' }}
          >
            <Phone className="w-5 h-5" />
            Boka samtal med {f.name.split(' ')[0]}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { captureAttribution(); onNavigateBuy(); }}
              className="h-12 rounded-xl border-2 border-[#0e6efe] text-[#0e6efe] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#0e6efe]/5 transition active:scale-[0.98]"
            >
              <Car className="w-4 h-4" />
              Köpa bil
            </button>
            <button
              type="button"
              onClick={() => { captureAttribution(); onNavigateSell(); }}
              className="h-12 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-[0.98]"
            >
              Sälja bil
            </button>
          </div>
        </div>

        {/* How it works with this negotiator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Så funkar det med {f.name.split(' ')[0]}</p>
          <div className="space-y-4">
            {[
              { n: '1', title: 'Boka ett samtal', desc: 'Kostnadsfritt samtal — inget avtal, inga förpliktelser.' },
              { n: '2', title: `${f.name.split(' ')[0]} tar affären`, desc: `Fullmakt, förhandling och allt praktiskt hanteras av ${f.name.split(' ')[0]} med AI-verktyg som stöd.` },
              { n: '3', title: 'Du signerar, affären är klar', desc: `${f.name.split(' ')[0]} arvodet dras automatiskt vid signering. Nöjdhetspolicy ingår alltid.` },
            ].map(item => (
              <div key={item.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#0e6efe]/8 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px] font-extrabold text-[#0e6efe]">{item.n}</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900 leading-snug">{item.title}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share card */}
        <div className="mt-6 p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Dela profilen</p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">{profileUrl}</p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className={`h-9 px-4 rounded-xl text-[13px] font-bold transition flex items-center gap-1.5 ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-[#0e6efe]/8 text-[#0e6efe] hover:bg-[#0e6efe]/15'}`}
          >
            {copied ? <><Check className="w-3.5 h-3.5" /> Kopierad!</> : <><Share2 className="w-3.5 h-3.5" /> Kopiera länk</>}
          </button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
