import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/Untitled_design_(15).png";
const SITE = "https://bilto.se";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";

    const body = await req.json().catch(() => ({}));
    const proposalId: string = body?.proposalId ?? "";
    const carId: string = body?.carId ?? "";

    if (!proposalId || !carId) {
      return new Response(
        JSON.stringify({ error: "proposalId och carId krävs." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch proposal + car + customer
    const { data: proposal } = await supabase
      .from("dealer_proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    if (!proposal) {
      return new Response(
        JSON.stringify({ error: "Förslaget hittades inte." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: car } = await supabase
      .from("cars")
      .select("regnummer, marke, modell, ar, access_token, customers(namn, mejl)")
      .eq("id", carId)
      .maybeSingle();

    if (!car) {
      return new Response(
        JSON.stringify({ error: "Bilen hittades inte." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const customer = car.customers as { namn: string; mejl: string } | null;
    const customerEmail = customer?.mejl ?? "";
    const customerName = customer?.namn ?? "";
    const firstName = customerName.trim().split(" ")[0] || "du";
    const accessToken = car.access_token ?? "";
    const portalUrl = `${SITE}/min-bil/${encodeURIComponent(accessToken)}`;
    const carLabel = [car.marke, car.modell, car.ar].filter(Boolean).join(" ") || car.regnummer;

    const dealTypLabels: Record<string, string> = {
      lagre_manadskostnad: "Lägre månadskostnad",
      battre_bil_samma_kostnad: "Bättre bil, samma kostnad",
      premium_byte: "Premium-byte",
      snabb_affar: "Snabb affär",
    };
    const dealTypLabel = dealTypLabels[proposal.dealtyp] ?? proposal.dealtyp;
    const offeredCar = [proposal.erbjuden_marke, proposal.erbjuden_modell, proposal.erbjuden_ar]
      .filter(Boolean)
      .join(" ");

    const maandDiff = proposal.manadskostnad - proposal.kund_nuvarande_manad;
    const totalFordel =
      proposal.kund_nuvarande_manad > 0
        ? -maandDiff * proposal.loptid_manader
        : null;

    let ok = false;
    let details = "";

    if (customerEmail && resendKey) {
      const html = buildEmail({
        firstName,
        dealerName: proposal.dealer_name,
        carLabel,
        offeredCar,
        dealTypLabel,
        manadskostnad: proposal.manadskostnad,
        kundNuvarandeMaand: proposal.kund_nuvarande_manad,
        maandDiff,
        totalFordel,
        loptid: proposal.loptid_manader,
        portalUrl,
      });

      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [customerEmail],
            subject: `Du har fått ett erbjudande på din ${carLabel} — Bilto`,
            html,
          }),
        });
        ok = resp.ok;
        if (!resp.ok) details = await resp.text();
      } catch (err) {
        details = (err as Error).message;
      }
    } else {
      details = customerEmail ? "RESEND_API_KEY saknas" : "Kunden saknar e-post";
    }

    await supabase.from("notifications_log").insert({
      typ: "dealer_proposal",
      mottagare_mejl: customerEmail || "okänd",
      status: ok ? "sent" : "failed",
      detaljer: details.slice(0, 500),
    });

    return new Response(
      JSON.stringify({ ok }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function fmt(n: number): string {
  return n.toLocaleString("sv-SE");
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(d: {
  firstName: string;
  dealerName: string;
  carLabel: string;
  offeredCar: string;
  dealTypLabel: string;
  manadskostnad: number;
  kundNuvarandeMaand: number;
  maandDiff: number;
  totalFordel: number | null;
  loptid: number;
  portalUrl: string;
}): string {
  const savingRow = d.kundNuvarandeMaand > 0 ? `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Skillnad</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;font-weight:700;color:${d.maandDiff <= 0 ? '#059669' : '#dc2626'};">
        ${d.maandDiff <= 0 ? '' : '+'}${fmt(d.maandDiff)} kr/mån
      </td>
    </tr>` : '';

  const moneyShot = d.totalFordel !== null ? `
    <div style="background:#0f172a;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Total fördel över ${d.loptid} månader</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:${d.totalFordel > 0 ? '#34d399' : '#f87171'};">
        ${d.totalFordel > 0 ? '−' : '+'}${fmt(Math.abs(d.totalFordel))} kr
      </p>
    </div>` : '';

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
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
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.75);">${esc(d.dealTypLabel)}</p>
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Hej ${esc(d.firstName)}!</h1>
              <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);">${esc(d.dealerName)} har skickat ett erbjudande på din ${esc(d.carLabel)}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px 40px;">
              ${d.offeredCar ? `<p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Erbjuden bil</p>
              <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#0f172a;">${esc(d.offeredCar)}</p>` : ''}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Ny månadskostnad</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;font-weight:700;color:#0f172a;">${fmt(d.manadskostnad)} kr/mån</td>
                </tr>
                ${d.kundNuvarandeMaand > 0 ? `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Din nuvarande</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">${fmt(d.kundNuvarandeMaand)} kr/mån</td>
                </tr>` : ''}
                ${savingRow}
              </table>

              ${moneyShot}

              <div style="text-align:center;padding:8px 0 4px;">
                <a href="${d.portalUrl}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:100px;letter-spacing:0.01em;">
                  Se hela erbjudandet &rarr;
                </a>
              </div>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 40px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:20px 40px 32px;">
              <p style="margin:0 0 2px;font-size:13px;color:#94a3b8;">Med vänliga hälsningar,</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet på Bilto</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#64748b;text-decoration:none;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE}" style="color:#64748b;text-decoration:none;">bilto.se</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
