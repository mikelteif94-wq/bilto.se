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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const rawAppUrl = Deno.env.get("APP_URL") ?? "";
    const appUrl = isPublicUrl(rawAppUrl) ? rawAppUrl : SITE;

    const body = await req.json().catch(() => ({}));
    const carId: string | undefined = body?.car_id;

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

    // Only send if customer has no auth account yet (user_id is null)
    const { data: customerRow } = await supabase
      .from("customers")
      .select("user_id")
      .eq("mejl", customer.mejl)
      .maybeSingle();

    if (customerRow?.user_id) {
      return jsonResp({ skipped: true, reason: "Kunden har redan ett konto" }, 200);
    }

    const trackingUrl = appUrl && car.access_token
      ? `${appUrl.replace(/\/$/, "")}/min-bil/${car.access_token}`
      : "";

    if (!resendKey) {
      await supabase.from("notifications_log").insert({
        typ: "mejl_forsta_bud_kund",
        mottagare_mejl: customer.mejl,
        status: "failed",
        referens_id: car.id,
        detaljer: "RESEND_API_KEY saknas",
      });
      return jsonResp({ error: "RESEND_API_KEY saknas" }, 500);
    }

    const fornamn = (customer.namn ?? "").trim().split(" ")[0] || customer.namn;
    const title = [car.marke, car.modell].filter(Boolean).join(" ") || "din bil";

    const html = renderEmail({ fornamn, regnummer: car.regnummer, title, trackingUrl, appUrl });

    const text = [
      `Hej ${fornamn}!`,
      "",
      `Det har kommit in ett bud på ${title} (${car.regnummer}).`,
      "",
      "Skapa ditt konto för att se budet och följa budgivningen live.",
      trackingUrl ? `Klicka här för att skapa ditt konto: ${trackingUrl}` : "",
      "",
      "Hälsningar, Bilto",
    ].filter((v): v is string => v !== undefined && v !== null).join("\n");

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
      typ: "mejl_forsta_bud_kund",
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
  trackingUrl: string;
  appUrl: string;
}): string {
  const site = d.appUrl ? d.appUrl.replace(/\/$/, "") : SITE;
  return emailShell({
    site,
    preheader: `${esc(d.fornamn)}, det har kommit ett bud på ${esc(d.title)}. Skapa ditt konto för att se det.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Nytt bud!</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Hej ${esc(d.fornamn)}!</h1>
      ${d.regnummer ? `<p style="margin:10px 0 0;font-size:14px;font-family:monospace;letter-spacing:0.08em;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.12);display:inline-block;padding:4px 12px;border-radius:6px;">${esc(d.regnummer)}</p>` : ""}
    `,
    bodyContent: `
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.7;font-weight:500;">Det har kommit ett bud på ${esc(d.title)}!</p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Skapa ditt kostnadsfria konto för att se budet och följa hela budgivningen live.</p>
      <div style="background:#f0f9ff;border-left:4px solid #0e6efe;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#0369a1;line-height:1.6;">Det är gratis och tar bara en minut — välj ett lösenord och du är igång!</p>
      </div>
      ${d.trackingUrl ? `
      <div style="margin-top:28px;">
        <a href="${escAttr(d.trackingUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.02em;">Skapa konto och se budet &rarr;</a>
      </div>` : ""}
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

        <!-- Logo bar -->
        <tr><td style="padding:0;line-height:0;">
          <a href="${escAttr(opts.site)}" style="text-decoration:none;display:block;">
            <img src="${escAttr(LOGO_URL)}" alt="Bilto" width="580" style="width:100%;max-width:580px;height:auto;display:block;border-radius:16px 16px 0 0;" />
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Hero -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#0a4fd4 0%,#0e6efe 60%,#3b87ff 100%);padding:40px 40px 36px;text-align:center;">
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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(s: string | null | undefined): string {
  return esc(s);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}

function isPublicUrl(u: string): boolean {
  if (!u) return false;
  try {
    const h = new URL(u).hostname.toLowerCase();
    if (!h) return false;
    if (h === "localhost" || h.endsWith(".local")) return false;
    if (h.includes("webcontainer")) return false;
    if (h.includes("stackblitz")) return false;
    if (h.includes("credentialless")) return false;
    if (h.endsWith(".bolt.new") || h.includes("bolt.new")) return false;
    return true;
  } catch {
    return false;
  }
}
