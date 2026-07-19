import {
  ArrowLeft, Star, MapPin, Clock, TrendingDown, Sparkles,
  Share2, QrCode, ShieldCheck, Check, ArrowRight,
} from 'lucide-react';
import ForhandlaLayout from '../../components/forhandla/ForhandlaLayout';
import { getForhandlareBySlug } from '../../data/forhandlare';

interface ForhandlareProfilePageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenConsultation: () => void;
  activePath: string;
}

export default function ForhandlareProfilePage({
  slug,
  onNavigate,
  onOpenConsultation,
  activePath,
}: ForhandlareProfilePageProps) {
  const f = getForhandlareBySlug(slug);

  if (!f) {
    return (
      <ForhandlaLayout onNavigate={onNavigate} onOpenConsultation={onOpenConsultation} activePath={activePath}>
        <div className="fh-max fh-section-pad py-24 text-center">
          <h1 className="font-display text-2xl font-semibold mb-2">Förhandlare hittades inte</h1>
          <p className="text-[#5a6b62] mb-6">Den här profilen finns inte eller är borttagen.</p>
          <button onClick={() => onNavigate('/forhandlare')} className="fh-btn">
            Tillbaka till förhandlare
          </button>
        </div>
      </ForhandlaLayout>
    );
  }

  return (
    <ForhandlaLayout onNavigate={onNavigate} onOpenConsultation={onOpenConsultation} activePath={activePath}>
      <section className="fh-max fh-section-pad pt-6 pb-10">
        <button
          onClick={() => onNavigate('/forhandlare')}
          className="flex items-center gap-1.5 text-sm text-[#5a6b62] hover:text-[#0e6b45] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Alla förhandlare
        </button>

        {/* Profile header */}
        <div className="fh-card p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0e6b45] to-[#1a7a55] flex items-center justify-center text-white font-display text-4xl font-semibold shrink-0 shadow-md">
              {f.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-display text-2xl md:text-3xl font-semibold">{f.name}</h1>
                <span className="fh-gold-badge">
                  <Sparkles className="w-3 h-3" />
                  {f.certifiering}
                </span>
              </div>
              <p className="text-[#5a6b62] flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4" /> {f.city}
              </p>
              <p className="text-[#17281f] leading-relaxed max-w-2xl">{f.bio}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#f1ece1]">
            <div className="text-center">
              <p className="font-display text-2xl font-semibold">{f.dealCount}</p>
              <p className="text-xs text-[#9aa89e] mt-0.5">affärer genomförda</p>
            </div>
            <div className="text-center border-x border-[#f1ece1]">
              <p className="font-display text-2xl font-semibold text-[#0e6b45]">
                {f.avgSavingKr.toLocaleString('sv-SE')}
              </p>
              <p className="text-xs text-[#9aa89e] mt-0.5">kr snitt sparat</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-semibold flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-[#5a6b62]" />
                {f.responseTimeHours} h
              </p>
              <p className="text-xs text-[#9aa89e] mt-0.5">svarstid</p>
            </div>
          </div>
        </div>

        {/* Specialties + fee */}
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="fh-card p-5 md:col-span-2">
            <p className="fh-eyebrow mb-3">Specialiteter</p>
            <div className="flex flex-wrap gap-2">
              {f.specialties.map((s) => (
                <span key={s} className="fh-chip bg-[#f3eee4] text-[#17281f]">{s}</span>
              ))}
            </div>
            <p className="fh-eyebrow mb-3 mt-5">Språk</p>
            <div className="flex flex-wrap gap-2">
              {f.languages.map((l) => (
                <span key={l} className="fh-chip bg-[#0e6b45]/8 text-[#0e6b45]">{l}</span>
              ))}
            </div>
          </div>

          <div className="fh-card p-5 flex flex-col">
            <p className="fh-eyebrow mb-2">Öppen avgift</p>
            <p className="font-display text-3xl font-semibold">
              {f.feeKr.toLocaleString('sv-SE')} kr
            </p>
            <p className="text-sm text-[#9aa89e] mb-4">Betalas bara om affären blir av</p>
            <button onClick={onOpenConsultation} className="fh-btn w-full mt-auto">
              Boka konsultation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transparency line */}
        <div className="fh-card p-5 mt-4 flex items-start gap-3 bg-[#0e6b45]/4 border-[#0e6b45]/15">
          <ShieldCheck className="w-5 h-5 text-[#0e6b45] mt-0.5 shrink-0" />
          <p className="text-sm text-[#17281f] leading-relaxed">
            <strong>{f.name.split(' ')[0]}</strong> får ersättning när affärer sker via hens sida —
            det kostar dig inget extra. Inga dolda provisioner, inga intressekonflikter.
          </p>
        </div>

        {/* Reviews */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-xl font-semibold">Verifierade omdömen</h2>
            <span className="fh-chip bg-[#b8860b]/10 text-[#8a6308]">
              <Star className="w-3.5 h-3.5" />
              {f.rating} · {f.reviewCount} omdömen
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {f.verifiedReviews.map((r) => (
              <div key={r.id} className="fh-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#f3eee4] flex items-center justify-center font-semibold text-[#0e6b45] text-sm">
                      {r.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.author}</p>
                      <p className="text-xs text-[#9aa89e]">{r.city} · {r.car}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < r.rating ? 'text-[#b8860b] fill-[#b8860b]' : 'text-[#e8e2d6]'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#17281f] leading-relaxed mb-2">"{r.text}"</p>
                <p className="text-xs text-[#0e6b45] font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  −{r.savingKr.toLocaleString('sv-SE')} kr sparat
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Share row */}
        <div className="fh-card p-5 mt-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-[#f3eee4] flex items-center justify-center">
              <QrCode className="w-6 h-6 text-[#17281f]" />
            </div>
            <div>
              <p className="font-medium text-sm">Dela {f.name.split(' ')[0]}s profil</p>
              <p className="text-xs text-[#9aa89e]">Kopiera länk eller skanna QR-kod</p>
            </div>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="fh-btn-ghost !py-2.5 !text-sm"
          >
            <Share2 className="w-4 h-4" />
            Kopiera länk
          </button>
        </div>

        {/* Final CTA */}
        <div className="fh-card p-6 md:p-8 mt-6 text-center bg-gradient-to-br from-[#0e6b45]/6 to-[#b8860b]/6">
          <h2 className="font-display text-xl md:text-2xl font-semibold mb-2">
            Redo att ha {f.name.split(' ')[0]} vid bordet?
          </h2>
          <p className="text-[#5a6b62] mb-5">
            Boka ett kostnadsfritt samtal — 0 kr tills affären blir av.
          </p>
          <button onClick={onOpenConsultation} className="fh-btn">
            Boka konsultation med {f.name.split(' ')[0]}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-[#9aa89e] mt-3 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Inget åtagande. Avtal via BankID när du bestämt dig.
          </p>
        </div>
      </section>
    </ForhandlaLayout>
  );
}
