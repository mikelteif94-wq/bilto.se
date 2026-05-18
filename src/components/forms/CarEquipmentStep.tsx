import { useState } from 'react';

const EQUIPMENT_OPTIONS = [
  'Dragkrok',
  'Skinnklädsel',
  'Glas-/panoramatak',
  'Navigator',
  'Backkamera',
  'Dubbla nycklar',
  'Parkeringssensorer',
  'Adaptiv farthållare',
  'Värmare / motorvärmare',
  'Elektrisk baklucka',
  'Head-up display',
  'Premium ljudsystem',
];

interface CarEquipmentStepProps {
  initialUtrustning: string[];
  onNext: (utrustning: string[]) => void;
}

export default function CarEquipmentStep({
  initialUtrustning,
  onNext,
}: CarEquipmentStepProps) {
  const [selected, setSelected] = useState<string[]>(initialUtrustning);
  const [unsure, setUnsure] = useState(false);

  const toggle = (item: string) => {
    if (unsure) return;
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(unsure ? [] : selected);
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
      <div className="pb-6 sm:pb-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Vilka tillval och utrustning har bilen?
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Frivilligt &ndash; välj det som stämmer.
        </p>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => {
            const active = !unsure && selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                disabled={unsure}
                className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                  active
                    ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                } ${unsure ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-6 sm:py-7">
        <button
          type="button"
          onClick={() => setUnsure((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 h-10 rounded-full text-[14px] font-medium transition-all ${
            unsure
              ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
              : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
          }`}
        >
          Vet ej &ndash; hoppa över
        </button>
      </div>

      <div className="pt-6 sm:pt-7 flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto sm:min-w-[200px] h-12 px-8 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] rounded-full transition shadow-sm"
        >
          Nästa
        </button>
      </div>
    </form>
  );
}
