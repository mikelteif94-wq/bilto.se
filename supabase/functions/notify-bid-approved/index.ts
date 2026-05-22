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
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Säljarens kontaktuppgifter</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#64748b;width:110px;border-top:1px solid #e2e8f0;">Namn</td><td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-top:1px solid #e2e8f0;">${esc(d.customer.namn)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Telefon</td><td style="padding:10px 16px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="tel:${escAttr(d.customer.telefon)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">${esc(d.customer.telefon)}</a></td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">E-post</td><td style="padding:10px 16px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="mailto:${escAttr(d.customer.mejl)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">${esc(d.customer.mejl)}</a></td></tr>
    </table>` : "";

  return emailShell({
    site,
    preheader: `Grattis ${esc(d.fname)}! Kunden har accepterat ditt bud på ${esc(d.formattedBid)} kr för ${esc(d.title)}.`,
    heroContent: `
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.65);">Budet är accepterat</p>
      <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Grattis ${esc(d.fname)}!</h1>
      ${d.regnummer ? `<span style="font-size:13px;font-family:monospace;letter-spacing:0.08em;color:rgba(255,255,255,0.75);background:rgba(255,255,255,0.12);display:inline-block;padding:4px 12px;border-radius:6px;">${esc(d.regnummer)}</span>` : ""}
    `,
    bodyContent: `
      <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.7;">
        Kunden har <strong>accepterat ditt bud på ${esc(d.formattedBid)} kr</strong> för <strong>${esc(d.title)}</strong>. Affären är klar att slutföras!
      </p>

      <!-- Bid highlight box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">Accepterat bud</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#16a34a;letter-spacing:-0.02em;">${esc(d.formattedBid)} <span style="font-size:20px;font-weight:600;">kr</span></p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Kontakta säljaren inom <strong>24 timmar</strong> för att bestämma upphämtning, betalning och pappersarbete.
      </p>

      ${customerRows}

      <div style="margin-top:8px;text-align:center;">
        <a href="${escAttr(d.detailUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.02em;">
          Öppna i handlarportalen &rarr;
        </a>
      </div>

      <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
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
