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
    if (!carId) {
      return jsonResp({ error: "car_id saknas" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: car } = await supabase
      .from("cars")
      .select("id, regnummer, marke, modell, ar, miltal, vinnande_bud_id, customer_id")
      .eq("id", carId)
      .maybeSingle();

    if (!car) return jsonResp({ error: "Bil saknas" }, 404);
    if (!car.vinnande_bud_id) return jsonResp({ error: "Inget vinnande bud" }, 400);

    const { data: bid } = await supabase
      .from("bids")
      .select("id, dealer_id, belopp, kommentar")
      .eq("id", car.vinnande_bud_id)
      .maybeSingle();
    if (!bid) return jsonResp({ error: "Bud saknas" }, 404);

    const { data: dealer } = await supabase
      .from("dealers")
      .select("id, foretagsnamn, kontaktperson, telefon, mejl")
      .eq("id", bid.dealer_id)
      .maybeSingle();

    const { data: customer } = await supabase
      .from("customers")
      .select("id, namn, telefon, mejl")
      .eq("id", car.customer_id)
      .maybeSingle();

    if (!dealer?.mejl) return jsonResp({ error: "Handlare saknas" }, 404);

    if (!resendKey) {
      await supabase.from("notifications_log").insert({
        typ: "bud_accepterat_handlare",
        mottagare_mejl: dealer.mejl,
        status: "failed",
        referens_id: car.id,
        detaljer: "RESEND_API_KEY saknas",
      });
      return jsonResp({ ok: true, warning: "RESEND_API_KEY saknas" }, 200);
    }

    const title = [car.marke, car.modell].filter(Boolean).join(" ") || "bilen";
    const fname = dealer.kontaktperson?.split(" ")[0] || dealer.foretagsnamn;
    const detailUrl = `${appUrl.replace(/\/$/, "")}/handlare/bilar/${car.id}`;
    const formattedBid = formatKr(bid.belopp);

    const subject = `Grattis ${fname} – kunden har accepterat ditt bud på ${title}`;

    const html = renderEmail({ fname, title, regnummer: car.regnummer, formattedBid, customer, detailUrl, appUrl });

    const text = [
      `Grattis ${dealer.foretagsnamn}!`,
      "",
      `Kunden har accepterat ditt bud på ${formattedBid} kr för ${title} (${car.regnummer}).`,
      "Kontakta säljaren inom 24 timmar för att bestämma upphämtning, betalning och papper.",
      "",
      customer ? `Säljare: ${customer.namn}` : "",
      customer ? `Telefon: ${customer.telefon}` : "",
      customer ? `Mejl: ${customer.mejl}` : "",
      "",
      `Öppna bilen: ${detailUrl}`,
      "",
      "Hälsningar, Bilto",
    ].filter(Boolean).join("\n");

    let status: "sent" | "failed" = "sent";
    let detaljer = "";
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: fromEmail, to: [dealer.mejl], subject, html, text }),
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
      typ: "bud_accepterat_handlare",
      mottagare_mejl: dealer.mejl,
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
  fname: string;
  title: string;
  regnummer: string;
  formattedBid: string;
  customer: { namn: string; telefon: string; mejl: string } | null;
  detailUrl: string;
  appUrl: string;
}): string {
  const site = d.appUrl ? d.appUrl.replace(/\/$/, "") : SITE;

  const customerRows = d.customer ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:8px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">S&auml;ljarens kontaktuppgifter</td>
      </tr>
      <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;width:110px;border-top:1px solid #e2e8f0;">Namn</td><td style="padding:8px 14px;font-size:14px;color:#0f172a;font-weight:600;border-top:1px solid #e2e8f0;">${esc(d.customer.namn)}</td></tr>
      <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Telefon</td><td style="padding:8px 14px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="tel:${escAttr(d.customer.telefon)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">${esc(d.customer.telefon)}</a></td></tr>
      <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">E-post</td><td style="padding:8px 14px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="mailto:${escAttr(d.customer.mejl)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">${esc(d.customer.mejl)}</a></td></tr>
    </table>` : "";

  return emailShell({
    site,
    preheader: `Grattis ${esc(d.fname)}! Kunden har accepterat ditt bud på ${esc(d.formattedBid)} kr för ${esc(d.title)}.`,
    title: `Grattis ${esc(d.fname)}!`,
    subtitle: "Kunden har accepterat ditt bud &mdash; aff&auml;ren &auml;r klar att slutf&ouml;ras!",
    bodyContent: `
      ${d.regnummer ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Registreringsnummer: <strong style="color:#0f172a;font-family:monospace;">${esc(d.regnummer)}</strong></p>` : ""}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:18px 20px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">Accepterat bud</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#16a34a;letter-spacing:-0.02em;">${esc(d.formattedBid)} <span style="font-size:18px;font-weight:600;">kr</span></p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">Kontakta s&auml;ljaren inom <strong>24 timmar</strong> f&ouml;r att best&auml;mma uph&auml;mtning, betalning och pappersarbete.</p>

      ${customerRows}

      <a href="${escAttr(d.detailUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff !important;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:15px;letter-spacing:0.01em;-webkit-text-fill-color:#ffffff !important;"><span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;">&Ouml;ppna i handlarportalen &rarr;</span></a>
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
function formatKr(v: number): string { return (v ?? 0).toLocaleString("sv-SE"); }
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
