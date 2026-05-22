import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/Untitled_design_(15).png";
const SITE = "https://bilto.se";

const RATING_LABELS: Record<string, string> = {
  good: "Bra deal",
  great: "Mycket bra deal",
  excellent: "Fantastisk deal",
};

interface OfferRow {
  id: string;
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
  deal_rating: string;
  admin_comment: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";

    const body = await req.json().catch(() => ({}));
    const msgType: string = body?.type ?? "offer";

    // --- Suggestion type ---
    if (msgType === "suggestion") {
      const email: string = body?.email ?? "";
      const firstname: string = body?.firstname ?? "";
      const portalUrl: string = body?.portal_url ?? "";

      if (!email) {
        return new Response(
          JSON.stringify({ error: "email saknas" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const firstName = firstname.split(" ")[0] || "du";
      const subject = "Du har fått ett nytt bilförslag från Bilto";
      const html = renderSuggestionHtml(firstName, portalUrl);

      let ok = false;
      let details = "";
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      if (resendKey) {
        try {
          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
          });
          ok = resp.ok;
          if (!resp.ok) details = await resp.text();
        } catch (err) {
          details = (err as Error).message;
        }
      } else {
        details = "RESEND_API_KEY saknas";
      }

      await supabase.from("notifications_log").insert({
        typ: "suggestion_sent",
        mottagare_mejl: email,
        status: ok ? "sent" : "failed",
        detaljer: details.slice(0, 500),
      });

      return new Response(
        JSON.stringify({ ok }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Formal offer type ---
    const offerId: string | undefined = body?.offer_id;
    const portalUrl: string = body?.portal_url ?? "";

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: "offer_id saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: offer } = await supabase
      .from("car_offers")
      .select("*")
      .eq("id", offerId)
      .maybeSingle();

    if (!offer) {
      return new Response(
        JSON.stringify({ error: "Erbjudande hittades inte" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const row = offer as OfferRow;

    if (!row.customer_email) {
      return new Response(
        JSON.stringify({ error: "Ingen e-postadress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subject = `Du har fått ett nytt erbjudande från Bilto${row.car_description ? " — " + row.car_description : ""}`;
    const html = renderOfferHtml(row, portalUrl);
    const text = renderOfferText(row, portalUrl);

    let ok = false;
    let details = "";

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
            to: [row.customer_email],
            subject,
            html,
            text,
          }),
        });
        if (!resp.ok) {
          details = await resp.text();
        } else {
          ok = true;
        }
      } catch (err) {
        details = (err as Error).message;
      }
    } else {
      details = "RESEND_API_KEY saknas";
    }

    await supabase.from("notifications_log").insert({
      typ: "car_offer_sent",
      mottagare_mejl: row.customer_email,
      status: ok ? "sent" : "failed",
      referens_id: offerId,
      detaljer: details.slice(0, 500),
    });

    return new Response(
      JSON.stringify({ ok, details: details.slice(0, 200) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function renderSuggestionHtml(firstName: string, portalUrl: string): string {
  return emailShell({
    preheader: `Hej ${escapeHtml(firstName)}! Vi har hittat en bil som matchar din förfrågan.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Nytt bilförslag</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Hej ${escapeHtml(firstName)}!</h1>
      <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Vi har hittat en bil som matchar din förfrågan.</p>
    `,
    bodyContent: `
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.7;font-weight:500;">Vi har lagt till ett nytt bilförslag i din portal.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">Klicka nedan för att se alla detaljer, pris och mer information om bilen vi hittade åt dig.</p>
      ${portalUrl ? `<a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:10px;letter-spacing:0.02em;">Se mitt bilförslag &rarr;</a>` : ""}
    `,
  });
}

function renderOfferHtml(row: OfferRow, portalUrl: string): string {
  const firstName = row.customer_name.split(" ")[0] || "du";
  const priceDiff = row.original_price > 0 && row.negotiated_price > 0
    ? row.original_price - row.negotiated_price
    : 0;
  const ratingLabel = RATING_LABELS[row.deal_rating] ?? "Bra deal";
  const ratingColor = row.deal_rating === "excellent" ? "#065f46" : row.deal_rating === "great" ? "#1e40af" : "#374151";
  const ratingBg = row.deal_rating === "excellent" ? "#ecfdf5" : row.deal_rating === "great" ? "#eff6ff" : "#f9fafb";
  const portalLink = portalUrl || `${SITE}/logga-in`;

  const savingsRows: string[] = [];
  if (priceDiff > 0) savingsRows.push(savingRow("Prisrabatt", `-${fmt(priceDiff)} kr`, true));
  if (row.original_interest_rate != null && row.negotiated_interest_rate != null) {
    savingsRows.push(savingRow("Ränta", `${row.original_interest_rate}% &rarr; ${row.negotiated_interest_rate}%`, false));
  }
  if (row.original_monthly_cost != null && row.negotiated_monthly_cost != null) {
    savingsRows.push(savingRow("Månadskostnad", `${fmt(row.original_monthly_cost)} &rarr; ${fmt(row.negotiated_monthly_cost)} kr/mån`, false));
  }
  if (row.winter_tires_included) savingsRows.push(savingRow("Vinterdäck ingår", `Värde ${fmt(row.winter_tires_value)} kr`, false));
  if (row.warranty_included) savingsRows.push(savingRow(`Garanti${row.warranty_years ? ` ${row.warranty_years} år` : ""} ingår`, `Värde ${fmt(row.warranty_value)} kr`, false));
  if (row.home_delivery_included) savingsRows.push(savingRow("Hemleverans ingår", `Värde ${fmt(row.home_delivery_value)} kr`, false));
  if (row.other_savings_value > 0) savingsRows.push(savingRow(row.other_savings_description || "Övrigt", `${fmt(row.other_savings_value)} kr`, false));

  const bodyContent = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Din bil</p>
    <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#0f172a;line-height:1.3;">${escapeHtml(row.car_description)}</p>

    ${savingsRows.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      ${savingsRows.join("")}
    </table>` : ""}

    ${row.total_savings > 0 ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
      <table width="100%"><tr>
        <td style="color:#1e40af;font-size:14px;font-weight:700;">Total besparing</td>
        <td align="right" style="color:#1d4ed8;font-size:24px;font-weight:800;">~${fmt(row.total_savings)} kr</td>
      </tr></table>
    </div>` : ""}

    ${row.total_deal_price > 0 ? `<p style="margin:0 0 4px;font-size:15px;color:#334155;">Totalt dealpris: <strong style="color:#0f172a;">${fmt(row.total_deal_price)} kr</strong></p>` : ""}
    ${row.negotiated_monthly_cost != null && row.negotiated_monthly_cost > 0 ? `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Månadskostnad: <strong style="color:#0f172a;">${fmt(row.negotiated_monthly_cost)} kr/mån</strong></p>` : ""}

    <span style="display:inline-block;padding:5px 14px;background:${ratingBg};color:${ratingColor};border-radius:99px;font-size:12px;font-weight:700;margin-bottom:${row.admin_comment ? "16px" : "24px"};">${escapeHtml(ratingLabel)}</span>

    ${row.admin_comment ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Vår bedömning</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">${escapeHtml(row.admin_comment)}</p>
    </div>` : ""}

    <a href="${escapeHtml(portalLink)}" style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:10px;letter-spacing:0.02em;">Se mitt erbjudande &rarr;</a>
  `;

  return emailShell({
    preheader: `Hej ${escapeHtml(firstName)}! Här är vad vi förhandlat fram åt dig.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Ditt erbjudande är klart</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Hej ${escapeHtml(firstName)}!</h1>
      <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Här är vad vi förhandlat fram åt dig.</p>
    `,
    bodyContent,
  });
}

function savingRow(label: string, value: string, highlight: boolean): string {
  return `<tr style="background:${highlight ? "#f0f9ff" : "#ffffff"};">
    <td style="padding:12px 16px;font-size:14px;color:#475569;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:${highlight ? "#0e6efe" : "#0f172a"};border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>`;
}

function renderOfferText(row: OfferRow, portalUrl: string): string {
  const firstName = row.customer_name.split(" ")[0] || "du";
  const priceDiff = row.original_price > 0 && row.negotiated_price > 0
    ? row.original_price - row.negotiated_price
    : 0;
  const portalLink = portalUrl || `${SITE}/logga-in`;

  const lines = [`Hej ${firstName}!`, "", `Här är vad vi förhandlat fram för: ${row.car_description}`, ""];
  if (priceDiff > 0) lines.push(`Prisrabatt: -${fmt(priceDiff)} kr`);
  if (row.original_interest_rate != null && row.negotiated_interest_rate != null) {
    lines.push(`Ränta: ${row.original_interest_rate}% -> ${row.negotiated_interest_rate}%`);
  }
  if (row.winter_tires_included) lines.push(`Vinterdäck ingår (värde ${fmt(row.winter_tires_value)} kr)`);
  if (row.warranty_included) lines.push(`Garanti ingår (värde ${fmt(row.warranty_value)} kr)`);
  if (row.home_delivery_included) lines.push(`Hemleverans gratis (värde ${fmt(row.home_delivery_value)} kr)`);
  if (row.total_savings > 0) { lines.push(""); lines.push(`Total besparing: ~${fmt(row.total_savings)} kr`); }
  if (row.total_deal_price > 0) lines.push(`Totalt dealpris: ${fmt(row.total_deal_price)} kr`);
  if (row.admin_comment) { lines.push(""); lines.push(`Vår bedömning: ${row.admin_comment}`); }
  lines.push("", `Se ditt erbjudande: ${portalLink}`, "", "Med vänliga hälsningar,", "Teamet på Bilto");
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

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt(n: number): string {
  return n.toLocaleString("sv-SE");
}
