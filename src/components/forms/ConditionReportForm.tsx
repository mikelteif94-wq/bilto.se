import { useState } from 'react';
import { Check, AlertTriangle, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';

export type ItemStatus = 'ok' | 'anmark' | 'allvarligt' | '';

export interface ConditionReport {
  mekaniskt: Record<string, ItemStatus>;
  kosmetiskt: Record<string, ItemStatus>;
  inredning: Record<string, ItemStatus>;
  historik: {
    servicehistorik: 'ja' | 'nej' | '';
    antal_nycklar: number | null;
    tidigare_skador: 'ja' | 'nej' | '';
    momsbil: 'ja' | 'nej' | '';
    antal_agare: number | null;
  };
  kommentarer: {
    mekaniskt?: string;
    kosmetiskt?: string;
    inredning?: string;
    historik?: string;
  };
}

const MEKANISKT_ITEMS = [
  { key: 'motor', label: 'Motor' },
  { key: 'vaxellada', label: 'Växellåda' },
  { key: 'bromsar', label: 'Bromsar' },
  { key: 'koppling', label: 'Koppling' },
  { key: 'kamrem', label: 'Kamrem / -kedja' },
  { key: 'varningslampor', label: 'Inga varningslampor' },
];

const KOSMETISKT_ITEMS = [
  { key: 'lack', label: 'Lack' },
  { key: 'repor', label: 'Repor' },
  { key: 'bucklor', label: 'Bucklor' },
  { key: 'rost', label: 'Rost' },
  { key: 'stenskott', label: 'Stenskott' },
  { key: 'falgar', label: 'Fälgar / däck' },
];

const INREDNING_ITEMS = [
  { key: 'sate', label: 'Säten' },
  { key: 'klädsel', label: 'Klädsel' },
  { key: 'ratt', label: 'Ratt' },
  { key: 'infotainment', label: 'Skärm / infotainment' },
  { key: 'ac', label: 'AC / klimat' },
  { key: 'lukt', label: 'Lukt' },
];

export const EMPTY_CONDITION_REPORT: ConditionReport = {
  mekaniskt: {},
  kosmetiskt: {},
  inredning: {},
  historik: {
    servicehistorik: '',
    antal_nycklar: null,
    tidigare_skador: '',
    momsbil: '',
    antal_agare: null,
  },
  kommentarer: {},
};

interface ConditionReportFormProps {
  value: ConditionReport;
  onChange: (next: ConditionReport) => void;
  collapsible?: boolean;
  readOnly?: boolean;
  /** When true each sub-section (Mekaniskt, Kosmetiskt, Inredning) is individually collapsible */
  collapsibleSections?: boolean;
}

export default function ConditionReportForm({
  value,
  onChange,
  collapsible = false,
  readOnly = false,
  collapsibleSections = false,
}: ConditionReportFormProps) {
  const [open, setOpen] = useState(!collapsible);

  const update = (patch: Partial<ConditionReport>) => { if (!readOnly) onChange({ ...value, ...patch }); };

  return (
    <div className="space-y-4">
      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <span>Strukturerad skickrapport (frivillig)</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}

      {open && (
        <div className={`space-y-3 ${readOnly ? 'pointer-events-none select-none opacity-90' : ''}`}>
          <Section
            title="Mekaniskt"
            items={MEKANISKT_ITEMS}
            statuses={value.mekaniskt}
            onSet={(k, s) => update({ mekaniskt: { ...value.mekaniskt, [k]: s } })}
            kommentar={value.kommentarer.mekaniskt ?? ''}
            onKommentar={(t) => update({ kommentarer: { ...value.kommentarer, mekaniskt: t } })}
            collapsible={collapsibleSections}
          />
          <Section
            title="Kosmetiskt"
            items={KOSMETISKT_ITEMS}
            statuses={value.kosmetiskt}
            onSet={(k, s) => update({ kosmetiskt: { ...value.kosmetiskt, [k]: s } })}
            kommentar={value.kommentarer.kosmetiskt ?? ''}
            onKommentar={(t) => update({ kommentarer: { ...value.kommentarer, kosmetiskt: t } })}
            collapsible={collapsibleSections}
          />
          <Section
            title="Inredning"
            items={INREDNING_ITEMS}
            statuses={value.inredning}
            onSet={(k, s) => update({ inredning: { ...value.inredning, [k]: s } })}
            kommentar={value.kommentarer.inredning ?? ''}
            onKommentar={(t) => update({ kommentarer: { ...value.kommentarer, inredning: t } })}
            collapsible={collapsibleSections}
          />

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex-1">Historik</h3>
            </div>
            <div className="px-4 sm:px-5 pb-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-3">
                <YesNo
                  label="Servicehistorik finns"
                  value={value.historik.servicehistorik}
                  onChange={(v) => update({ historik: { ...value.historik, servicehistorik: v } })}
                />
                <YesNo
                  label="Tidigare skador"
                  value={value.historik.tidigare_skador}
                  onChange={(v) => update({ historik: { ...value.historik, tidigare_skador: v } })}
                />
                <YesNo
                  label="Momsbil"
                  value={value.historik.momsbil}
                  onChange={(v) => update({ historik: { ...value.historik, momsbil: v } })}
                />
                <NumberField
                  label="Antal nycklar"
                  value={value.historik.antal_nycklar}
                  onChange={(n) => update({ historik: { ...value.historik, antal_nycklar: n } })}
                />
                <NumberField
                  label="Antal tidigare ägare"
                  value={value.historik.antal_agare}
                  onChange={(n) => update({ historik: { ...value.historik, antal_agare: n } })}
                />
              </div>
              <textarea
                value={value.kommentarer.historik ?? ''}
                onChange={(e) => update({ kommentarer: { ...value.kommentarer, historik: e.target.value } })}
                placeholder="Övrig historik – servicebok, ev. olyckor, tidigare användning"
                rows={2}
                className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  statuses,
  onSet,
  kommentar,
  onKommentar,
  collapsible = false,
}: {
  title: string;
  items: { key: string; label: string }[];
  statuses: Record<string, ItemStatus>;
  onSet: (key: string, s: ItemStatus) => void;
  kommentar: string;
  onKommentar: (s: string) => void;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const flags = items.map((it) => statuses[it.key] ?? '');
  const issues = flags.filter((f) => f === 'anmark' || f === 'allvarligt').length;
  const serious = flags.filter((f) => f === 'allvarligt').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setExpanded((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left ${collapsible ? 'hover:bg-slate-50 transition' : 'cursor-default'}`}
      >
        <h3 className="text-sm font-bold text-slate-900 flex-1">{title}</h3>
        {/* Summary badges when collapsed */}
        {collapsible && !expanded && (
          <div className="flex items-center gap-1.5">
            {serious > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold">
                <AlertOctagon className="w-3 h-3" />{serious}
              </span>
            )}
            {issues - serious > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                <AlertTriangle className="w-3 h-3" />{issues - serious}
              </span>
            )}
            {issues === 0 && flags.some((f) => f === 'ok') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                <Check className="w-3 h-3" />OK
              </span>
            )}
          </div>
        )}
        {collapsible && (
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 sm:px-5 pb-4">
          <ul className="divide-y divide-slate-100">
            {items.map((it) => (
              <li key={it.key} className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-800">{it.label}</span>
                <StatusButtons
                  value={statuses[it.key] ?? ''}
                  onChange={(s) => onSet(it.key, s)}
                />
              </li>
            ))}
          </ul>
          <textarea
            value={kommentar}
            onChange={(e) => onKommentar(e.target.value)}
            placeholder={`Kommentar om ${title.toLowerCase()} (frivillig)`}
            rows={2}
            className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
          />
        </div>
      )}
    </div>
  );
}

function StatusButtons({
  value,
  onChange,
}: {
  value: ItemStatus;
  onChange: (s: ItemStatus) => void;
}) {
  const opts: { val: ItemStatus; icon: React.ReactNode; label: string; cls: string }[] = [
    {
      val: 'ok',
      icon: <Check className="w-3.5 h-3.5" />,
      label: 'OK',
      cls: 'bg-emerald-600 text-white border-emerald-600',
    },
    {
      val: 'anmark',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Anmärkning',
      cls: 'bg-amber-500 text-white border-amber-500',
    },
    {
      val: 'allvarligt',
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
      label: 'Allvarligt',
      cls: 'bg-red-600 text-white border-red-600',
    },
  ];
  return (
    <div className="flex gap-1.5">
      {opts.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={o.val}
            type="button"
            onClick={() => onChange(active ? '' : o.val)}
            className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[11px] font-semibold transition ${
              active
                ? o.cls
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
            aria-pressed={active}
            title={o.label}
          >
            {o.icon}
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 'ja' | 'nej' | '';
  onChange: (v: 'ja' | 'nej' | '') => void;
}) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-600 block mb-1.5">{label}</span>
      <div className="flex gap-1.5">
        {(['ja', 'nej'] as const).map((v) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(active ? '' : v)}
              className={`h-9 px-4 rounded-full border text-xs font-semibold capitalize transition ${
                active
                  ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-600 block mb-1.5">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Math.max(0, Number(v)));
        }}
        className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
      />
    </div>
  );
}

export function isConditionReportFilled(r: ConditionReport | null | undefined): boolean {
  if (!r) return false;
  const sections = [r.mekaniskt, r.kosmetiskt, r.inredning];
  const anyStatus = sections.some((sec) => sec && Object.values(sec).some((v) => v && v !== ''));
  const anyHistory =
    !!r.historik &&
    (r.historik.servicehistorik !== '' ||
      r.historik.tidigare_skador !== '' ||
      r.historik.momsbil !== '' ||
      r.historik.antal_nycklar != null ||
      r.historik.antal_agare != null);
  return anyStatus || anyHistory;
}
