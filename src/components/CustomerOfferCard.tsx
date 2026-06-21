import { Star, Snowflake, Shield, Truck, TrendingDown, Percent, CreditCard, Gift, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

interface Offer {
  id: string;
  car_description: string;
  original_price: number;
  negotiated_price: number;
  original_interest_rate: number | null;
  negotiated_interest_rate: number | null;
  original_monthly_cost: number | null;
  negotiated_monthly_cost: number | null;
  winter_tires_included: boolean;
  winter_tires_value: number;
  warranty_included: boolean;
  warranty_years: number;
  warranty_value: number;
  home_delivery_included: boolean;
  home_delivery_value: number;
  other_savings_description: string;
  other_savings_value: number;
  trade_in_included?: boolean;
  trade_in_reg?: string;
  trade_in_value?: number;
  total_savings: number;
  total_deal_price: number;
  deal_rating: string;
  admin_comment: string;
  sent_at: string | null;
}

const RATING_CONFIG: Record<string, { label: string; gradient: string; badge: string; badgeText: string }> = {
  good:      { label: 'Bra deal',          gradient: 'from-[#0e6efe] to-[#3d8cff]',   badge: 'bg-white/15 text-white', badgeText: 'Bra deal' },
  great:     { label: 'Mycket bra deal',   gradient: 'from-[#059669] to-[#10b981]',   badge: 'bg-white/15 text-white', badgeText: 'Mycket bra deal' },
  excellent: { label: 'Fantastisk deal',   gradient: 'from-[#d97706] to-[#f59e0b]',   badge: 'bg-white/20 text-white', badgeText: 'Fantastisk deal' },
};

export default function CustomerOfferCard({ offer }: { offer: Offer }) {
  const rating = RATING_CONFIG[offer.deal_rating] || RATING_CONFIG.good;

  const priceDiff =
    offer.original_price > 0 && offer.negotiated_price > 0
      ? offer.original_price - offer.negotiated_price
      : 0;

  const monthlyDiff =
    offer.original_monthly_cost != null && offer.negotiated_monthly_cost != null
      ? offer.original_monthly_cost - offer.negotiated_monthly_cost
      : 0;

  const rows: React.ReactNode[] = [];

  if (priceDiff > 0) {
    rows.push(
      <CompareRow
        key="price"
        icon={TrendingDown}
        label="Listpris"
        before={`${offer.original_price.toLocaleString('sv-SE')} kr`}
        after={`${offer.negotiated_price.toLocaleString('sv-SE')} kr`}
        saving={`-${priceDiff.toLocaleString('sv-SE')} kr`}
      />
    );
  }

  if (offer.original_interest_rate != null && offer.negotiated_interest_rate != null) {
    const intDiff = offer.original_interest_rate - offer.negotiated_interest_rate;
    rows.push(
      <CompareRow
        key="interest"
        icon={Percent}
        label="Ränta"
        before={`${offer.original_interest_rate}%`}
        after={`${offer.negotiated_interest_rate}%`}
        saving={intDiff > 0 ? `-${intDiff.toFixed(2).replace(/\.?0+$/, '')}%` : undefined}
      />
    );
  }

  if (offer.original_monthly_cost != null && offer.negotiated_monthly_cost != null) {
    rows.push(
      <CompareRow
        key="monthly"
        icon={CreditCard}
        label="Månadskostnad"
        before={`${offer.original_monthly_cost.toLocaleString('sv-SE')} kr/mån`}
        after={`${offer.negotiated_monthly_cost.toLocaleString('sv-SE')} kr/mån`}
        saving={monthlyDiff > 0 ? `-${monthlyDiff.toLocaleString('sv-SE')} kr/mån` : undefined}
      />
    );
  }

  if (offer.winter_tires_included) {
    rows.push(
      <IncludedRow
        key="tires"
        icon={Snowflake}
        label="Vinterdäck"
        detail={offer.winter_tires_value > 0 ? `värde ${offer.winter_tires_value.toLocaleString('sv-SE')} kr` : undefined}
        badge="Förhandlat in"
        badgeColor="emerald"
      />
    );
  }

  if (offer.warranty_included) {
    rows.push(
      <IncludedRow
        key="warranty"
        icon={Shield}
        label={`Garanti${offer.warranty_years ? ` ${offer.warranty_years} år` : ''}`}
        detail={offer.warranty_value > 0 ? `värde ${offer.warranty_value.toLocaleString('sv-SE')} kr` : undefined}
        badge="Förhandlat in"
        badgeColor="emerald"
      />
    );
  }

  if (offer.home_delivery_included) {
    rows.push(
      <IncludedRow
        key="delivery"
        icon={Truck}
        label="Hemleverans"
        detail={offer.home_delivery_value > 0 ? `värde ${offer.home_delivery_value.toLocaleString('sv-SE')} kr` : undefined}
        badge="Gratis"
        badgeColor="blue"
      />
    );
  }

  if (offer.other_savings_value > 0) {
    rows.push(
      <IncludedRow
        key="other"
        icon={Gift}
        label={offer.other_savings_description || 'Övrigt'}
        detail={`värde ${offer.other_savings_value.toLocaleString('sv-SE')} kr`}
        badge="Ingår"
        badgeColor="slate"
      />
    );
  }

  if (offer.trade_in_included) {
    rows.push(
      <IncludedRow
        key="tradein"
        icon={ArrowLeftRight}
        label={offer.trade_in_reg ? `Inbyte ${offer.trade_in_reg.toUpperCase()}` : 'Inbytesbil'}
        detail={offer.trade_in_value && offer.trade_in_value > 0 ? `värderas till ${offer.trade_in_value.toLocaleString('sv-SE')} kr` : undefined}
        badge="Inkluderat"
        badgeColor="blue"
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${rating.gradient} px-5 sm:px-6 py-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
              Ditt erbjudande
            </p>
            <h3 className="text-white text-lg sm:text-xl font-bold leading-tight">
              {offer.car_description || 'Biloffer'}
            </h3>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${rating.badge}`}>
            <Star className="w-3 h-3" />
            {rating.badgeText}
          </span>
        </div>

        {/* Hero savings snapshot */}
        {(offer.total_savings > 0 || monthlyDiff > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {offer.total_savings > 0 && (
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Du sparar totalt</p>
                <p className="text-white text-lg font-bold tabular-nums">~{offer.total_savings.toLocaleString('sv-SE')} kr</p>
              </div>
            )}
            {monthlyDiff > 0 && (
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Per månad</p>
                <p className="text-white text-lg font-bold tabular-nums">-{monthlyDiff.toLocaleString('sv-SE')} kr</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rows */}
      {rows.length > 0 && (
        <div className="px-5 sm:px-6 pt-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Vad Bilto förhandlat fram
          </p>
          <div className="divide-y divide-slate-100">
            {rows}
          </div>
        </div>
      )}

      {/* Bottom summary */}
      <div className="px-5 sm:px-6 py-5 space-y-3">

        {/* Deal price */}
        {offer.total_deal_price > 0 && (
          <div className="flex items-center justify-between py-3 border-t border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Totalt dealpris</span>
            <span className="text-xl font-bold text-slate-900">
              {offer.total_deal_price.toLocaleString('sv-SE')} kr
            </span>
          </div>
        )}

        {/* Monthly after */}
        {offer.negotiated_monthly_cost != null && offer.negotiated_monthly_cost > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Månadskostnad efter</span>
            <span className="text-base font-bold text-slate-900">
              {offer.negotiated_monthly_cost.toLocaleString('sv-SE')} kr/mån
            </span>
          </div>
        )}

        {/* Trade-in net */}
        {offer.trade_in_included && offer.trade_in_value && offer.trade_in_value > 0 && offer.total_deal_price > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-dashed border-slate-100">
            <span className="text-xs text-slate-500">Netto efter inbyte</span>
            <span className="text-sm font-bold text-[#0e6efe]">
              {Math.max(0, offer.total_deal_price - offer.trade_in_value).toLocaleString('sv-SE')} kr
            </span>
          </div>
        )}

        {/* Admin comment */}
        {offer.admin_comment && (
          <div className="mt-1 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Biltos bedömning
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {offer.admin_comment}
            </p>
          </div>
        )}

        {offer.sent_at && (
          <p className="text-xs text-slate-400 text-center pt-1">
            Skickat{' '}
            {new Date(offer.sent_at).toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function CompareRow({
  icon: Icon,
  label,
  before,
  after,
  saving,
}: {
  icon: typeof TrendingDown;
  label: string;
  before: string;
  after: string;
  saving?: string;
}) {
  return (
    <div className="py-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {saving && (
          <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-xl">
            {saving}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 pl-6">
        <span className="text-sm text-slate-400 line-through">{before}</span>
        <span className="text-slate-300 text-xs">→</span>
        <span className="text-sm font-bold text-slate-900">{after}</span>
      </div>
    </div>
  );
}

function IncludedRow({
  icon: Icon,
  label,
  detail,
  badge,
  badgeColor,
}: {
  icon: typeof Snowflake;
  label: string;
  detail?: string;
  badge: string;
  badgeColor: 'emerald' | 'blue' | 'slate';
}) {
  const badgeClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    blue:    'bg-blue-50 text-blue-700 border border-blue-100',
    slate:   'bg-slate-100 text-slate-600 border border-slate-200',
  }[badgeColor];

  return (
    <div className="py-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {detail && (
            <span className="ml-2 text-xs text-slate-400">{detail}</span>
          )}
        </div>
      </div>
      <span className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-xl ${badgeClass}`}>
        {badge}
      </span>
    </div>
  );
}
