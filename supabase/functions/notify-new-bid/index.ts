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

    const { count: totalBids } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId);

    const { data: bidsData } = await supabase
      .from("bids")
      .select("belopp")
      .eq("car_id", carId)
      .order("belopp", { ascending: false })
      .limit(1);
    const highestBid = bidsData?.[0]?.belopp ?? bidAmount ?? 0;

    const portalUrl = (car as { access_token?: string }).access_token
      ? `${appUrl.replace(/\/$/, "")}/min-bil/${(car as { access_token: string }).access_token}`
      : `${appUrl.replace(/\/$/, "")}/logga-in?mejl=${encodeURIComponent(customer.mejl)}`;

    const loginUrl = `${appUrl.replace(/\/$/, "")}/logga-in?mejl=${encodeURIComponent(customer.mejl)}`;
    const registerUrl = `${appUrl.replace(/\/$/, "")}/logga-in`;

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
    const maskedBid = maskBid(highestBid);

    const html = renderEmail({ fornamn, regnummer: (car as any).regnummer, title, maskedBid, budCount, loginUrl, registerUrl, appUrl });

    const text = [
      `Hej ${fornamn}!`,
      "",
      `Det har kommit ett bud på ${title} (${(car as any).regnummer}).`,
      "",
      `Det finns ${budCount === 1 ? "1 bud" : `${budCount} bud`} — logga in för att se det fullständiga beloppet.`,
      "",
      `Logga in: ${loginUrl}`,
      `Inget konto? Skapa ett: ${registerUrl}`,
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
          subject: `${fornamn}, du har fått ett bud på ${title}!`,
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
  maskedBid: string;
  budCount: number;
  loginUrl: string;
  registerUrl: string;
  appUrl: string;
}): string {
  const site = d.appUrl ? d.appUrl.replace(/\/$/, "") : SITE;

  return emailShell({
    site,
    preheader: `${esc(d.fornamn)}, du har fått ett bud på ${esc(d.title)}! Logga in för att se beloppet.`,
    title: `Hej ${esc(d.fornamn)}!`,
    subtitle: `Du har f&aring;tt ett bud p&aring; ${esc(d.title)}`,
    bodyContent: `
      ${d.regnummer ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Registreringsnummer: <strong style="color:#0f172a;font-family:monospace;">${esc(d.regnummer)}</strong></p>` : ""}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#f0f9ff;border:2px solid #bfdbfe;border-radius:10px;padding:18px 20px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">Inkommet bud</p>
            <p style="margin:0;font-size:34px;font-weight:800;color:#0e6efe;letter-spacing:0.05em;filter:blur(6px);user-select:none;">${esc(d.maskedBid)} <span style="font-size:18px;font-weight:600;">kr</span></p>
            <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;font-style:italic;">Logga in f&ouml;r att se det fullst&auml;ndiga beloppet</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">Logga in p&aring; din portal f&ouml;r att se hela budet, f&ouml;lja auktionen och fatta beslut n&auml;r den st&auml;nger.</p>

      <a href="${escAttr(d.loginUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff !important;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:15px;letter-spacing:0.01em;-webkit-text-fill-color:#ffffff !important;"><span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;">Visa mitt bud &rarr;</span></a>

      <p style="margin:14px 0 0;font-size:13px;color:#94a3b8;">
        Har du inget konto? <a href="${escAttr(d.registerUrl)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">Skapa konto f&ouml;r att se budet</a>
      </p>
    `,
  });
}

function emailShell(opts: {
  site: string;
  preheader: string;
  title: string;
  subtitle: string;
  bodyContent: string;
}): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="sv" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>Bilto</title>
<style>
:root { color-scheme: light only; supported-color-schemes: light only; }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color-scheme:light;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

        <!-- Blue logo strip -->
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <a href="${escAttr(opts.site)}" style="text-decoration:none;display:inline-block;">
            <img src="${escAttr(LOGO_URL)}" alt="Bilto" width="220" style="width:220px;height:auto;display:block;" />
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
            <a href="${escAttr(opts.site)}" style="color:#94a3b8;text-decoration:none;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${year} Bilto</p>
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

function maskBid(amount: number): string {
  const s = Math.round(amount).toLocaleString("sv-SE");
  // Keep first digit, mask the rest with •
  return s.slice(0, 1) + s.slice(1).replace(/\d/g, "•");
}

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
