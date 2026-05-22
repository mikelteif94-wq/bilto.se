import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "data:image/png;base64,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";
const SITE = "https://bilto.se";

const SEARCH_OPTION_LABEL: Record<string, string> = {
  searching: "Letar efter bil",
  found: "Har hittat en bil",
  trade: "Vill byta in sin bil",
};

const BUYING_STAGE_LABEL: Record<string, string> = {
  just_started: "Precis börjat titta",
  comparing: "Jämför olika bilar",
  ready_to_buy: "Redo att köpa",
  decided: "Bestämt sig – vill ha hjälp",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  cash: "Kontant",
  finance: "Billån / leasing",
  mix: "Kombination",
};

const FUEL_TYPE_LABEL: Record<string, string> = {
  petrol: "Bensin",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "El",
};

const PREFERRED_TIME_LABEL: Record<string, string> = {
  morning: "Förmiddag (08-12)",
  lunch: "Lunch (12-14)",
  afternoon: "Eftermiddag (14-17)",
  evening: "Kväll (17-20)",
};

interface QuizAnswers {
  budget_type?: string;
  budget_min?: number;
  budget_max?: number;
  body_type?: string[];
  fuel_type?: string[];
  daily_use?: string;
  annual_mileage?: string;
  priorities?: string[];
  brand_preference?: string;
}

interface QuoteRequestRow {
  id: string;
  search_option: string;
  regnummer: string;
  miltal: number;
  buying_stage: string;
  budget: string;
  payment_type: string;
  monthly_payment: string;
  car_model: string;
  fuel_type: string;
  link_or_seller: string;
  target_car: string;
  additional_requests: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  preferred_time: string;
  has_trade_in: boolean;
  trade_in_reg: string;
  current_loan: string;
  current_interest_rate: string;
  desired_monthly_cost: string;
  quiz_answers?: QuizAnswers | null;
  access_token?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const internalEmail = Deno.env.get("INTERNAL_INBOX_EMAIL") ?? "hej@bilto.se";

    const body = await req.json().catch(() => ({}));
    const requestId: string | undefined = body?.quote_request_id;
    const lookupEmail: string | undefined = body?.email;
    const lookupPhone: string | undefined = body?.phone;

