import { useState } from 'react';
import {
  ArrowRight, Star, TrendingDown, Users, ShieldCheck, Sparkles,
  Check, Trophy, Search,
} from 'lucide-react';
import ForhandlaLayout from '../../components/forhandla/ForhandlaLayout';
import {
  FORHANDLARE, SOCIAL_PROOF, PLATFORM_STATS, MONTHLY_TOP,
} from '../../data/forhandlare';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: () => void;
  activePath: string;
}

function AvatarStack() {
  return (
    <div className="flex -space-x-3">
      {FORHANDLARE.map((f, i) => (
        <div
          key={f.id}
          className="w-11 h-11 rounded-full border-2 border-[#faf7f2] flex items-center justify-center font-semibold text-white shadow-sm"
          style={{
            background: ['#0e6b45', '#1a7a55', '#2a8a66'][i % 3],
            zIndex: 10 - i,
          }}
        >
          {f.name.charAt(0)}
        </div>
      ))}
    </div>
  );
}

function HeroTabs({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [tab, setTab] = useState<'salj' | 'kop'>('salj');
  const [reg, setReg] = useState('');

  return (
    <div className="fh-card p-2 max-w-md w-full">
      <div className="flex gap-1 p-1 bg-[#f3eee4] rounded-2xl mb-2">
        <button
          onClick={() => setTab('salj')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'salj' ? 'bg-white text-[#17281f] shadow-sm' : 'text-[#5a6b62]'
          }`}
        >
          Sälj bil
        </button>
        <button
          onClick={() => setTab('kop')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'kop' ? 'bg-white text-[#17281f] shadow-sm' : 'text-[#5a6b62]'
          }`}
        >
          Köp bil
        </button>
      </div>

      {tab === 'salj' ? (
        <div className="p-2">
          <div className="flex gap-2">
            <input
              className="fh-input !h-12 flex-1"
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              placeholder="Regnummer (t.ex. ABC 123)"
            />
            <button
              onClick={() => onNavigate('/salj')}
              className="fh-btn !h-12 !px-5"
            >
              Värdera
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#9aa89e] mt-2 px-1">
            Gratis värdering. Inga förpliktelser.
          </p>
        </div>
      ) : (
        <div className="p-2">
          <p className="text-sm text-[#5a6b62] mb-2.5 px-1">
            Låt en förhandlare hitta och förhandla din nästa bil.
          </p>
          <button
            onClick={() => onNavigate('/kop-bil')}
            className="fh-btn w-full"
          >
            Hitta min bil
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function PricingCards({ onOpenConsultation, onNavigate }: {
  onOpenConsultation: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="fh-card fh-card-hover p-6 md:p-8 relative">
        <div className="absolute top-5 right-5 fh-gold-badge">
          <Sparkles className="w-3 h-3" /> Populärast
        </div>
        <p className="fh-eyebrow mb-2">Med förhandlare</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-display text-4xl font-semibold">fr. 3 995 kr</span>
          <span className="text-sm text-[#9aa89e]">*</span>
        </div>
        <p className="text-sm text-[#5a6b62] mb-5">
          *Betalas bara om affären blir av. Ingen bindningstid.
        </p>
        <ul className="space-y-2.5 mb-6 text-sm">
          {[
            'Certifierad förhandlare på din sida',
            'Snitt 21 100 kr sparat per affär',
            'Avtal via BankID — 0 kr tills affären sker',
            'Tillgång till hela Sveriges bilmarknad',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#0e6b45] mt-0.5 shrink-0" strokeWidth={3} />
              <span className="text-[#17281f]">{t}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => onNavigate('/forhandlare')} className="fh-btn w-full">
          Välj förhandlare
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="fh-card fh-card-hover p-6 md:p-8">
        <p className="fh-eyebrow mb-2">Kostnadsfri konsultation</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-display text-4xl font-semibold">0 kr</span>
        </div>
        <p className="text-sm text-[#5a6b62] mb-5">
          15 minuters samtal. Inget åtagande.
        </p>
        <ul className="space-y-2.5 mb-6 text-sm">
          {[
            'Genomgång av din situation',
            'Uppskattning av besparingspotential',
            'Matchning med rätt förhandlare',
            'Besvarade frågor — inga dumma frågor',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#0e6b45] mt-0.5 shrink-0" strokeWidth={3} />
              <span className="text-[#17281f]">{t}</span>
            </li>
          ))}
        </ul>
        <button onClick={onOpenConsultation} className="fh-btn-ghost w-full">
          Boka samtal
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SocialProofList() {
  return (
    <div className="fh-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#e8e2d6] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#0e6b45] animate-pulse" />
        <p className="text-xs font-semibold text-[#5a6b62]">Senaste affärer</p>
      </div>
      <ul className="divide-y divide-[#f1ece1]">
        {SOCIAL_PROOF.map((s, i) => (
          <li key={i} className="px-5 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f3eee4] flex items-center justify-center font-semibold text-[#0e6b45] text-sm">
              {s.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#17281f]">
                {s.name} i {s.city}
              </p>
              <p className="text-xs text-[#5a6b62] truncate">
                {s.car} · via {s.forhandlare}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#0e6b45]">
                −{s.savingKr.toLocaleString('sv-SE')} kr
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthlyTop({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-3">
      {MONTHLY_TOP.map((f, i) => (
        <button
          key={f.id}
          onClick={() => onNavigate(`/f/${f.slug}`)}
          className="fh-card fh-card-hover p-4 w-full flex items-center gap-4 text-left"
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white"
              style={{ background: ['#0e6b45', '#1a7a55', '#2a8a66'][i % 3] }}>
              {f.name.charAt(0)}
            </div>
            {i === 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#b8860b] flex items-center justify-center">
                <Trophy className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#17281f]">{f.name}</p>
              <span className="fh-gold-badge !px-2 !py-0.5 !text-[10px]">{f.certifiering}</span>
            </div>
            <p className="text-xs text-[#5a6b62] mt-0.5">
              {f.dealCount} affärer · snitt {f.avgSavingKr.toLocaleString('sv-SE')} kr sparat
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-lg font-semibold text-[#0e6b45]">#{i + 1}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function HomePage({ onNavigate, onOpenConsultation, activePath }: HomePageProps) {
  return (
    <ForhandlaLayout onNavigate={onNavigate} onOpenConsultation={onOpenConsultation} activePath={activePath}>
      {/* Hero */}
      <section className="fh-max fh-section-pad pt-10 pb-14 md:pt-16 md:pb-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <p className="fh-eyebrow mb-4">SVERIGES CERTIFIERADE BILFÖRHANDLARE</p>
            <h1 className="font-display text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] leading-[1.08] font-semibold tracking-tight text-[#17281f]">
              Handlaren har ett proffs vid bordet. Nu har du det också.
            </h1>
            <p className="mt-5 text-base md:text-lg text-[#5a6b62] leading-relaxed max-w-md">
              Våra certifierade förhandlare representerar dig — aldrig handlaren.
              Vi förhandlar priset, läser avtalen och ser till att du inte betalar
              för något du inte ska betala för.
            </p>

            <div className="mt-7">
              <HeroTabs onNavigate={onNavigate} />
            </div>
          </div>

          <div className="md:pl-6">
            <div className="fh-card p-6 md:p-7">
              <div className="flex items-center gap-4 mb-5">
                <AvatarStack />
                <div>
                  <p className="font-display text-2xl font-semibold">
                    {PLATFORM_STATS.totalDeals} affärer
                  </p>
                  <p className="text-sm text-[#5a6b62]">
                    snitt {PLATFORM_STATS.avgSavingKr.toLocaleString('sv-SE')} kr sparat · ★ {PLATFORM_STATS.rating}
                  </p>
                </div>
              </div>
              <div className="fh-divider mb-5" />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <Users className="w-5 h-5 mx-auto text-[#0e6b45] mb-1.5" />
                  <p className="font-display text-xl font-semibold">{PLATFORM_STATS.totalDeals}</p>
                  <p className="text-xs text-[#9aa89e]">affärer</p>
                </div>
                <div>
                  <TrendingDown className="w-5 h-5 mx-auto text-[#0e6b45] mb-1.5" />
                  <p className="font-display text-xl font-semibold">{PLATFORM_STATS.avgSavingKr.toLocaleString('sv-SE')}</p>
                  <p className="text-xs text-[#9aa89e]">kr snitt</p>
                </div>
                <div>
                  <Star className="w-5 h-5 mx-auto text-[#b8860b] mb-1.5" />
                  <p className="font-display text-xl font-semibold">{PLATFORM_STATS.rating}</p>
                  <p className="text-xs text-[#9aa89e]">betyg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="fh-max fh-section-pad py-10 md:py-14">
        <div className="text-center mb-8 md:mb-10">
          <p className="fh-eyebrow mb-2">PRISER</p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold">
            Du betalar bara om du sparar pengar
          </h2>
        </div>
        <PricingCards onOpenConsultation={onOpenConsultation} onNavigate={onNavigate} />
      </section>

      {/* Social proof + Monthly top */}
      <section className="fh-max fh-section-pad py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold mb-4">
              Senaste affärer
            </h2>
            <SocialProofList />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl md:text-2xl font-semibold">
                Månadens förhandlare
              </h2>
              <span className="text-xs text-[#9aa89e]">Rankad efter verifierat sparat</span>
            </div>
            <MonthlyTop onNavigate={onNavigate} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="fh-max fh-section-pad py-10 md:py-14">
        <div className="fh-card p-6 md:p-8 grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <ShieldCheck className="w-7 h-7 mx-auto text-[#0e6b45] mb-2" />
            <p className="font-semibold">Representerar dig</p>
            <p className="text-sm text-[#5a6b62] mt-0.5">Aldrig handlaren</p>
          </div>
          <div>
            <Check className="w-7 h-7 mx-auto text-[#0e6b45] mb-2" strokeWidth={3} />
            <p className="font-semibold">Betala vid avslut</p>
            <p className="text-sm text-[#5a6b62] mt-0.5">0 kr tills affären sker</p>
          </div>
          <div>
            <Search className="w-7 h-7 mx-auto text-[#0e6b45] mb-2" />
            <p className="font-semibold">Verifierade besparingar</p>
            <p className="text-sm text-[#5a6b62] mt-0.5">Inga påhittade siffror</p>
          </div>
        </div>
      </section>
    </ForhandlaLayout>
  );
}
