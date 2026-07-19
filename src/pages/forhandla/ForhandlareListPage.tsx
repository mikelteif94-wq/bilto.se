import {
  Star, MapPin, Clock, TrendingDown, ArrowRight, Sparkles, Check,
} from 'lucide-react';
import ForhandlaLayout from '../../components/forhandla/ForhandlaLayout';
import { FORHANDLARE } from '../../data/forhandlare';

interface ForhandlareListPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: () => void;
  activePath: string;
}

function CertBadge({ level }: { level: string }) {
  return (
    <span className="fh-gold-badge">
      <Sparkles className="w-3 h-3" />
      {level}
    </span>
  );
}

export default function ForhandlareListPage({
  onNavigate,
  onOpenConsultation,
  activePath,
}: ForhandlareListPageProps) {
  return (
    <ForhandlaLayout onNavigate={onNavigate} onOpenConsultation={onOpenConsultation} activePath={activePath}>
      <section className="fh-max fh-section-pad pt-10 pb-6 md:pt-14">
        <p className="fh-eyebrow mb-2">VÅRA FÖRHANDLARE</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Certifierade förhandlare — på din sida
        </h1>
        <p className="mt-3 text-[#5a6b62] max-w-xl">
          Alla förhandlare är granskade, certifierade och representerar alltid
          kunden. Du betalar bara om affären blir av.
        </p>
      </section>

      <section className="fh-max fh-section-pad pb-14">
        <div className="grid gap-4 md:gap-5">
          {FORHANDLARE.map((f) => (
            <button
              key={f.id}
              onClick={() => onNavigate(`/f/${f.slug}`)}
              className="fh-card fh-card-hover p-5 md:p-6 w-full text-left"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                {/* Avatar + identity */}
                <div className="flex items-center gap-4 md:min-w-[260px]">
                  <div className="w-14 h-14 rounded-full bg-[#0e6b45] flex items-center justify-center text-white font-semibold text-xl shrink-0">
                    {f.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display text-lg font-semibold">{f.name}</p>
                      <CertBadge level={f.certifiering} />
                    </div>
                    <p className="text-sm text-[#5a6b62] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" /> {f.city}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 flex-1 md:px-6 md:border-x md:border-[#f1ece1]">
                  <div>
                    <p className="font-display text-xl font-semibold">{f.dealCount}</p>
                    <p className="text-xs text-[#9aa89e]">affärer</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold">
                      {f.avgSavingKr.toLocaleString('sv-SE')}
                    </p>
                    <p className="text-xs text-[#9aa89e]">kr snitt</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#b8860b]" />
                      {f.rating}
                    </p>
                    <p className="text-xs text-[#9aa89e]">{f.reviewCount} omdömen</p>
                  </div>
                </div>

                {/* Fee + CTA */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 md:min-w-[180px]">
                  <div className="text-left md:text-right">
                    <p className="font-display text-xl font-semibold">
                      {f.feeKr.toLocaleString('sv-SE')} kr
                    </p>
                    <p className="text-xs text-[#9aa89e]">bara om affären blir av</p>
                  </div>
                  <span className="fh-btn-ghost !px-4 !py-2 !text-sm">
                    Visa profil
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-4 pt-4 border-t border-[#f1ece1] flex flex-wrap gap-2">
                {f.specialties.map((s) => (
                  <span
                    key={s}
                    className="fh-chip bg-[#f3eee4] text-[#5a6b62]"
                  >
                    {s}
                  </span>
                ))}
                <span className="fh-chip bg-[#0e6b45]/8 text-[#0e6b45] ml-auto">
                  <Clock className="w-3.5 h-3.5" />
                  Svar inom {f.responseTimeHours} h
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Auto-match CTA */}
        <div className="fh-card p-6 md:p-8 mt-8 text-center bg-gradient-to-br from-[#0e6b45]/5 to-[#b8860b]/5">
          <TrendingDown className="w-8 h-8 mx-auto text-[#0e6b45] mb-3" />
          <h2 className="font-display text-xl md:text-2xl font-semibold mb-2">
            Osäker på vem du ska välja?
          </h2>
          <p className="text-[#5a6b62] mb-5 max-w-md mx-auto">
            Vi matchar dig automatiskt med den förhandlare som passar ditt ärende bäst —
            baserat på biltyp, ort och tidigare resultat.
          </p>
          <button onClick={onOpenConsultation} className="fh-btn">
            Matcha mig automatiskt
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-[#9aa89e] mt-3 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Kostnadsfri matchning. Inget åtagande.
          </p>
        </div>
      </section>
    </ForhandlaLayout>
  );
}
