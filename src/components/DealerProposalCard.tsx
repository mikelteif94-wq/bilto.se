import { TrendingDown, TrendingUp, Shield, Snowflake, MessageCircle, Building2 } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { formatKr } from '../lib/dealer-utils';

type Proposal = Database['public']['Tables']['dealer_proposals']['Row'];

interface DealerProposalCardProps {
  proposal: Proposal;
}

const DEAL_TYPE_LABELS: Record<string, { title: string; desc: string }> = {
  lagre_manadskostnad: {
    title: 'Lägre månadskostnad',
    desc: 'Samma bilklass — billigare per månad',
  },
  battre_bil_samma_kostnad: {
    title: 'Bättre bil, samma kostnad',
    desc: 'Uppgradera utan ökad utgift',
  },
  premium_byte: {
    title: 'Premium-byte',
    desc: 'Bättre bil, något dyrare',
  },
  snabb_affar: {
    title: 'Snabb affär',
    desc: 'Snabb och smidig bilaffär',
  },
};

const DACK_LABELS: Record<string, string> = {
  helarsdack: 'Helårsdäck',
  vinterdack: 'Vinterdäck',
  sommardack: 'Sommardäck',
  ingen: '',
};

const SKICK_LABELS: Record<string, string> = {
  mycket_bra: 'Mycket bra',
  bra: 'Bra',
  okej: 'Okej',
  ok: 'OK',
  slitet: 'Slitet',
  skadat: 'Skadat',
  utmärkt: 'Utmärkt',
};

export default function DealerProposalCard({ proposal: p }: DealerProposalCardProps) {
  const maandDiff = p.manadskostnad - p.kund_nuvarande_manad;
  const kundFarOver = p.inbytespris - p.kund_lanerest;
  const totalFordel =
    p.kund_nuvarande_manad > 0 ? -maandDiff * p.loptid_manader : null;
  const rantaDiff = p.ranta - Number(p.kund_nuvarande_ranta);
  const dealType = DEAL_TYPE_LABELS[p.dealtyp];
  const bildUrls = Array.isArray(p.erbjuden_bild_urls) ? p.erbjuden_bild_urls : [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Dealer + deal-type header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{p.dealer_name}</p>
            {dealType && (
              <p className="text-xs text-slate-500">{dealType.desc}</p>
            )}
          </div>
        </div>
        {dealType && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {dealType.title}
          </span>
        )}
      </div>

      {/* Car images */}
      {bildUrls.length > 0 && (
        <div className="relative">
          <img
            src={bildUrls[0]}
            alt={`${p.erbjuden_marke} ${p.erbjuden_modell}`}
            className="w-full h-48 object-cover"
          />
          {bildUrls.length > 1 && (
            <div className="absolute bottom-2 right-3 flex gap-1">
              {bildUrls.slice(1, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-14 h-10 object-cover rounded-md border-2 border-white shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Car info */}
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-lg font-bold text-slate-900">
          {[p.erbjuden_marke, p.erbjuden_modell].filter(Boolean).join(' ')}
          {p.erbjuden_ar ? ` ${p.erbjuden_ar}` : ''}
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          {p.erbjuden_miltal ? `${p.erbjuden_miltal.toLocaleString('sv-SE')} mil` : ''}
          {p.erbjuden_miltal && p.erbjuden_skick ? ' · ' : ''}
          {p.erbjuden_skick ? (SKICK_LABELS[p.erbjuden_skick] ?? p.erbjuden_skick) : ''}
          {(p.erbjuden_miltal || p.erbjuden_skick) && p.erbjuden_dack && p.erbjuden_dack !== 'ingen' ? ' · ' : ''}
          {p.erbjuden_dack && p.erbjuden_dack !== 'ingen' ? (DACK_LABELS[p.erbjuden_dack] ?? p.erbjuden_dack) : ''}
        </p>
      </div>

      {/* Financial summary */}
      <div className="px-5 py-4 space-y-2.5">
        <Row
          label="Handlaren ger för din bil"
          value={`${formatKr(p.inbytespris)} kr`}
          valueClass="text-slate-900 font-semibold"
        />
        {p.kund_lanerest > 0 && (
          <Row
            label="Du får över efter lånelösen"
            value={`${formatKr(kundFarOver)} kr`}
            valueClass={kundFarOver >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}
            icon={kundFarOver >= 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
          />
        )}

        <div className="h-px bg-slate-100 my-1" />

        <Row
          label="Din nya månadskostnad"
          value={`${formatKr(p.manadskostnad)} kr/mån`}
          valueClass="text-slate-900 font-semibold"
        />
        {p.kund_nuvarande_manad > 0 && (
          <Row
            label="Din nuvarande"
            value={`${formatKr(p.kund_nuvarande_manad)} kr/mån`}
            valueClass="text-slate-500"
          />
        )}
        {p.kund_nuvarande_manad > 0 && (
          <Row
            label="Skillnad"
            value={`${maandDiff <= 0 ? '' : '+'}${formatKr(maandDiff)} kr/mån`}
            valueClass={maandDiff <= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}
            icon={maandDiff <= 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
          />
        )}
        {Number(p.kund_nuvarande_ranta) > 0 && (
          <Row
            label="Ränta"
            value={`${p.ranta}% (vs ${p.kund_nuvarande_ranta}%)`}
            valueClass={rantaDiff <= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}
          />
        )}
      </div>

      {/* Extras */}
      {(p.garanti_ar > 0 || p.vinterdack_inkl) && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {p.garanti_ar > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Shield className="w-3.5 h-3.5" />
              {p.garanti_ar} års garanti
            </span>
          )}
          {p.vinterdack_inkl && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
              <Snowflake className="w-3.5 h-3.5" />
              Vinterdäck inkl.
            </span>
          )}
        </div>
      )}

      {/* Personal message */}
      {p.personligt_meddelande && (
        <div className="mx-5 mb-4 p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex gap-2.5">
          <MessageCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 italic">"{p.personligt_meddelande}"</p>
        </div>
      )}

      {/* Money shot */}
      {totalFordel !== null && (
        <div className="mx-5 mb-5 p-4 rounded-xl bg-slate-900 text-white">
          <p className="text-xs text-slate-400 mb-1">Total fördel över {p.loptid_manader} månader</p>
          <div className="flex items-center gap-2">
            {totalFordel > 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-2xl font-bold tabular-nums ${totalFordel > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalFordel > 0 ? '−' : '+'}{formatKr(Math.abs(totalFordel))} kr
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-slate-900',
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`flex items-center gap-1.5 ${valueClass}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
