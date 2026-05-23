import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
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

    const origin = Deno.env.get("SITE_URL") ?? SITE;
    const portalUrl = row.access_token ? `${origin}/min-forfragan/${row.access_token}` : '';

    // Generate a magic link for the customer email so they can open portal directly
    let magicLoginUrl = '';
    if (validEmail) {
      try {
        const rawBytes = new Uint8Array(48);
        crypto.getRandomValues(rawBytes);
        const mlToken = btoa(String.fromCharCode(...rawBytes))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const mlHash = await sha256(mlToken);
        const mlExpiry = new Date(Date.now() + 30 * 60_000).toISOString();
        const { error: mlErr } = await supabase.from("customer_magic_links").insert({
          email: validEmail.toLowerCase(),
          token_hash: mlHash,
          expires_at: mlExpiry,
        });
        if (!mlErr) {
          magicLoginUrl = `${origin}/portal?token=${encodeURIComponent(mlToken)}&email=${encodeURIComponent(validEmail.toLowerCase())}`;
        }
      } catch { /* best effort */ }
    }

    const customerHtml = renderCustomerHtml(row, optionLabel, portalUrl, magicLoginUrl);
    const customerText = renderCustomerText(row, optionLabel, portalUrl, magicLoginUrl);
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

function renderCustomerHtml(row: QuoteRequestRow, optionLabel: string, portalUrl: string, magicLoginUrl: string): string {
  const firstName = capitalize(row.firstname || "");
  const timeText = row.preferred_time
    ? `En av våra bilexperter ringer dig ${preferredTimePhrase(row.preferred_time)}.`
    : "En av våra bilexperter hör av sig inom kort — oftast redan samma dag.";
  const contextGreeting = row.car_model
    ? `Toppen! Din expert håller på och letar en <strong>${escapeHtml(row.car_model)}</strong> åt dig.`
    : `Toppen att du vill ha hjälp med: <strong>${escapeHtml(optionLabel.toLowerCase())}</strong>.`;

  // Use magic link if available, otherwise fall back to static portal token URL
  const ctaUrl = magicLoginUrl || portalUrl;
  const portalBlock = ctaUrl ? `
    <div style="margin-top:28px;background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;overflow:hidden;">
      <div style="padding:24px 28px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1e40af;">Din personliga portal</p>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">Följ din förfrågan, se bilförslag och erbjudanden vi skickar till dig — allt på ett ställe.</p>
        <a href="${escapeAttr(ctaUrl)}"
           style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 36px;border-radius:50px;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(14,110,254,0.35);">
          Följ mitt ärende &rarr;
        </a>
        ${magicLoginUrl ? `<p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">Länken loggar in dig direkt och gäller i 30 minuter.</p>` : ''}
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

function renderCustomerText(row: QuoteRequestRow, optionLabel: string, portalUrl: string, magicLoginUrl: string): string {
  const firstName = capitalize(row.firstname || "");
  const timeText = row.preferred_time
    ? `En av våra bilexperter ringer dig ${preferredTimePhrase(row.preferred_time)}.`
    : "En av våra bilexperter hör av sig inom kort — oftast redan samma dag.";
  const contextGreeling = row.car_model
    ? `Toppen! Din expert håller på och letar en ${row.car_model} åt dig.`
    : `Toppen att du vill ha hjälp med: ${optionLabel.toLowerCase()}.`;
  const lines = [
    `Tack ${firstName}! Vi har fått din förfrågan.`,
    "",
    contextGreeling,
    timeText,
    "Vi går igenom dina önskemål och berättar hur vi kan hjälpa dig vidare — helt utan förpliktelse.",
    "",
    "Behöver du nå oss? Mejla hej@bilto.se.",
  ];
  const ctaUrl = magicLoginUrl || portalUrl;
  if (ctaUrl) {
    lines.push(
      "",
      "--- Följ ditt ärende ---",
      `Klicka här för att se din förfrågan, bilförslag och erbjudanden:`,
      ctaUrl,
      ...(magicLoginUrl ? ["(Länken loggar in dig direkt och gäller i 30 minuter.)"] : []),
    );
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

        <tr><td style="padding:0;line-height:0;">
          <a href="${SITE}" style="text-decoration:none;display:block;">
            <img src="${LOGO_URL}" alt="Bilto" width="580" style="width:100%;max-width:580px;height:auto;display:block;border-radius:16px 16px 0 0;" />
          </a>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
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

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
