import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Save,
  Send,
  Check,
  Snowflake,
  Shield,
  Truck,
  Plus,
  TrendingDown,
  Percent,
  CreditCard,
  Star,
  ArrowLeftRight,
  Calculator,
  Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminOfferEditorProps {
  offerId?: string;
  quoteRequestId?: string;
  onBack: () => void;
  onSaved?: (id: string) => void;
}

interface OfferData {
  quote_request_id: string;
  customer_email: string;
  customer_name: string;
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
  total_savings: number;
  total_deal_price: number;
  deal_rating: 'good' | 'great' | 'excellent';
  admin_comment: string;
  status: string;
  trade_in_included: boolean;
  trade_in_reg: string;
  trade_in_value: number;
  _access_token?: string;
}

const RATING_OPTIONS = [
  { value: 'good', label: 'Bra deal', color: 'bg-blue-100 text-blue-700' },
  { value: 'great', label: 'Mycket bra deal', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'excellent', label: 'Fantastisk deal', color: 'bg-amber-100 text-amber-700' },
];

const emptyOffer: OfferData = {
  quote_request_id: '',
  customer_email: '',
  customer_name: '',
  car_description: '',
  original_price: 0,
  negotiated_price: 0,
  original_interest_rate: null,
  negotiated_interest_rate: null,
  original_monthly_cost: null,
  negotiated_monthly_cost: null,
  winter_tires_included: false,
  winter_tires_value: 0,
  warranty_included: false,
  warranty_years: 0,
  warranty_value: 0,
  home_delivery_included: false,
  home_delivery_value: 0,
  other_savings_description: '',
  other_savings_value: 0,
  total_savings: 0,
  total_deal_price: 0,
  deal_rating: 'good',
  admin_comment: '',
  status: 'draft',
  trade_in_included: false,
  trade_in_reg: '',
  trade_in_value: 0,
};

