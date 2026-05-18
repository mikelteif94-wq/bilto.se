import { Search, Handshake, ArrowLeftRight, ArrowRight, Phone } from 'lucide-react';

export type BuyTrack = 'found' | 'searching' | 'trade';

interface BuyTrackStepProps {
  initialBil?: string;
  onChoose: (track: BuyTrack) => void;
  onGuidance: () => void;
}

export default function BuyTrackStep({ initialBil, onChoose, onGuidance }: BuyTrackStepProps) {
  return (
    <div className="space-y-6">
      {initialBil && (
        <div className="flex items-start gap-5">
          <div className="flex-1 min-w-0">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Din bil
            </label>
            <div className="inline-flex items-center h-10 px-4 bg-[#0e6efe]/10 text-[#0e6efe] font-semibold text-[14px] rounded-md">
              {initialBil}
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-[15px] text-slate-600 leading-[1.55]">
          V&auml;lj det som passar dig b&auml;st.
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
                Jag har hittat en bil
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">
              Vi f&ouml;rhandlar med s&auml;ljaren &aring;t dig och pressar priset.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChoose('searching')}
        className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
            <Search className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                Jag s&ouml;ker en bil
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">
              Vi hittar, kollar och f&ouml;rhandlar &aring;t dig.
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
              Vi sk&ouml;ter inbytet och hj&auml;lper dig hitta ny bil.
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
          <span>Os&auml;ker? <span className="font-semibold underline underline-offset-2">Vi ringer och guidar dig</span></span>
        </button>
      </div>
    </div>
  );
}
