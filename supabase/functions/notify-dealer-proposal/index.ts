import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_SVG_URL = "https://bilto.se/bilto_logo_transparent_(1).svg";
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
  const year = new Date().getFullYear();

  const savingRow = d.kundNuvarandeMaand > 0 ? `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Skillnad</td>
      <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:${d.maandDiff <= 0 ? "#059669" : "#dc2626"};">
        ${d.maandDiff <= 0 ? "" : "+"}${fmt(d.maandDiff)} kr/m&aring;n
      </td>
    </tr>` : "";

  const moneyShot = d.totalFordel !== null ? `
    <div style="background:#0a3fa8;border-radius:10px;padding:18px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em;">Total f&ouml;rdel &ouml;ver ${d.loptid} m&aring;nader</p>
      <p style="margin:0;font-size:26px;font-weight:800;color:${d.totalFordel > 0 ? "#34d399" : "#f87171"};">
        ${d.totalFordel > 0 ? "&minus;" : "+"}${fmt(Math.abs(d.totalFordel))} kr
      </p>
    </div>` : "";

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Hej ${esc(d.firstName)}! Du har f&aring;tt ett erbjudande p&aring; din ${esc(d.carLabel)}.&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

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
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">${esc(d.dealTypLabel)}</p>
          <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.25;">Hej ${esc(d.firstName)}!</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${esc(d.dealerName)} har skickat ett erbjudande p&aring; din ${esc(d.carLabel)}</p>

          ${d.offeredCar ? `
          <p style="margin:0 0 3px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Erbjuden bil</p>
          <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0f172a;">${esc(d.offeredCar)}</p>` : ""}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Ny m&aring;nadskostnad</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#0f172a;">${fmt(d.manadskostnad)} kr/m&aring;n</td>
            </tr>
            ${d.kundNuvarandeMaand > 0 ? `<tr>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Din nuvarande</td>
              <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${fmt(d.kundNuvarandeMaand)} kr/m&aring;n</td>
            </tr>` : ""}
            ${savingRow}
          </table>

          ${moneyShot}

          <div style="margin-top:${moneyShot ? "4px" : "20px"};text-align:center;">
            <a href="${d.portalUrl}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 28px;border-radius:8px;letter-spacing:0.01em;">
              Se hela erbjudandet &rarr;
            </a>
          </div>

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
