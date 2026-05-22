import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const safeProvidedUrl =
      providedUrl && isPublicUrl(providedUrl) ? providedUrl : null;

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

    const html = renderEmail({
      fornamn,
      regnummer: car.regnummer,
      trackingUrl,
      appUrl,
    });

    const text = [
      `Hej ${fornamn}!`,
      "",
      "Tack — nu är vi igång!",
      "En av våra experter ringer dig inom kort för att gå igenom nästa steg.",
      "",
      "Under tiden kan du luta dig tillbaka.",
      trackingUrl
        ? `Skapa ditt konto och följ ärendet här: ${trackingUrl}`
        : undefined,
      "",
      "Vi hörs snart!",
      "Hälsningar, Teamet på Bilto",
    ]
      .filter((v): v is string => v !== undefined)
      .join("\n");

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
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Tack ${esc(d.fornamn)}! Vi har tagit emot din bil och h&ouml;r av oss snart.&#847;&#847;&#847;&#847;&#847;</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;padding:24px 12px 40px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:500px;">

      <!-- CARD -->
      <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;">

        <!-- HERO: blue -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr><td align="center" style="background:#1a6eff;padding:32px 28px 36px;">

            <!-- Logo text -->
            <p style="margin:0 0 28px;font-size:26px;font-weight:900;color:#ffffff;font-style:italic;letter-spacing:-1px;">bilto<span style="font-size:14px;font-weight:700;vertical-align:super;letter-spacing:0;">.se</span></p>

            <!-- Check circle -->
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 20px;">
              <tr><td align="center" valign="middle" style="width:68px;height:68px;border-radius:50%;border:2px solid rgba(255,255,255,0.55);">
                <span style="font-size:28px;color:#ffffff;line-height:1;display:block;">&#10003;</span>
              </td></tr>
            </table>

            <!-- Label -->
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.75);">Nu k&ouml;r vi!</p>

            <!-- Heading -->
            <h1 style="margin:0 0 22px;font-size:32px;font-weight:800;color:#ffffff;line-height:1.15;">Tack ${esc(d.fornamn)}!</h1>

            <!-- Reg pill -->
            ${d.regnummer ? `
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
              <tr><td style="background:rgba(255,255,255,0.18);border-radius:100px;padding:8px 20px;">
                <span style="font-size:13px;font-weight:700;letter-spacing:0.18em;color:#ffffff;font-family:monospace;">&#128663;  ${esc(d.regnummer)}</span>
              </td></tr>
            </table>` : ""}

          </td></tr>
        </table>

        <!-- BODY: white -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr><td style="padding:32px 28px 8px;">

            <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#111827;line-height:1.35;">Vi har tagit emot din bil och &auml;r redo att s&auml;tta ig&aring;ng!</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">En av v&aring;ra experter ringer dig inom kort f&ouml;r att g&aring; igenom n&auml;sta steg och svara p&aring; alla fr&aring;gor du har.</p>

            <!-- Info card -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
              <tr>
                <td valign="top" style="background:#f0f5ff;border-radius:12px;padding:16px 18px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td valign="middle" style="width:44px;padding-right:14px;">
                        <table cellpadding="0" cellspacing="0" role="presentation">
                          <tr><td align="center" valign="middle" style="width:40px;height:40px;background:#dce8ff;border-radius:10px;">
                            <span style="font-size:18px;line-height:1;color:#1a6eff;">&#128172;</span>
                          </td></tr>
                        </table>
                      </td>
                      <td valign="middle">
                        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#1a6eff;">Under tiden kan du luta dig tillbaka</p>
                        <p style="margin:0;font-size:13px;color:#4b7cf3;">&mdash; vi sk&ouml;ter allt och h&ouml;r av oss snart!</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            ${d.trackingUrl ? `
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:8px;">
              <tr><td>
                <a href="${escAttr(d.trackingUrl)}" style="display:block;background:#1a6eff;color:#ffffff;text-decoration:none;border-radius:12px;padding:16px 20px;font-weight:700;font-size:15px;text-align:center;">
                  <span style="font-size:16px;vertical-align:middle;margin-right:8px;">&#128100;</span>
                  <span style="vertical-align:middle;">Skapa konto &amp; f&ouml;lj din bil</span>
                  <span style="vertical-align:middle;margin-left:8px;">&rarr;</span>
                </a>
              </td></tr>
            </table>` : ""}

          </td></tr>
        </table>

        <!-- FOOTER inside card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr><td align="center" style="padding:20px 28px 28px;border-top:1px solid #f3f4f6;margin-top:8px;">
            <p style="margin:0 0 2px;font-size:13px;font-weight:800;font-style:italic;color:#1a6eff;letter-spacing:-0.5px;">bilto<span style="font-size:10px;vertical-align:super;font-style:normal;">.se</span></p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">Teamet p&aring; Bilto</p>
          </td></tr>
        </table>

      </td></tr>

      <!-- Below card -->
      <tr><td align="center" style="padding-top:20px;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">
          <a href="mailto:hej@bilto.se" style="color:#9ca3af;text-decoration:none;">hej@bilto.se</a>
          &nbsp;&middot;&nbsp;
          <a href="${escAttr(site)}" style="color:#9ca3af;text-decoration:none;">bilto.se</a>
          &nbsp;&middot;&nbsp;&copy; ${new Date().getFullYear()} Bilto
        </p>
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
