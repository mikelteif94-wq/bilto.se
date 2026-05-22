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
    const providedUrl: string | undefined = body?.tracking_url;

    if (!carId) {
      return jsonResp({ error: "car_id saknas" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select(
        "id, regnummer, marke, modell, ar, access_token, customers(namn, mejl)",
      )
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

    const safeProvidedUrl = providedUrl && isPublicUrl(providedUrl) ? providedUrl : null;

    const trackingUrl =
      safeProvidedUrl ||
      (appUrl && car.access_token
        ? `${appUrl.replace(/\/$/, "")}/min-bil/${car.access_token}`
        : "");

    if (!resendKey) {
      await supabase.from("notifications_log").insert({
        typ: "mejl_bekraftelse_kund",
        mottagare_mejl: customer.mejl,
        status: "failed",
        referens_id: car.id,
        detaljer: "RESEND_API_KEY saknas",
      });
      return jsonResp({ error: "RESEND_API_KEY saknas" }, 500);
    }

    const rawFirst = (customer.namn ?? "").trim().split(/\s+/)[0] ?? "";
    const fornamn = rawFirst
      ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()
      : (customer.namn ?? "");

    const html = renderEmail({ fornamn, regnummer: car.regnummer, trackingUrl, appUrl });

    const text = [
      `Hej ${fornamn}!`,
      "",
      "Tack — nu är vi igång!",
      "En av våra experter ringer dig inom kort för att gå igenom nästa steg.",
      "",
      "Under tiden kan du luta dig tillbaka.",
      trackingUrl ? `Skapa ditt konto och följ ärendet här: ${trackingUrl}` : undefined,
      "",
      "Vi hörs snart!",
      "Hälsningar, Teamet på Bilto",
    ].filter((v): v is string => v !== undefined).join("\n");

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
          subject: `Tack ${fornamn}! Vi ringer dig snart`,
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
      typ: "mejl_bekraftelse_kund",
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
  trackingUrl: string;
  appUrl: string;
}): string {
  const site = d.appUrl ? d.appUrl.replace(/\/$/, "") : SITE;

  return emailShell({
    site,
    preheader: `Hej ${esc(d.fornamn)}! Vi har tagit emot din bil och hör av oss snart.`,
    title: `Hej ${esc(d.fornamn)}!`,
    subtitle: "Vi har tagit emot din bil och &auml;r redo att s&auml;tta ig&aring;ng!",
    bodyContent: `
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">En av v&aring;ra experter ringer dig inom kort f&ouml;r att g&aring; igenom n&auml;sta steg och svara p&aring; alla fr&aring;gor du har.</p>
      ${d.regnummer ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b;">Registreringsnummer: <strong style="color:#0f172a;font-family:monospace;">${esc(d.regnummer)}</strong></p>` : ""}
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">Under tiden kan du luta dig tillbaka &mdash; vi sk&ouml;ter allt och h&ouml;r av oss snart!</p>
      ${d.trackingUrl ? `<a href="${escAttr(d.trackingUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:15px;letter-spacing:0.01em;">Skapa konto &amp; f&ouml;lj din bil &rarr;</a>` : ""}
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
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px 40px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- Blue header strip with logo -->
            <tr><td style="background:#0e6efe;padding:20px 28px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <a href="${escAttr(opts.site)}" style="text-decoration:none;display:inline-block;">
                      <img src="${escAttr(LOGO_URL)}" alt="Bilto" width="90" style="width:90px;height:auto;display:block;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-size:12px;color:rgba(255,255,255,0.75);font-weight:500;">bilto.se</span>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Title band -->
            <tr><td style="background:#0f172a;padding:22px 28px 20px;">
              <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">${opts.title}</h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.82);line-height:1.5;">${opts.subtitle}</p>
            </td></tr>

            <!-- Body -->
            <tr><td style="padding:28px 28px 24px;">
              ${opts.bodyContent}
            </td></tr>

            <!-- Footer inside card -->
            <tr><td style="padding:0 28px 24px;border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding-top:20px;">
                <tr>
                  <td valign="middle">
                    <p style="margin:0 0 1px;font-size:13px;color:#64748b;">Med v&auml;nliga h&auml;lsningar,</p>
                    <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet p&aring; Bilto</p>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${escAttr(opts.site)}" style="text-decoration:none;">
                      <img src="${escAttr(LOGO_URL)}" alt="Bilto" width="54" style="width:54px;height:auto;display:block;opacity:0.55;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td></tr>

          </table>
        </td></tr>

        <!-- Below card -->
        <tr><td align="center" style="padding-top:18px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#94a3b8;text-decoration:none;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${escAttr(opts.site)}" style="color:#94a3b8;text-decoration:none;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${year} Bilto. Alla r&auml;ttigheter f&ouml;rbeh&aring;llna.</p>
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