    if (!requestId && !lookupEmail && !lookupPhone) {
      return new Response(
        JSON.stringify({ error: "quote_request_id eller email/phone saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let qr;
    if (requestId) {
      const { data } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      qr = data;
    } else {
      let query = supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (lookupEmail) query = query.eq("email", lookupEmail);
      if (lookupPhone) query = query.eq("phone", lookupPhone);
      const { data } = await query.maybeSingle();
      qr = data;
    }

    if (!qr) {
      return new Response(
        JSON.stringify({ error: "Förfrågan hittades inte" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const row = qr as QuoteRequestRow;
    const optionLabel = SEARCH_OPTION_LABEL[row.search_option] ?? row.search_option;
    const fullName = `${row.firstname} ${row.lastname}`.trim() || "Okänd kund";
    const validEmail = row.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) ? row.email : "";
    const isPhoneQuiz = row.additional_requests?.includes("via telefon");

    const subject = isPhoneQuiz
      ? `Ny förfrågan: ${optionLabel} (QUIZ VIA TELEFON) — ${fullName}`
      : `Ny förfrågan: ${optionLabel} — ${fullName}`;

    const html = renderInternalHtml(row, optionLabel, isPhoneQuiz);
    const text = renderInternalText(row, optionLabel, isPhoneQuiz);

    const portalUrl = row.access_token ? `${SITE}/min-forfragan/${row.access_token}` : '';
    const customerHtml = renderCustomerHtml(row, optionLabel, portalUrl);
    const customerText = renderCustomerText(row, optionLabel, portalUrl);
    const customerSubject = "Tack för din förfrågan — vi hör av oss snart";

    const results: { channel: string; ok: boolean; detaljer: string }[] = [];

    if (resendKey) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [internalEmail],
            reply_to: validEmail || undefined,
            subject,
            html,
            text,
          }),
        });
        if (!resp.ok) {
          const errBody = await resp.text();
          results.push({ channel: "internal_email", ok: false, detaljer: truncate(errBody, 500) });
        } else {
          results.push({ channel: "internal_email", ok: true, detaljer: "" });
        }
      } catch (err) {
        results.push({ channel: "internal_email", ok: false, detaljer: truncate((err as Error).message, 500) });
      }

      if (validEmail) {
        try {
          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [validEmail],
              subject: customerSubject,
              html: customerHtml,
              text: customerText,
            }),
          });
          if (!resp.ok) {
            const errBody = await resp.text();
            results.push({ channel: "customer_email", ok: false, detaljer: truncate(errBody, 500) });
          } else {
            results.push({ channel: "customer_email", ok: true, detaljer: "" });
          }
        } catch (err) {
          results.push({
            channel: "customer_email",
            ok: false,
            detaljer: truncate((err as Error).message, 500),
          });
        }
      }
    } else {
      results.push({ channel: "internal_email", ok: false, detaljer: "RESEND_API_KEY saknas" });
    }

    await supabase.from("notifications_log").insert(
      results.map((r) => ({
        typ: `quote_request_${r.channel}`,
        mottagare_mejl: r.channel === "customer_email" ? validEmail : internalEmail,
        status: r.ok ? "sent" : "failed",
        referens_id: requestId || row.id,
        detaljer: r.detaljer,
      })),
    );

    return new Response(
      JSON.stringify({ ok: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function renderInternalHtml(row: QuoteRequestRow, optionLabel: string, isPhoneQuiz: boolean): string {
  const rows: { label: string; value: string }[] = [];

  if (row.search_option === "found" || row.search_option === "trade") {
    if (row.regnummer) rows.push({ label: "Regnummer", value: row.regnummer });
  }
  if (row.search_option === "trade") {
    if (row.miltal) rows.push({ label: "Miltal", value: `${row.miltal.toLocaleString("sv-SE")} mil` });
    if (row.car_model) rows.push({ label: "Vill byta till", value: row.car_model });
    if (row.target_car) rows.push({ label: "Önskad bil", value: row.target_car });
    if (row.budget) rows.push({ label: "Budget", value: `${row.budget} kr` });
    if (row.payment_type) rows.push({ label: "Betalning", value: PAYMENT_TYPE_LABEL[row.payment_type] ?? row.payment_type });
    if (row.payment_type === "finance" && row.monthly_payment) rows.push({ label: "Önskad månadskostnad", value: `${row.monthly_payment} kr` });
  }
  if (row.search_option === "found" && row.link_or_seller) rows.push({ label: "Länk / säljare", value: row.link_or_seller });
  if (row.search_option === "searching") {
    if (row.buying_stage) rows.push({ label: "Köpstatus", value: BUYING_STAGE_LABEL[row.buying_stage] ?? row.buying_stage });
    if (row.car_model) rows.push({ label: "Söker bil", value: row.car_model });
    if (row.budget) rows.push({ label: "Budget", value: `${row.budget} kr` });
    if (row.payment_type) rows.push({ label: "Betalning", value: PAYMENT_TYPE_LABEL[row.payment_type] ?? row.payment_type });
    if (row.payment_type === "finance" && row.monthly_payment) rows.push({ label: "Önskad månadskostnad", value: `${row.monthly_payment} kr` });
    if (row.fuel_type) rows.push({ label: "Drivmedel", value: FUEL_TYPE_LABEL[row.fuel_type] ?? row.fuel_type });
  }
  if (row.buying_stage && row.search_option === "found") rows.push({ label: "Köpstatus", value: BUYING_STAGE_LABEL[row.buying_stage] ?? row.buying_stage });
  if (row.desired_monthly_cost) rows.push({ label: "Önskad månadskostnad", value: row.desired_monthly_cost });
  if (row.has_trade_in) {
    rows.push({ label: "Har inbyte", value: "Ja" });
    if (row.trade_in_reg) rows.push({ label: "Inbytets regnummer", value: row.trade_in_reg });
    if (row.current_loan) rows.push({ label: "Befintligt lån", value: row.current_loan });
    if (row.current_interest_rate) rows.push({ label: "Nuvarande ränta", value: row.current_interest_rate });
  }
  if (row.additional_requests) rows.push({ label: "Övriga önskemål", value: row.additional_requests });
  if (row.preferred_time) rows.push({ label: "Önskad samtalstid", value: PREFERRED_TIME_LABEL[row.preferred_time] ?? row.preferred_time });

  if (row.quiz_answers) {
    const qa = row.quiz_answers;
    if (qa.body_type && qa.body_type.length > 0) rows.push({ label: "Karosstyp (quiz)", value: qa.body_type.join(", ") });
    if (qa.fuel_type && qa.fuel_type.length > 0) {
      const fuelMap: Record<string, string> = { electric: "El", hybrid: "Hybrid", petrol: "Bensin", diesel: "Diesel" };
      rows.push({ label: "Drivlina (quiz)", value: qa.fuel_type.map(f => fuelMap[f] || f).join(", ") });
    }
    if (qa.budget_type) {
      let budgetStr = qa.budget_type === "monthly" ? "Månadsbetalning" : "Kontant";
      if (qa.budget_min) budgetStr += ` från ${qa.budget_min.toLocaleString("sv-SE")} kr`;
      if (qa.budget_max) budgetStr += ` till ${qa.budget_max.toLocaleString("sv-SE")} kr`;
      rows.push({ label: "Budget (quiz)", value: budgetStr });
    }
    if (qa.daily_use) {
      const useMap: Record<string, string> = { solo: "Pendling/ensam", family: "Familj", cargo: "Mycket last", occasional: "Sporadiskt" };
      rows.push({ label: "Vardagsanvändning", value: useMap[qa.daily_use] || qa.daily_use });
    }
    if (qa.annual_mileage) {
      const mileMap: Record<string, string> = { low: "Under 1 000 mil", medium: "1 000–2 000 mil", high: "Över 2 000 mil" };
      rows.push({ label: "Årlig körning", value: mileMap[qa.annual_mileage] || qa.annual_mileage });
    }
    if (qa.brand_preference && qa.brand_preference !== "no_preference") {
      const brandMap: Record<string, string> = { premium: "Premium", mainstream: "Mainstream", budget: "Prisvärt" };
      rows.push({ label: "Märkespreferens", value: brandMap[qa.brand_preference] || qa.brand_preference });
    }
    if (qa.priorities && qa.priorities.length > 0) {
      const prioMap: Record<string, string> = {
        economy: "Låga driftskostnader", safety: "Säkerhet", comfort: "Komfort",
        performance: "Prestanda", space: "Utrymme", tech: "Modern teknik",
        resale: "Andrahandsvärde", reliability: "Pålitlighet",
      };
      rows.push({ label: "Prioriteringar", value: qa.priorities.map(p => prioMap[p] || p).join(", ") });
    }
  }

  const detailsHtml = rows
    .map((r) => `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:170px;">${escapeHtml(r.label)}</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${escapeHtml(r.value).replace(/\n/g, "<br/>")}</td></tr>`)
    .join("");

  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:20px 32px 16px;background:#0e6efe;text-align:center;">
      <img src="${LOGO_URL}" alt="Bilto" style="height:40px;width:auto;display:inline-block;margin-bottom:10px;" />
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.85);font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Ny köp-/inbyteslead</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;">${escapeHtml(optionLabel)}${isPhoneQuiz ? ' <span style="background:#fbbf24;color:#78350f;font-size:12px;padding:3px 8px;border-radius:6px;font-weight:700;margin-left:8px;">QUIZ VIA TELEFON</span>' : ''}</h1>
    </td></tr>
    <tr><td style="padding:24px 32px 8px;">
      <p style="margin:0 0 4px;color:#0f172a;font-size:18px;font-weight:600;">${escapeHtml(`${row.firstname} ${row.lastname}`.trim())}</p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        <a href="mailto:${escapeAttr(row.email)}" style="color:#0e6efe;text-decoration:none;">${escapeHtml(row.email)}</a> &middot;
        <a href="tel:${escapeAttr(row.phone)}" style="color:#0e6efe;text-decoration:none;">${escapeHtml(row.phone)}</a>
      </p>
    </td></tr>
    <tr><td style="padding:8px 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;margin-top:12px;">
        ${detailsHtml}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderInternalText(row: QuoteRequestRow, optionLabel: string, isPhoneQuiz: boolean): string {
  const lines: string[] = [
    `Ny köp-/inbyteslead: ${optionLabel}${isPhoneQuiz ? " [QUIZ VIA TELEFON]" : ""}`,
    "",
    `Namn: ${row.firstname} ${row.lastname}`.trim(),
    `E-post: ${row.email}`,
    `Telefon: ${row.phone}`,
    "",
  ];
  if (row.search_option === "found" || row.search_option === "trade") {
    if (row.regnummer) lines.push(`Regnummer: ${row.regnummer}`);
  }
  if (row.search_option === "trade") {
    if (row.miltal) lines.push(`Miltal: ${row.miltal.toLocaleString("sv-SE")} mil`);
    if (row.car_model) lines.push(`Vill byta till: ${row.car_model}`);
    if (row.target_car) lines.push(`Önskad bil: ${row.target_car}`);
    if (row.budget) lines.push(`Budget: ${row.budget} kr`);
    if (row.payment_type) lines.push(`Betalning: ${PAYMENT_TYPE_LABEL[row.payment_type] ?? row.payment_type}`);
    if (row.payment_type === "finance" && row.monthly_payment) lines.push(`Önskad månadskostnad: ${row.monthly_payment} kr`);
  }
  if (row.search_option === "found" && row.link_or_seller) lines.push(`Länk/säljare: ${row.link_or_seller}`);
  if (row.search_option === "searching") {
    if (row.buying_stage) lines.push(`Köpstatus: ${BUYING_STAGE_LABEL[row.buying_stage] ?? row.buying_stage}`);
    if (row.car_model) lines.push(`Söker: ${row.car_model}`);
    if (row.budget) lines.push(`Budget: ${row.budget} kr`);
    if (row.payment_type) lines.push(`Betalning: ${PAYMENT_TYPE_LABEL[row.payment_type] ?? row.payment_type}`);
    if (row.payment_type === "finance" && row.monthly_payment) lines.push(`Önskad månadskostnad: ${row.monthly_payment} kr`);
    if (row.fuel_type) lines.push(`Drivmedel: ${FUEL_TYPE_LABEL[row.fuel_type] ?? row.fuel_type}`);
  }
  if (row.buying_stage && row.search_option === "found") lines.push(`Köpstatus: ${BUYING_STAGE_LABEL[row.buying_stage] ?? row.buying_stage}`);
  if (row.desired_monthly_cost) lines.push(`Önskad månadskostnad: ${row.desired_monthly_cost}`);
  if (row.has_trade_in) {
    lines.push(`Har inbyte: Ja`);
    if (row.trade_in_reg) lines.push(`Inbytets regnummer: ${row.trade_in_reg}`);
    if (row.current_loan) lines.push(`Befintligt lån: ${row.current_loan}`);
    if (row.current_interest_rate) lines.push(`Nuvarande ränta: ${row.current_interest_rate}`);
  }
  if (row.additional_requests) lines.push(`Övriga önskemål: ${row.additional_requests}`);
  if (row.preferred_time) lines.push(`Önskad samtalstid: ${PREFERRED_TIME_LABEL[row.preferred_time] ?? row.preferred_time}`);

  if (row.quiz_answers) {
    const qa = row.quiz_answers;
    lines.push("", "--- Quiz-preferenser ---");
    if (qa.body_type && qa.body_type.length > 0) lines.push(`Karosstyp: ${qa.body_type.join(", ")}`);
    if (qa.fuel_type && qa.fuel_type.length > 0) {
      const fuelMap: Record<string, string> = { electric: "El", hybrid: "Hybrid", petrol: "Bensin", diesel: "Diesel" };
      lines.push(`Drivlina: ${qa.fuel_type.map(f => fuelMap[f] || f).join(", ")}`);
    }
    if (qa.budget_type) {
      let budgetStr = qa.budget_type === "monthly" ? "Månadsbetalning" : "Kontant";
      if (qa.budget_min) budgetStr += ` från ${qa.budget_min.toLocaleString("sv-SE")} kr`;
      if (qa.budget_max) budgetStr += ` till ${qa.budget_max.toLocaleString("sv-SE")} kr`;
      lines.push(`Budget: ${budgetStr}`);
    }
    if (qa.daily_use) {
      const useMap: Record<string, string> = { solo: "Pendling/ensam", family: "Familj", cargo: "Mycket last", occasional: "Sporadiskt" };
      lines.push(`Vardagsanvändning: ${useMap[qa.daily_use] || qa.daily_use}`);
    }
    if (qa.annual_mileage) {
      const mileMap: Record<string, string> = { low: "Under 1 000 mil", medium: "1 000–2 000 mil", high: "Över 2 000 mil" };
      lines.push(`Årlig körning: ${mileMap[qa.annual_mileage] || qa.annual_mileage}`);
    }
    if (qa.brand_preference && qa.brand_preference !== "no_preference") {
      const brandMap: Record<string, string> = { premium: "Premium", mainstream: "Mainstream", budget: "Prisvärt" };
      lines.push(`Märkespreferens: ${brandMap[qa.brand_preference] || qa.brand_preference}`);
    }
    if (qa.priorities && qa.priorities.length > 0) {
      const prioMap: Record<string, string> = {
        economy: "Låga driftskostnader", safety: "Säkerhet", comfort: "Komfort",
        performance: "Prestanda", space: "Utrymme", tech: "Modern teknik",
        resale: "Andrahandsvärde", reliability: "Pålitlighet",
      };
      lines.push(`Prioriteringar: ${qa.priorities.map(p => prioMap[p] || p).join(", ")}`);
    }
  }

  return lines.join("\n");
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function renderCustomerHtml(row: QuoteRequestRow, optionLabel: string, portalUrl: string): string {
  const firstName = capitalize(row.firstname || "");
  const timeText = row.preferred_time
    ? `En av våra bilexperter ringer dig ${preferredTimePhrase(row.preferred_time)}.`
    : "En av våra bilexperter hör av sig inom kort — oftast redan samma dag.";
  const contextGreeting = row.car_model
    ? `Toppen! Din expert håller på och letar en <strong>${escapeHtml(row.car_model)}</strong> åt dig.`
    : `Toppen att du vill ha hjälp med: <strong>${escapeHtml(optionLabel.toLowerCase())}</strong>.`;

  const portalBlock = portalUrl ? `
    <div style="margin-top:28px;background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1e40af;">Din personliga portal</p>
        <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">Följ din förfrågan, se bilförslag och erbjudanden vi skickar till dig — allt på ett ställe.</p>
        <a href="${escapeAttr(portalUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:0.02em;">Gå till min portal &rarr;</a>
      </div>
    </div>` : '';

  return emailShell({
    preheader: `Tack ${escapeHtml(firstName)}! Vi har fått din förfrågan och hör av oss snart.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Förfrågan mottagen</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Tack ${escapeHtml(firstName)}!</h1>
      <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Vi har fått din förfrågan och återkommer snart.</p>
    `,
    bodyContent: `
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.7;font-weight:500;">${contextGreeting}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">${escapeHtml(timeText)} Vi går igenom dina önskemål och berättar hur vi kan hjälpa dig vidare — helt utan förpliktelse.</p>
      <div style="background:#f0f9ff;border-left:4px solid #0e6efe;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#0369a1;line-height:1.6;">Behöver du nå oss? Mejla <a href="mailto:hej@bilto.se" style="color:#0e6efe;font-weight:600;text-decoration:none;">hej@bilto.se</a>.</p>
      </div>
      ${portalBlock}
    `,
  });
}

function renderCustomerText(row: QuoteRequestRow, optionLabel: string, portalUrl: string): string {
  const firstName = capitalize(row.firstname || "");
  const timeText = row.preferred_time
    ? `En av våra bilexperter ringer dig ${preferredTimePhrase(row.preferred_time)}.`
    : "En av våra bilexperter hör av sig inom kort — oftast redan samma dag.";
  const contextGreeting = row.car_model
    ? `Toppen! Din expert håller på och letar en ${row.car_model} åt dig.`
    : `Toppen att du vill ha hjälp med: ${optionLabel.toLowerCase()}.`;
  const lines = [
    `Tack ${firstName}! Vi har fått din förfrågan.`,
    "",
    contextGreeting,
    timeText,
    "Vi går igenom dina önskemål och berättar hur vi kan hjälpa dig vidare — helt utan förpliktelse.",
    "",
    "Behöver du nå oss? Mejla hej@bilto.se.",
  ];
  if (portalUrl) {
    lines.push("", "--- Din personliga portal ---", `Följ din förfrågan och se bilförslag vi skickar till dig: ${portalUrl}`);
  }
  lines.push("", "Med vänliga hälsningar,", "Teamet på Bilto");
  return lines.join("\n");
}

function emailShell(opts: {
  preheader: string;
  heroContent: string;
  bodyContent: string;
}): string {
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${SITE}" style="text-decoration:none;display:inline-block;background:#0e6efe;border-radius:12px;padding:12px 28px;">
            <img src="${LOGO_URL}" alt="Bilto" width="110" style="width:110px;height:auto;display:block;" />
          </a>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#0a4fd4 0%,#0e6efe 60%,#3b87ff 100%);padding:40px 40px 36px;text-align:center;">
              ${opts.heroContent}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 32px;">
              ${opts.bodyContent}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 40px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:24px 40px 36px;">
              <p style="margin:0 0 2px;font-size:14px;color:#64748b;line-height:1.6;">Med vänliga hälsningar,</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">Teamet på Bilto</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#64748b;text-decoration:none;font-weight:500;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE}" style="color:#64748b;text-decoration:none;font-weight:500;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} Bilto. Alla rättigheter förbehållna.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function preferredTimePhrase(t: string): string {
  switch (t) {
    case "morning": return "på förmiddagen";
    case "lunch": return "över lunch";
    case "afternoon": return "på eftermiddagen";
    case "evening": return "på kvällen";
    default: return "så snart som möjligt";
  }
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}