export default function AdminOfferEditor({
  offerId,
  quoteRequestId,
  onBack,
  onSaved,
}: AdminOfferEditorProps) {
  const [loading, setLoading] = useState(!!offerId);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<OfferData>(emptyOffer);

  useEffect(() => {
    if (offerId) {
      loadOffer(offerId);
    } else if (quoteRequestId) {
      loadQuoteInfo(quoteRequestId);
    }
  }, [offerId, quoteRequestId]);

  const loadOffer = async (id: string) => {
    const { data: offer } = await supabase
      .from('car_offers' as never)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    const o = offer as Record<string, unknown> | null;
    if (o) {
      setData({
        quote_request_id: (o.quote_request_id as string) || '',
        customer_email: o.customer_email as string,
        customer_name: o.customer_name as string,
        car_description: o.car_description as string,
        original_price: o.original_price as number,
        negotiated_price: o.negotiated_price as number,
        original_interest_rate: o.original_interest_rate as number | null,
        negotiated_interest_rate: o.negotiated_interest_rate as number | null,
        original_monthly_cost: o.original_monthly_cost as number | null,
        negotiated_monthly_cost: o.negotiated_monthly_cost as number | null,
        winter_tires_included: o.winter_tires_included as boolean,
        winter_tires_value: o.winter_tires_value as number,
        warranty_included: o.warranty_included as boolean,
        warranty_years: o.warranty_years as number,
        warranty_value: o.warranty_value as number,
        home_delivery_included: o.home_delivery_included as boolean,
        home_delivery_value: o.home_delivery_value as number,
        other_savings_description: o.other_savings_description as string,
        other_savings_value: o.other_savings_value as number,
        total_savings: o.total_savings as number,
        total_deal_price: o.total_deal_price as number,
        deal_rating: o.deal_rating as OfferData['deal_rating'],
        admin_comment: o.admin_comment as string,
        status: o.status as string,
        trade_in_included: (o.trade_in_included as boolean) || false,
        trade_in_reg: (o.trade_in_reg as string) || '',
        trade_in_value: (o.trade_in_value as number) || 0,
        _access_token: '',
      });
      // Fetch access_token for the linked quote_request
      if (o.quote_request_id) {
        const { data: qr } = await supabase
          .from('quote_requests' as never)
          .select('access_token')
          .eq('id', o.quote_request_id as string)
          .maybeSingle();
        const qrRow = qr as { access_token?: string } | null;
        if (qrRow?.access_token) {
          setData((d) => ({ ...d, _access_token: qrRow.access_token! }));
        }
      }
    }
    setLoading(false);
  };

  const loadQuoteInfo = async (qId: string) => {
    const { data: q } = await supabase
      .from('quote_requests' as never)
      .select('id, firstname, lastname, email, car_model, access_token, has_trade_in, trade_in_reg')
      .eq('id', qId)
      .maybeSingle();
    const row = q as Record<string, unknown> | null;
    if (row) {
      const hasTradeIn = !!(row.has_trade_in as boolean);
      const tradeInReg = (row.trade_in_reg as string) || '';
      setData((d) => ({
        ...d,
        quote_request_id: row.id as string,
        customer_email: (row.email as string) || '',
        customer_name: `${row.firstname} ${row.lastname}`.trim(),
        car_description: (row.car_model as string) || '',
        _access_token: (row.access_token as string) || '',
        // Pre-fill trade-in from quote if not already set on the offer
        ...(hasTradeIn && !d.trade_in_included ? {
          trade_in_included: true,
          trade_in_reg: tradeInReg,
        } : {}),
      }));
    }
  };

  const calcTotalSavingsFromData = (d: OfferData): number => {
    let savings = 0;
    if (d.original_price > 0 && d.negotiated_price > 0) {
      savings += d.original_price - d.negotiated_price;
    }
    if (d.winter_tires_included) savings += d.winter_tires_value;
    if (d.warranty_included) savings += d.warranty_value;
    if (d.home_delivery_included) savings += d.home_delivery_value;
    savings += d.other_savings_value;
    // Trade-in is NOT a saving — it's a separate value transfer shown in the net price
    return savings;
  };

  const updateAndCalc = (partial: Partial<OfferData>) => {
    setData((d) => {
      const next = { ...d, ...partial };
      next.total_savings = calcTotalSavingsFromData(next);
      // Auto-fill total_deal_price from negotiated_price minus trade-in
      // only when it hasn't been manually overridden (still zero or unchanged from auto value)
      if (next.negotiated_price > 0) {
        const autoPrice = Math.max(0, next.negotiated_price - (next.trade_in_included ? next.trade_in_value : 0));
        if (next.total_deal_price === 0 || next.total_deal_price === Math.max(0, d.negotiated_price - (d.trade_in_included ? d.trade_in_value : 0))) {
          next.total_deal_price = autoPrice;
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const payload = {
      ...data,
      total_savings: calcTotalSavingsFromData(data),
      updated_at: new Date().toISOString(),
    };

    if (offerId) {
      await supabase.from('car_offers' as never).update(payload as never).eq('id', offerId);
    } else {
      const { data: inserted } = await supabase
        .from('car_offers' as never)
        .insert(payload as never)
        .select('id')
        .maybeSingle();
      const row = inserted as { id: string } | null;
      if (row) onSaved?.(row.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSend = async () => {
    setSending(true);
    const totalSavings = calcTotalSavingsFromData(data);
    const payload = {
      ...data,
      total_savings: totalSavings,
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let id = offerId;
    if (offerId) {
      await supabase.from('car_offers' as never).update(payload as never).eq('id', offerId);
    } else {
      const { data: inserted } = await supabase
        .from('car_offers' as never)
        .insert(payload as never)
        .select('id')
        .maybeSingle();
      const row = inserted as { id: string } | null;
      id = row?.id;
    }

    if (id) {
      try {
        // Fetch access_token from quote_request if not already loaded
        let accessToken = data._access_token || '';
        if (!accessToken && data.quote_request_id) {
          const { data: qr } = await supabase
            .from('quote_requests' as never)
            .select('access_token')
            .eq('id', data.quote_request_id)
            .maybeSingle();
          const qrRow = qr as { access_token?: string } | null;
          accessToken = qrRow?.access_token || '';
        }
        const portalUrl = accessToken
          ? `https://bilto.se/min-forfragan/${accessToken}`
          : '';
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-car-offer`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ offer_id: id, portal_url: portalUrl }),
        });
      } catch {
        // best effort
      }
      onSaved?.(id);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalSavings = calcTotalSavingsFromData(data);
  const priceDiff =
    data.original_price > 0 && data.negotiated_price > 0
      ? data.original_price - data.negotiated_price
      : 0;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saved ? 'Sparat' : 'Spara utkast'}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !data.customer_email}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-300 text-white text-sm font-semibold transition"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Skicka till kund
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          {offerId ? 'Redigera erbjudande' : 'Skapa erbjudande'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Customer & car info */}
            <Section title="Kund & bil">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Kundnamn">
                  <input
                    type="text"
                    value={data.customer_name}
                    onChange={(e) => updateAndCalc({ customer_name: e.target.value })}
                    className={inputClass}
                    placeholder="Anna Andersson"
                  />
                </FormField>
                <FormField label="E-post">
                  <input
                    type="email"
                    value={data.customer_email}
                    onChange={(e) => updateAndCalc({ customer_email: e.target.value })}
                    className={inputClass}
                    placeholder="anna@exempel.se"
                  />
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label="Bil (beskrivning)">
                  <input
                    type="text"
                    value={data.car_description}
                    onChange={(e) => updateAndCalc({ car_description: e.target.value })}
                    className={inputClass}
                    placeholder="t.ex. Volvo XC60 T6 2022"
                  />
                </FormField>
              </div>
            </Section>

            {/* Price negotiation */}
            <Section title="Pris" icon={TrendingDown}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Ursprungspris (kr)">
                  <input
                    type="number"
                    value={data.original_price || ''}
                    onChange={(e) =>
                      updateAndCalc({ original_price: parseInt(e.target.value) || 0 })
                    }
                    className={inputClass}
                    placeholder="399 000"
                  />
                </FormField>
                <FormField label="Förhandlat pris (kr)">
                  <input
                    type="number"
                    value={data.negotiated_price || ''}
                    onChange={(e) =>
                      updateAndCalc({ negotiated_price: parseInt(e.target.value) || 0 })
                    }
                    className={inputClass}
                    placeholder="385 000"
                  />
                </FormField>
              </div>
              {priceDiff > 0 && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                  Prisrabatt: {priceDiff.toLocaleString('sv-SE')} kr
                </div>
              )}
            </Section>

            {/* Interest rate */}
            <Section title="Ränta" icon={Percent}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Ursprungsränta (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={data.original_interest_rate ?? ''}
                    onChange={(e) =>
                      updateAndCalc({
                        original_interest_rate: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className={inputClass}
                    placeholder="5.9"
                  />
                </FormField>
                <FormField label="Förhandlad ränta (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={data.negotiated_interest_rate ?? ''}
                    onChange={(e) =>
                      updateAndCalc({
                        negotiated_interest_rate: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    className={inputClass}
                    placeholder="3.2"
                  />
                </FormField>
              </div>
            </Section>

            {/* Monthly cost */}
            <Section title="Månadskostnad" icon={CreditCard}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Månadskostnad före (kr)">
                  <input
                    type="number"
                    value={data.original_monthly_cost ?? ''}
                    onChange={(e) =>
                      updateAndCalc({
                        original_monthly_cost: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className={inputClass}
                    placeholder="5 400"
                  />
                </FormField>
                <FormField label="Månadskostnad efter (kr)">
                  <input
                    type="number"
                    value={data.negotiated_monthly_cost ?? ''}
                    onChange={(e) =>
                      updateAndCalc({
                        negotiated_monthly_cost: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className={inputClass}
                    placeholder="4 200"
                  />
                </FormField>
              </div>
            </Section>

            {/* Extras */}
            <Section title="Förhandlade tillval">
              <div className="space-y-4">
                {/* Winter tires */}
                <ToggleRow
                  icon={Snowflake}
                  label="Vinterdäck"
                  checked={data.winter_tires_included}
                  onToggle={(v) => updateAndCalc({ winter_tires_included: v })}
                >
                  <FormField label="Värde (kr)">
                    <input
                      type="number"
                      value={data.winter_tires_value || ''}
                      onChange={(e) =>
                        updateAndCalc({ winter_tires_value: parseInt(e.target.value) || 0 })
                      }
                      className={inputClass}
                      placeholder="14 900"
                    />
                  </FormField>
                </ToggleRow>

                {/* Warranty */}
                <ToggleRow
                  icon={Shield}
                  label="Garanti"
                  checked={data.warranty_included}
                  onToggle={(v) => updateAndCalc({ warranty_included: v })}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Antal år">
                      <input
                        type="number"
                        value={data.warranty_years || ''}
                        onChange={(e) =>
                          updateAndCalc({ warranty_years: parseInt(e.target.value) || 0 })
                        }
                        className={inputClass}
                        placeholder="2"
                      />
                    </FormField>
                    <FormField label="Värde (kr)">
                      <input
                        type="number"
                        value={data.warranty_value || ''}
                        onChange={(e) =>
                          updateAndCalc({ warranty_value: parseInt(e.target.value) || 0 })
                        }
                        className={inputClass}
                        placeholder="7 000"
                      />
                    </FormField>
                  </div>
                </ToggleRow>

                {/* Home delivery */}
                <ToggleRow
                  icon={Truck}
                  label="Hemleverans"
                  checked={data.home_delivery_included}
                  onToggle={(v) => updateAndCalc({ home_delivery_included: v })}
                >
                  <FormField label="Värde (kr)">
                    <input
                      type="number"
                      value={data.home_delivery_value || ''}
                      onChange={(e) =>
                        updateAndCalc({ home_delivery_value: parseInt(e.target.value) || 0 })
                      }
                      className={inputClass}
                      placeholder="4 000"
                    />
                  </FormField>
                </ToggleRow>

                {/* Other */}
                <ToggleRow
                  icon={Plus}
                  label="Övrigt"
                  checked={data.other_savings_value > 0 || !!data.other_savings_description}
                  onToggle={() => {}}
                  alwaysOpen
                >
                  <FormField label="Beskrivning">
                    <input
                      type="text"
                      value={data.other_savings_description}
                      onChange={(e) =>
                        updateAndCalc({ other_savings_description: e.target.value })
                      }
                      className={inputClass}
                      placeholder="t.ex. Gratis service, mattpaket..."
                    />
                  </FormField>
                  <div className="mt-3">
                    <FormField label="Värde (kr)">
                      <input
                        type="number"
                        value={data.other_savings_value || ''}
                        onChange={(e) =>
                          updateAndCalc({ other_savings_value: parseInt(e.target.value) || 0 })
                        }
                        className={inputClass}
                        placeholder="0"
                      />
                    </FormField>
                  </div>
                </ToggleRow>
              </div>
            </Section>

            {/* Trade-in */}
            <Section title="Inbytesbil" icon={ArrowLeftRight}>
              <ToggleRow
                icon={ArrowLeftRight}
                label="Inbyte ingår i erbjudandet"
                checked={data.trade_in_included}
                onToggle={(v) => updateAndCalc({ trade_in_included: v })}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Regnummer">
                    <input
                      type="text"
                      value={data.trade_in_reg}
                      onChange={(e) => updateAndCalc({ trade_in_reg: e.target.value })}
                      className={inputClass}
                      placeholder="ABC123"
                    />
                  </FormField>
                  <FormField label="Värdering (kr)">
                    <input
                      type="number"
                      value={data.trade_in_value || ''}
                      onChange={(e) =>
                        updateAndCalc({ trade_in_value: parseInt(e.target.value) || 0 })
                      }
                      className={inputClass}
                      placeholder="85 000"
                    />
                  </FormField>
                </div>
              </ToggleRow>
            </Section>

            {/* Deal summary */}
            <Section title="Totalt & bedömning" icon={Star}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Totalt dealpris (kr)">
                  <input
                    type="number"
                    value={data.total_deal_price || ''}
                    onChange={(e) =>
                      updateAndCalc({ total_deal_price: parseInt(e.target.value) || 0 })
                    }
                    className={inputClass}
                    placeholder="385 000"
                  />
                </FormField>
                <FormField label="Vår bedömning">
                  <select
                    value={data.deal_rating}
                    onChange={(e) =>
                      updateAndCalc({ deal_rating: e.target.value as OfferData['deal_rating'] })
                    }
                    className={inputClass}
                  >
                    {RATING_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label="Kommentar till kund">
                  <textarea
                    value={data.admin_comment}
                    onChange={(e) => updateAndCalc({ admin_comment: e.target.value })}
                    rows={3}
                    className={inputClass + ' resize-none'}
                    placeholder="Vi tycker det här är en bra affär för dig eftersom..."
                  />
                </FormField>
              </div>
            </Section>
          </div>

          {/* Sidebar — live deal calculator */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-20">
              {/* Header */}
              <div className="bg-slate-900 px-5 py-4 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-white/70 shrink-0" />
                <h3 className="text-sm font-bold text-white">Dealsammanfattning</h3>
                {data.car_description && (
                  <span className="ml-auto text-xs text-slate-400 truncate max-w-[120px]">{data.car_description}</span>
                )}
              </div>

              <div className="p-5 space-y-4">

                {/* Price block */}
                {data.negotiated_price > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pris</p>
                    {data.original_price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 line-through">{data.original_price.toLocaleString('sv-SE')} kr</span>
                        {priceDiff > 0 && (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            -{priceDiff.toLocaleString('sv-SE')} kr
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-slate-900">Förhandlat pris</span>
                      <span className="text-sm font-bold text-slate-900">{data.negotiated_price.toLocaleString('sv-SE')} kr</span>
                    </div>
                  </div>
                )}

                {/* Trade-in block */}
                {data.trade_in_included && data.trade_in_value > 0 && (
                  <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inbyte</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{data.trade_in_reg ? `Inbyte ${data.trade_in_reg}` : 'Inbytesbil'}</span>
                      <span className="font-semibold text-emerald-600">−{data.trade_in_value.toLocaleString('sv-SE')} kr</span>
                    </div>
                    {data.negotiated_price > 0 && (
                      <div className="flex justify-between mt-1 pt-1.5 border-t border-slate-100">
                        <span className="text-sm font-bold text-slate-900">Kunden betalar netto</span>
                        <span className="text-sm font-bold text-[#0e6efe]">
                          {Math.max(0, data.negotiated_price - data.trade_in_value).toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Negotiated extras */}
                {(data.winter_tires_included || data.warranty_included || data.home_delivery_included || data.other_savings_value > 0) && (
                  <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Förhandlade tillval</p>
                    {data.winter_tires_included && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Vinterdäck</span>
                        <span className="font-semibold text-emerald-600">+{data.winter_tires_value.toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                    {data.warranty_included && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Garanti{data.warranty_years > 0 ? ` ${data.warranty_years} år` : ''}</span>
                        <span className="font-semibold text-emerald-600">+{data.warranty_value.toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                    {data.home_delivery_included && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Hemleverans</span>
                        <span className="font-semibold text-emerald-600">+{data.home_delivery_value.toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                    {data.other_savings_value > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{data.other_savings_description || 'Övrigt'}</span>
                        <span className="font-semibold text-emerald-600">+{data.other_savings_value.toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Interest + monthly */}
                {(data.original_interest_rate != null || data.original_monthly_cost != null) && (
                  <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finansiering</p>
                    {data.original_interest_rate != null && data.negotiated_interest_rate != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Ränta</span>
                        <span className="font-semibold text-emerald-600">
                          {data.original_interest_rate}% → {data.negotiated_interest_rate}%
                        </span>
                      </div>
                    )}
                    {data.original_monthly_cost != null && data.negotiated_monthly_cost != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Månadskostnad</span>
                        <span className="font-semibold text-emerald-600">
                          {data.original_monthly_cost.toLocaleString('sv-SE')} → {data.negotiated_monthly_cost.toLocaleString('sv-SE')} kr/mån
                        </span>
                      </div>
                    )}
                    {data.original_monthly_cost != null && data.negotiated_monthly_cost != null &&
                      data.original_monthly_cost > data.negotiated_monthly_cost && (
                        <div className="flex justify-between text-sm bg-emerald-50 rounded-lg px-2.5 py-1.5">
                          <span className="text-emerald-700 font-semibold">Besparing/mån</span>
                          <span className="font-bold text-emerald-700">
                            {(data.original_monthly_cost - data.negotiated_monthly_cost).toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                      )}
                  </div>
                )}

                {/* Total savings box */}
                {totalSavings > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="rounded-xl bg-[#0e6efe]/5 border border-[#0e6efe]/15 px-4 py-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-[#0e6efe] uppercase tracking-wide">Total förhandlingsvinst</span>
                        <span className="text-xl font-bold text-[#0e6efe]">
                          {totalSavings.toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                      {data.trade_in_included && data.trade_in_value > 0 && (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />
                          Exkl. inbytesvärdet ({data.trade_in_value.toLocaleString('sv-SE')} kr)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating + deal price */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between flex-wrap gap-2">
                  {data.deal_rating && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      RATING_OPTIONS.find((r) => r.value === data.deal_rating)?.color
                    }`}>
                      <Star className="w-3 h-3" />
                      {RATING_OPTIONS.find((r) => r.value === data.deal_rating)?.label}
                    </span>
                  )}
                  {data.total_deal_price > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Kundens totalpris</p>
                      <p className="text-base font-bold text-slate-900">{data.total_deal_price.toLocaleString('sv-SE')} kr</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hint box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
              <p className="font-semibold mb-0.5">Totalt dealpris</p>
              <p>Fylls i automatiskt som <em>förhandlat pris minus inbyte</em>. Justera manuellt vid behov.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition placeholder:text-slate-400';

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof TrendingDown;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onToggle,
  alwaysOpen,
  children,
}: {
  icon: typeof Snowflake;
  label: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  alwaysOpen?: boolean;
  children: React.ReactNode;
}) {
  const open = alwaysOpen || checked;
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-[#0e6efe] focus:ring-[#0e6efe]/20"
        />
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </label>
      {open && <div className="mt-3 pl-7">{children}</div>}
    </div>
  );
}
