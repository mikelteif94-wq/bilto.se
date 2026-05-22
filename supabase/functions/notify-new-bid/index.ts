import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
const SITE = "https://bilto.se";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const rawAppUrl = Deno.env.get("APP_URL") ?? "";
    const appUrl = isPublicUrl(rawAppUrl) ? rawAppUrl : SITE;

    const body = await req.json().catch(() => ({}));
    const carId: string | undefined = body?.car_id;
    const bidAmount: number | undefined = body?.bid_amount;

    if (!carId) {
      return jsonResp({ error: "car_id saknas" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch car + customer info
    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select("id, regnummer, marke, modell, ar, access_token, customers(namn, mejl)")
      .eq("id", carId)
      .maybeSingle();

    if (carErr || !car) {
      return jsonResp({ error: "Bilen hittades inte" }, 404);
    }

    const customer = (car as {
      customers?: { namn: string; mejl: string } | null;
    }).customers;

    if (!customer?.mejl) {
      return jsonResp({ skipped: true, reason: "Ingen kundmejl" }, 200);
    }

    // Count all bids for this car to include in the email
    const { count: totalBids } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId);

    // Get highest bid
    const { data: bidsData } = await supabase
      .from("bids")
      .select("belopp")
      .eq("car_id", carId)
      .order("belopp", { ascending: false })
      .limit(1);
    const highestBid = bidsData?.[0]?.belopp ?? bidAmount ?? 0;

    // Build portal URL — prefer access_token link, fall back to login
    const portalUrl = (car as { access_token?: string }).access_token
      ? `${appUrl.replace(/\/$/, "")}/min-bil/${(car as { access_token: string }).access_token}`
      : `${appUrl.replace(/\/$/, "")}/logga-in?mejl=${encodeURIComponent(customer.mejl)}`;

    if (!resendKey) {
      await supabase.from("notifications_log").insert({
        typ: "mejl_nytt_bud_kund",
        mottagare_mejl: customer.mejl,
        status: "failed",
        referens_id: car.id,
        detaljer: "RESEND_API_KEY saknas",
      });
      return jsonResp({ error: "RESEND_API_KEY saknas" }, 500);
    }

    const fornamn = (customer.namn ?? "").trim().split(" ")[0] || customer.namn;
    const title = [(car as any).marke, (car as any).modell].filter(Boolean).join(" ") || "din bil";
    const budCount = totalBids ?? 1;

    const html = renderEmail({ fornamn, regnummer: (car as any).regnummer, title, highestBid, budCount, portalUrl, appUrl });

    const text = [
      `Hej ${fornamn}!`,
      "",
      `Det har kommit ett nytt bud på ${title} (${(car as any).regnummer}).`,
      "",
      `Högsta bud just nu: ${highestBid.toLocaleString("sv-SE")} kr`,
      `Antal bud totalt: ${budCount}`,
      "",
      `Se dina bud i din portal: ${portalUrl}`,
      "",
      "Hälsningar, Bilto",
    ].join("\n");

    let status: "sent" | "failed" = "sent";
    let detaljer = "";
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [customer.mejl],
          subject: `${fornamn}, nytt bud på ${title} — ${highestBid.toLocaleString("sv-SE")} kr`,
          html,
          text,
        }),
      });
      if (!resp.ok) {
        status = "failed";
        detaljer = truncate(await resp.text(), 500);
      }
    } catch (err) {
      status = "failed";
      detaljer = truncate((err as Error).message, 500);
    }

    await supabase.from("notifications_log").insert({
      typ: "mejl_nytt_bud_kund",
      mottagare_mejl: customer.mejl,
      status,
      referens_id: car.id,
      detaljer,
    });

    return jsonResp({ ok: status === "sent" }, status === "sent" ? 200 : 500);
  } catch (err) {
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

function renderEmail(d: {
  fornamn: string;
  regnummer: string;
  title: string;
  highestBid: number;
  budCount: number;
  portalUrl: string;
  appUrl: string;
}): string {
  const site = d.appUrl ? d.appUrl.replace(/\/$/, "") : SITE;
  const formattedBid = d.highestBid.toLocaleString("sv-SE");

  return emailShell({
    site,
    preheader: `${esc(d.fornamn)}, nytt bud på ${esc(d.title)}: ${formattedBid} kr. Öppna din portal för att se.`,
    heroContent: `
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.65);">Nytt bud inkommet</p>
      <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Hej ${esc(d.fornamn)}!</h1>
      ${d.regnummer ? `<span style="font-size:13px;font-family:monospace;letter-spacing:0.08em;color:rgba(255,255,255,0.75);background:rgba(255,255,255,0.12);display:inline-block;padding:4px 12px;border-radius:6px;">${esc(d.regnummer)}</span>` : ""}
    `,
    bodyContent: `
      <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.7;">
        Det har kommit ett nytt bud på <strong>${esc(d.title)}</strong>!
      </p>

      <!-- Bid highlight box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#f0f9ff;border:2px solid #bfdbfe;border-radius:12px;padding:20px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">Högsta bud just nu</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#0e6efe;letter-spacing:-0.02em;">${esc(formattedBid)} <span style="font-size:20px;font-weight:600;">kr</span></p>
            <p style="margin:8px 0 0;font-size:13px;color:#64748b;">${d.budCount === 1 ? "1 bud totalt" : `${d.budCount} bud totalt`}</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
        Logga in på din personliga portal för att se alla bud, följa auktionen och fatta beslut när den är klar.
      </p>

      <div style="margin-top:8px;text-align:center;">
        <a href="${escAttr(d.portalUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.02em;">
          Se dina bud &rarr;
        </a>
      </div>

      <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
        Du får detta mail eftersom du har en aktiv auktion hos Bilto.<br>
        Frågor? Skriv till <a href="mailto:hej@bilto.se" style="color:#64748b;">hej@bilto.se</a>
      </p>
    `,
  });
}

function emailShell(opts: {
  site: string;
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
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Logo -->
        <tr><td style="padding:0;line-height:0;">
          <a href="${escAttr(opts.site)}" style="text-decoration:none;display:block;">
            <img src="${escAttr(LOGO_URL)}" alt="Bilto" width="580" style="width:100%;max-width:580px;height:auto;display:block;border-radius:16px 16px 0 0;" />
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Hero -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#0a4fd4 0%,#0e6efe 60%,#3b87ff 100%);padding:36px 40px 32px;text-align:center;">
              ${opts.heroContent}
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 32px;">
              ${opts.bodyContent}
            </td></tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 40px;">
              <div style="border-top:1px solid #e2e8f0;"></div>
            </td></tr>
          </table>

          <!-- Signature -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:24px 40px 36px;">
              <p style="margin:0 0 2px;font-size:14px;color:#64748b;line-height:1.6;">Med vänliga hälsningar,</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">Teamet på Bilto</p>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#64748b;text-decoration:none;font-weight:500;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${escAttr(opts.site)}" style="color:#64748b;text-decoration:none;font-weight:500;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} Bilto. Alla rättigheter förbehållna.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escAttr(s: string | null | undefined): string { return esc(s); }
function truncate(s: string, n: number): string { return s.length > n ? s.slice(0, n) : s; }

function isPublicUrl(u: string): boolean {
  if (!u) return false;
  try {
    const h = new URL(u).hostname.toLowerCase();
    if (!h || h === "localhost" || h.endsWith(".local")) return false;
    if (h.includes("webcontainer") || h.includes("stackblitz") || h.includes("credentialless")) return false;
    if (h.endsWith(".bolt.new") || h.includes("bolt.new")) return false;
    return true;
  } catch { return false; }
}
