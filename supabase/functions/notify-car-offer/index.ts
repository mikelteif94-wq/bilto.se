import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const offerId: string | undefined = body?.offer_id;
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

    const subject = `Ditt erbjudande: ${row.car_description || "Biloffer"} — Bilto`;
    const html = renderOfferHtml(row);
    const text = renderOfferText(row);

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

function renderOfferHtml(row: OfferRow): string {
  const firstName = row.customer_name.split(" ")[0] || "du";
  const priceDiff = row.original_price > 0 && row.negotiated_price > 0
    ? row.original_price - row.negotiated_price
    : 0;
  const ratingLabel = RATING_LABELS[row.deal_rating] ?? "Bra deal";

  const savingsRows: string[] = [];

  if (priceDiff > 0) {
    savingsRows.push(detailRow("Prisrabatt", `-${fmt(priceDiff)} kr`));
  }
  if (row.original_interest_rate != null && row.negotiated_interest_rate != null) {
    savingsRows.push(detailRow("Ranta", `${row.original_interest_rate}% → ${row.negotiated_interest_rate}%`));
  }
  if (row.original_monthly_cost != null && row.negotiated_monthly_cost != null) {
    savingsRows.push(detailRow("Manadskostnad", `${fmt(row.original_monthly_cost)} → ${fmt(row.negotiated_monthly_cost)} kr/man`));
  }
  if (row.winter_tires_included) {
    savingsRows.push(detailRow("Vinterdack", `Ingar (varde ${fmt(row.winter_tires_value)} kr)`));
  }
  if (row.warranty_included) {
    savingsRows.push(detailRow(`Garanti${row.warranty_years ? ` ${row.warranty_years} ar` : ""}`, `Ingar (varde ${fmt(row.warranty_value)} kr)`));
  }
  if (row.home_delivery_included) {
    savingsRows.push(detailRow("Hemleverans", `Gratis (varde ${fmt(row.home_delivery_value)} kr)`));
  }
  if (row.other_savings_value > 0) {
    savingsRows.push(detailRow(row.other_savings_description || "Ovrigt", `${fmt(row.other_savings_value)} kr`));
  }

  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:28px 32px;background:#0e6efe;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;">Hej ${escapeHtml(firstName)}!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Har ar vad vi forhandlat fram at dig.</p>
    </td></tr>
    <tr><td style="padding:24px 32px;">
      <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:700;">${escapeHtml(row.car_description)}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
        ${savingsRows.join("")}
      </table>
      ${row.total_savings > 0 ? `
      <div style="margin-top:16px;padding:14px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
        <table width="100%"><tr>
          <td style="color:#1d4ed8;font-size:14px;font-weight:700;">Total besparing</td>
          <td align="right" style="color:#1d4ed8;font-size:22px;font-weight:800;">~${fmt(row.total_savings)} kr</td>
        </tr></table>
      </div>` : ""}
      ${row.total_deal_price > 0 ? `<p style="margin:12px 0 0;color:#334155;font-size:14px;">Totalt dealpris: <strong>${fmt(row.total_deal_price)} kr</strong></p>` : ""}
      ${row.negotiated_monthly_cost != null && row.negotiated_monthly_cost > 0 ? `<p style="margin:4px 0 0;color:#334155;font-size:14px;">Manadskostnad: <strong>${fmt(row.negotiated_monthly_cost)} kr/man</strong></p>` : ""}
      <p style="margin:14px 0 0;display:inline-block;padding:4px 12px;background:#ecfdf5;color:#065f46;border-radius:99px;font-size:12px;font-weight:700;">${escapeHtml(ratingLabel)}</p>
      ${row.admin_comment ? `<div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;"><p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Biltos bedomning</p><p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(row.admin_comment)}</p></div>` : ""}
    </td></tr>
    <tr><td style="padding:16px 32px 28px;">
      <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">Logga in pa <a href="https://bilto.se/logga-in" style="color:#0e6efe;font-weight:600;">din portal</a> for att se alla detaljer.</p>
    </td></tr>
    <tr><td style="padding:0 32px 24px;color:#94a3b8;font-size:12px;">
      Bilto AB &middot; hej@bilto.se
    </td></tr>
  </table>
</body></html>`;
}

function renderOfferText(row: OfferRow): string {
  const firstName = row.customer_name.split(" ")[0] || "du";
  const priceDiff = row.original_price > 0 && row.negotiated_price > 0
    ? row.original_price - row.negotiated_price
    : 0;

  const lines = [
    `Hej ${firstName}!`,
    "",
    `Har ar vad vi forhandlat fram for: ${row.car_description}`,
    "",
  ];

  if (priceDiff > 0) lines.push(`Prisrabatt: -${fmt(priceDiff)} kr`);
  if (row.original_interest_rate != null && row.negotiated_interest_rate != null) {
    lines.push(`Ranta: ${row.original_interest_rate}% -> ${row.negotiated_interest_rate}%`);
  }
  if (row.winter_tires_included) lines.push(`Vinterdack ingar (varde ${fmt(row.winter_tires_value)} kr)`);
  if (row.warranty_included) lines.push(`Garanti ingar (varde ${fmt(row.warranty_value)} kr)`);
  if (row.home_delivery_included) lines.push(`Hemleverans gratis (varde ${fmt(row.home_delivery_value)} kr)`);
  if (row.total_savings > 0) {
    lines.push("");
    lines.push(`Total besparing: ~${fmt(row.total_savings)} kr`);
  }
  if (row.total_deal_price > 0) lines.push(`Totalt dealpris: ${fmt(row.total_deal_price)} kr`);
  if (row.admin_comment) {
    lines.push("");
    lines.push(`Biltos bedomning: ${row.admin_comment}`);
  }
  lines.push("");
  lines.push("Logga in pa https://bilto.se/logga-in for att se alla detaljer.");
  lines.push("");
  lines.push("Bilto AB");

  return lines.join("\n");
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:10px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">${escapeHtml(label)}</td><td align="right" style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${escapeHtml(value)}</td></tr>`;
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
