import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_SVG_URL = "https://bilto.se/bilto_logo_transparent_(1).svg";
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
    preheader: `Hej ${esc(firstName)}! Vi har hittat en bil som matchar din förfrågan.`,
    title: `Hej ${esc(firstName)}!`,
    subtitle: "Vi har hittat en bil som matchar din f&ouml;rfr&aring;gan.",
    bodyContent: `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">Vi har lagt till ett nytt bilf&ouml;rslag i din portal.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">Klicka nedan f&ouml;r att se alla detaljer, pris och mer information om bilen vi hittade &aring;t dig.</p>
      ${portalUrl ? `<a href="${esc(portalUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:0.01em;">Se mitt bilf&ouml;rslag &rarr;</a>` : ""}
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
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Din bil</p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:800;color:#0f172a;line-height:1.3;">${esc(row.car_description)}</p>

    ${savingsRows.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      ${savingsRows.join("")}
    </table>` : ""}

    ${row.total_savings > 0 ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
      <table width="100%"><tr>
        <td style="color:#1e40af;font-size:13px;font-weight:700;">Total besparing</td>
        <td align="right" style="color:#1d4ed8;font-size:22px;font-weight:800;">~${fmt(row.total_savings)} kr</td>
      </tr></table>
    </div>` : ""}

    ${row.total_deal_price > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#334155;">Totalt dealpris: <strong style="color:#0f172a;">${fmt(row.total_deal_price)} kr</strong></p>` : ""}
    ${row.negotiated_monthly_cost != null && row.negotiated_monthly_cost > 0 ? `<p style="margin:0 0 16px;font-size:14px;color:#334155;">M&aring;nadskostnad: <strong style="color:#0f172a;">${fmt(row.negotiated_monthly_cost)} kr/m&aring;n</strong></p>` : ""}

    <span style="display:inline-block;padding:4px 12px;background:${ratingBg};color:${ratingColor};border-radius:99px;font-size:12px;font-weight:700;margin-bottom:${row.admin_comment ? "16px" : "20px"};">${esc(ratingLabel)}</span>

    ${row.admin_comment ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">V&aring;r bed&ouml;mning</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">${esc(row.admin_comment)}</p>
    </div>` : ""}

    <a href="${esc(portalLink)}" style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:0.01em;">Se mitt erbjudande &rarr;</a>
  `;

  return emailShell({
    preheader: `Hej ${esc(firstName)}! Här är vad vi förhandlat fram åt dig.`,
    title: `Hej ${esc(firstName)}!`,
    subtitle: "H&auml;r &auml;r vad vi f&ouml;rhandlat fram &aring;t dig.",
    bodyContent,
  });
}

function savingRow(label: string, value: string, highlight: boolean): string {
  return `<tr style="background:${highlight ? "#f0f9ff" : "#ffffff"};">
    <td style="padding:10px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td align="right" style="padding:10px 14px;font-size:13px;font-weight:700;color:${highlight ? "#0e6efe" : "#0f172a"};border-bottom:1px solid #f1f5f9;">${value}</td>
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
  title: string;
  subtitle: string;
  bodyContent: string;
}): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

        <!-- Blue logo strip -->
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <a href="${SITE}" style="text-decoration:none;display:inline-block;">
            <img src="${LOGO_SVG_URL}" alt="Bilto" width="110" style="width:110px;height:auto;display:block;" />
          </a>
        </td></tr>

        <!-- White card -->
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px 28px 28px;">
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.25;">${opts.title}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${opts.subtitle}</p>

          ${opts.bodyContent}

          <div style="border-top:1px solid #e2e8f0;margin:28px 0 20px;"></div>
          <p style="margin:0 0 2px;font-size:13px;color:#94a3b8;">Med v&auml;nliga h&auml;lsningar,</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet p&aring; Bilto</p>
        </td></tr>

        <!-- Below card -->
        <tr><td align="center" style="padding-top:16px;">
          <p style="margin:0 0 3px;font-size:12px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#94a3b8;text-decoration:none;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE}" style="color:#94a3b8;text-decoration:none;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${year} Bilto</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function esc(s: string): string {
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
