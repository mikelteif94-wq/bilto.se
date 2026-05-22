import { useState } from 'react';
import { Search, Handshake, ArrowLeftRight, ArrowRight, Phone, HelpCircle, CheckSquare } from 'lucide-react';

export type BuyTrack = 'found' | 'searching' | 'know' | 'explore' | 'trade';

interface BuyTrackStepProps {
  initialBil?: string;
  onChoose: (track: BuyTrack) => void;
  onGuidance: () => void;
}

type MainChoice = 'found' | 'searching' | 'trade' | null;

export default function BuyTrackStep({ initialBil, onChoose, onGuidance }: BuyTrackStepProps) {
  const [mainChoice, setMainChoice] = useState<MainChoice>(null);

  if (mainChoice === 'searching') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 mb-1">
            Vet du vilken bil du vill ha?
          </h2>
          <p className="text-[14.5px] text-slate-500 leading-[1.55]">
            Det hjälper oss anpassa frågorna efter dig.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChoose('know')}
          className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
              <CheckSquare className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                  Ja, jag vet vilken modell
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[14px] text-slate-500 leading-[1.55] mt-1">
                Märke, modell och ungefär vad du kan lägga.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChoose('explore')}
          className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
              <HelpCircle className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                  Nej, jag är inte säker
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[14px] text-slate-500 leading-[1.55] mt-1">
                Berätta vad som är viktigt för dig — vi hittar rätt bil.
              </p>
            </div>
          </div>
        </button>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setMainChoice(null)}
            className="text-[13.5px] text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-2"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[15px] text-slate-600 leading-[1.55]">
          Välj det som passar dig bäst.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChoose('found')}
        className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
            <Handshake className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                {initialBil ? `Jag har hittat en ${initialBil}` : 'Jag har hittat en bil'}
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">
              Vi förhandlar med säljaren åt dig och pressar priset.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => setMainChoice('searching')}
        className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
            <Search className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                {initialBil ? `Jag letar efter en ${initialBil}` : 'Jag söker en bil'}
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">
              Vi hittar, kollar och förhandlar åt dig.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChoose('trade')}
        className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
            <ArrowLeftRight className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                Jag vill byta in
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">
              Vi sköter inbytet och hjälper dig hitta ny bil.
            </p>
          </div>
        </div>
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={onGuidance}
          className="w-full flex items-center justify-center gap-2 text-[14px] text-slate-600 hover:text-[#0e6efe] transition-colors py-2"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          <span>Osäker? <span className="font-semibold underline underline-offset-2">Vi ringer och guidar dig</span></span>
        </button>
      </div>
    </div>
  );
}
