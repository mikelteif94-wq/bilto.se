import {
  ArrowRight, Search, Car, ArrowLeftRight, TrendingDown, ShieldCheck, Check,
} from 'lucide-react';
import ForhandlaLayout from '../../components/forhandla/ForhandlaLayout';

interface KopBilPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: () => void;
  activePath: string;
}

const ENTRY_CARDS = [
  {
    icon: Search,
    title: 'Jag har hittat en bil',
    desc: 'Klistra in en länk eller registreringsnummer så förhandlar vi priset åt dig.',
    cta: 'Förhandla priset',
    path: '/kop-bil/found',
  },
  {
    icon: ArrowLeftRight,
    title: 'Jag ska byta in min bil',
    desc: 'Vi värderar din nuvarande bil och förhandlar både inbytespris och nybilpris.',
    cta: 'Starta bilbytet',
    path: '/kop-bil/trade',
  },
  {
    icon: Car,
    title: 'Jag letar efter en bil',
    desc: 'Beskriv vad du söker — så hittar och förhandlar vi rätt bil åt dig.',
    cta: 'Hjälp mig hitta',
    path: '/kop-bil/searching',
  },
];

export default function KopBilPage({ onNavigate, onOpenConsultation, activePath }: KopBilPageProps) {
  return (
    <ForhandlaLayout onNavigate={onNavigate} onOpenConsultation={onOpenConsultation} activePath={activePath}>
      <section className="fh-max fh-section-pad pt-10 pb-6 md:pt-14">
        <p className="fh-eyebrow mb-2">KÖP BIL</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
          Köp rätt bil — till rätt pris, med ett proffs vid bordet
        </h1>
        <p className="mt-3 text-[#5a6b62] max-w-xl">
          Oavsett var du är i processen representerar vår förhandlare dig,
          inte säljaren. Välj vad som stämmer bäst.
        </p>
      </section>

      <section className="fh-max fh-section-pad pb-10">
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {ENTRY_CARDS.map((c) => (
            <button
              key={c.title}
              onClick={() => onNavigate(c.path)}
              className="fh-card fh-card-hover p-6 md:p-7 text-left flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0e6b45]/8 flex items-center justify-center mb-4">
                <c.icon className="w-6 h-6 text-[#0e6b45]" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-[#5a6b62] leading-relaxed flex-1">{c.desc}</p>
              <span className="fh-btn-ghost !py-2.5 !text-sm mt-5 self-start">
                {c.cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="fh-max fh-section-pad py-10 md:py-14">
        <div className="text-center mb-8">
          <p className="fh-eyebrow mb-2">SÅ HÄR FUNGERAR DET</p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold">
            Tre steg till en bättre bilaffär
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: 1, t: 'Berätta vad du söker', d: 'Klistra in en länk, ett regnummer eller beskriv din dröm bil.' },
            { n: 2, t: 'Vi förhandlar åt dig', d: 'En certifierad förhandlare kontaktar säljaren och pressar priset.' },
            { n: 3, t: 'Du bestämmer', d: 'Får du ett pris du gillar — signera via BankID. 0 kr tills affären sker.' },
          ].map((s) => (
            <div key={s.n} className="fh-card p-6">
              <div className="w-10 h-10 rounded-full bg-[#0e6b45] text-white flex items-center justify-center font-display font-semibold mb-3">
                {s.n}
              </div>
              <p className="font-semibold mb-1">{s.t}</p>
              <p className="text-sm text-[#5a6b62] leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Savings strip */}
      <section className="fh-max fh-section-pad py-10">
        <div className="fh-card p-6 md:p-8 bg-gradient-to-br from-[#0e6b45]/6 to-[#b8860b]/6 text-center">
          <TrendingDown className="w-8 h-8 mx-auto text-[#0e6b45] mb-3" />
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            Snitt 21 100 kr sparat per köp
          </h2>
          <p className="text-[#5a6b62] max-w-lg mx-auto mb-5">
            Våra förhandlare vet vad en bil är värd — och vad handlaren kan ta i.
            Besparingen kommer från priset, finansieringen och undvikande av dolda avgifter.
          </p>
          <button onClick={onOpenConsultation} className="fh-btn">
            Boka kostnadsfri konsultation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Trust */}
      <section className="fh-max fh-section-pad py-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, t: 'På din sida', d: 'Vi representerar alltid köparen' },
            { icon: Check, t: 'Betala vid avslut', d: '0 kr tills affären blir av' },
            { icon: TrendingDown, t: 'Verifierat sparat', d: 'Inga påhittade besparingar' },
          ].map((x) => (
            <div key={x.t} className="fh-card p-5 text-center">
              <x.icon className="w-6 h-6 mx-auto text-[#0e6b45] mb-2" />
              <p className="font-semibold">{x.t}</p>
              <p className="text-sm text-[#5a6b62] mt-0.5">{x.d}</p>
            </div>
          ))}
        </div>
      </section>
    </ForhandlaLayout>
  );
}
