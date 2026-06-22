import { Camera, Sun, Car, Sparkles, Eye, Check, ArrowRight, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface InspectionGuideStepProps {
  onNext: () => void;
}

const SHOT_LIST = [
  {
    icon: Car,
    title: 'Exteriör – alla sidor',
    items: [
      'Framifrån rakt framför bilen',
      'Bakifrån rakt bakom bilen',
      'Vänster sida rakt från sidan',
      'Höger sida rakt från sidan',
      'Snett framifrån och snett bakifrån',
    ],
  },
  {
    icon: Sparkles,
    title: 'Interiör',
    items: [
      'Förarsäte och ratt',
      'Passagerarsäte och dashboard',
      'Baksäte',
      'Bagageutrymme',
      'Mätartavla med tänd display',
    ],
  },
  {
    icon: Eye,
    title: 'Närbilder & detaljer',
    items: [
      'Fälgar och däck',
      'Eventuella skador eller repor',
      'Servicebok & dokument',
      'Nyckel/nycklar',
      'Motorrummet',
    ],
  },
];

const TIPS = [
  { icon: Sun, t: 'Ta bilderna i dagsljus', d: 'Undvik kvällsljus och starka reflexer.' },
  { icon: Sparkles, t: 'Tvätta bilen innan', d: 'En ren bil ger bättre bud – alltid.' },
  { icon: Camera, t: 'Håll kameran rakt', d: 'Stå ca 2–3 meter från bilen vid översiktsbilder.' },
  { icon: ImageIcon, t: 'Minst 8 bilder', d: 'Ju fler tydliga bilder, desto snabbare affär.' },
];

export default function InspectionGuideStep({ onNext }: InspectionGuideStepProps) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-[#0e6efe] text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full bg-[#3d8cff] opacity-50" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] bg-[#faf8f5]/15 backdrop-blur px-2.5 py-1 rounded-xl">
            <Camera className="w-3.5 h-3.5" />
            Fotoguide
          </div>
          <h2 className="mt-4 text-[22px] sm:text-[26px] font-semibold leading-[1.15] tracking-tight text-white">
            Så fotar du din bil<br />som ett proffs
          </h2>
          <p className="mt-3 text-white/90 text-[14.5px] leading-[1.6] max-w-md">
            Bra bilder ger fler bud och bättre pris. Följ guiden nedan så får du
            bilder som bilhandlarna älskar – det tar bara några minuter.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4 tracking-tight">
          Innan du börjar
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {TIPS.map((tip) => (
            <div key={tip.t} className="rounded-xl border border-slate-200 bg-[#faf8f5] p-4 flex gap-3">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center">
                <tip.icon className="w-4.5 h-4.5 text-[#0e6efe]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{tip.t}</p>
                <p className="text-[13px] text-slate-600 leading-[1.55]">{tip.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-slate-900 mb-4 tracking-tight">
          Bilder du ska ta
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {SHOT_LIST.map((c) => (
            <div key={c.title} className="rounded-xl border border-slate-200 bg-[#faf8f5] p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center">
                  <c.icon className="w-4 h-4 text-[#0e6efe]" />
                </div>
                <h4 className="text-[14px] font-semibold text-slate-900">{c.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {c.items.map((i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                    <Check className="w-3.5 h-3.5 text-[#0e6efe] shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-semibold text-amber-900">Var ärlig med eventuella skador</p>
          <p className="text-[13px] text-amber-800 leading-[1.55] mt-1">
            Ta närbilder på repor, bucklor och slitage. Transparens ger seriösa
            bud och slipper diskussion vid hämtning.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          <span className="font-semibold text-slate-900">Klar att ladda upp bilderna?</span>{' '}
          I nästa steg laddar du upp dina bilder. Du kan alltid gå tillbaka och
          lägga till fler senare.
        </p>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto sm:min-w-[220px] h-12 px-8 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2"
        >
          Fortsätt till uppladdning
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
