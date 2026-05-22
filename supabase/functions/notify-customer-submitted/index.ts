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

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Tack ${esc(d.fornamn)}! Vi har tagit emot din bil och hör av oss snart.&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Card -->
        <tr><td style="border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- HERO: full blue with logo + check + title + reg -->
            <tr><td style="background:#0e6efe;padding:36px 32px 40px;text-align:center;">

              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding-bottom:32px;">
                  <a href="${escAttr(site)}" style="text-decoration:none;display:inline-block;">
                    <img src="${escAttr(LOGO_URL)}" alt="bilto" width="110" style="width:110px;height:auto;display:block;" />
                  </a>
                </td></tr>
              </table>

              <!-- Check circle -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding-bottom:20px;">
                  <div style="width:72px;height:72px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.6);display:inline-flex;align-items:center;justify-content:center;margin:0 auto;">
                    <!--[if !mso]><!-->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr><td align="center" valign="middle" style="width:72px;height:72px;">
                        <span style="font-size:32px;color:#ffffff;line-height:1;">&#10003;</span>
                      </td></tr>
                    </table>
                    <!--<![endif]-->
                  </div>
                </td></tr>
              </table>

              <!-- Label -->
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:rgba(255,255,255,0.8);">Nu k&ouml;r vi!</p>

              <!-- Heading -->
              <h1 style="margin:0 0 20px;font-size:34px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.5px;">Tack ${esc(d.fornamn)}!</h1>

              <!-- Reg plate pill -->
              ${d.regnummer ? `
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr><td align="center" style="background:rgba(255,255,255,0.2);border-radius:50px;padding:9px 22px;">
                  <span style="font-size:13px;font-family:monospace;font-weight:700;letter-spacing:0.16em;color:#ffffff;">
                    &#128663;&nbsp; ${esc(d.regnummer)}
                  </span>
                </td></tr>
              </table>` : ""}

            </td></tr>

            <!-- BODY: white -->
            <tr><td style="background:#ffffff;padding:36px 32px 0;">

              <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0f172a;line-height:1.3;">Vi har tagit emot din bil och &auml;r redo att s&auml;tta ig&aring;ng!</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">En av v&aring;ra experter ringer dig inom kort f&ouml;r att g&aring; igenom n&auml;sta steg och svara p&aring; alla fr&aring;gor du har.</p>

              <!-- Info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td valign="top" style="background:#f0f6ff;border-radius:14px;padding:18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Icon col -->
                        <td valign="middle" style="width:48px;padding-right:14px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr><td align="center" valign="middle" style="width:44px;height:44px;background:#dbeafe;border-radius:12px;">
                              <span style="font-size:20px;line-height:1;color:#0e6efe;">&#128172;</span>
                            </td></tr>
                          </table>
                        </td>
                        <!-- Text col -->
                        <td valign="middle">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0e6efe;line-height:1.4;">Under tiden kan du luta dig tillbaka</p>
                          <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.5;">&mdash; vi sk&ouml;ter allt och h&ouml;r av oss snart!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              ${d.trackingUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr><td>
                  <a href="${escAttr(d.trackingUrl)}" style="display:block;background:#0e6efe;color:#ffffff;text-decoration:none;border-radius:14px;padding:18px 24px;font-weight:700;font-size:16px;text-align:center;letter-spacing:0.01em;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" valign="middle">
                          <span style="font-size:18px;vertical-align:middle;margin-right:10px;">&#128100;</span>
                          <span style="vertical-align:middle;">Skapa konto &amp; f&ouml;lj din bil</span>
                          <span style="vertical-align:middle;margin-left:10px;font-size:18px;">&rarr;</span>
                        </td>
                      </tr>
                    </table>
                  </a>
                </td></tr>
              </table>` : ""}

            </td></tr>

            <!-- FOOTER inside card: logo icon + team name -->
            <tr><td style="background:#ffffff;padding:0 32px 32px;text-align:center;border-radius:0 0 20px 20px;">
              <div style="border-top:1px solid #f1f5f9;padding-top:24px;">
                <img src="${escAttr(LOGO_URL)}" alt="Bilto" width="52" style="width:52px;height:auto;display:block;margin:0 auto 8px;opacity:0.7;" />
                <p style="margin:0;font-size:13px;font-weight:600;color:#94a3b8;">Teamet p&aring; Bilto</p>
              </div>
            </td></tr>

          </table>
        </td></tr>

        <!-- Below-card footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#94a3b8;text-decoration:none;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${escAttr(site)}" style="color:#94a3b8;text-decoration:none;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} Bilto. Alla r&auml;ttigheter f&ouml;rbeh&aring;llna.</p>
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
