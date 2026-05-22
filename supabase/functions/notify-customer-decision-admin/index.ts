import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
const SITE = "https://bilto.se";
const ADMIN_EMAIL = "hej@bilto.se";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = "https://bilto.se";

    const body = await req.json().catch(() => ({}));
    const carId: string | undefined = body?.car_id;
    if (!carId) return jsonResp({ error: "car_id saknas" }, 400);

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

    const { data: bid } = car.vinnande_bud_id ? await supabase
      .from("bids")
      .select("belopp, dealer_id")
      .eq("id", car.vinnande_bud_id)
      .maybeSingle() : { data: null };

    const { data: dealer } = bid?.dealer_id ? await supabase
      .from("dealers")
      .select("foretagsnamn, kontaktperson, telefon, mejl")
      .eq("id", bid.dealer_id)
      .maybeSingle() : { data: null };

    const { data: customer } = car.customer_id ? await supabase
      .from("customers")
      .select("namn, telefon, mejl")
      .eq("id", car.customer_id)
      .maybeSingle() : { data: null };

    const title = [car.marke, car.modell].filter(Boolean).join(" ") || "bilen";
    const adminCarUrl = `${appUrl}/admin/bilar/${car.id}`;
    const formattedBid = bid ? formatKr(bid.belopp) : "–";

    const subject = `Kund har accepterat bud — ${title} (${car.regnummer ?? ""})`;

    const html = `<!doctype html>
<html lang="sv">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Bilto Admin</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <img src="${LOGO_URL}" alt="Bilto" width="220" style="width:220px;height:auto;display:block;" />
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px 28px 28px;">
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Affär klar!</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;">En kund har accepterat ett bud &mdash; f&ouml;lj upp och hj&auml;lp till att slutf&ouml;ra aff&auml;ren.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;"><td colspan="2" style="padding:8px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Bil</td></tr>
            <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;width:110px;border-top:1px solid #e2e8f0;">Modell</td><td style="padding:8px 14px;font-size:14px;color:#0f172a;font-weight:600;border-top:1px solid #e2e8f0;">${esc(title)}</td></tr>
            ${car.regnummer ? `<tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Reg.nr</td><td style="padding:8px 14px;font-size:14px;color:#0f172a;font-family:monospace;font-weight:700;border-top:1px solid #e2e8f0;">${esc(car.regnummer)}</td></tr>` : ""}
            ${bid ? `<tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Accepterat bud</td><td style="padding:8px 14px;font-size:20px;color:#16a34a;font-weight:800;border-top:1px solid #e2e8f0;">${esc(formattedBid)} kr</td></tr>` : ""}
          </table>

          ${dealer ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;"><td colspan="2" style="padding:8px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Vinnande handlare</td></tr>
            <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;width:110px;border-top:1px solid #e2e8f0;">Firma</td><td style="padding:8px 14px;font-size:14px;color:#0f172a;font-weight:600;border-top:1px solid #e2e8f0;">${esc(dealer.foretagsnamn)}</td></tr>
            ${dealer.kontaktperson ? `<tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Kontakt</td><td style="padding:8px 14px;font-size:14px;color:#0f172a;border-top:1px solid #e2e8f0;">${esc(dealer.kontaktperson)}</td></tr>` : ""}
            ${dealer.telefon ? `<tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Telefon</td><td style="padding:8px 14px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="tel:${esc(dealer.telefon)}" style="color:#0e6efe;font-weight:600;">${esc(dealer.telefon)}</a></td></tr>` : ""}
            ${dealer.mejl ? `<tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">E-post</td><td style="padding:8px 14px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="mailto:${esc(dealer.mejl)}" style="color:#0e6efe;font-weight:600;">${esc(dealer.mejl)}</a></td></tr>` : ""}
          </table>` : ""}

          ${customer ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;"><td colspan="2" style="padding:8px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">S&auml;ljare (kund)</td></tr>
            <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;width:110px;border-top:1px solid #e2e8f0;">Namn</td><td style="padding:8px 14px;font-size:14px;color:#0f172a;font-weight:600;border-top:1px solid #e2e8f0;">${esc(customer.namn)}</td></tr>
            <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Telefon</td><td style="padding:8px 14px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="tel:${esc(customer.telefon)}" style="color:#0e6efe;font-weight:600;">${esc(customer.telefon)}</a></td></tr>
            <tr><td style="padding:8px 14px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">E-post</td><td style="padding:8px 14px;font-size:14px;border-top:1px solid #e2e8f0;"><a href="mailto:${esc(customer.mejl)}" style="color:#0e6efe;font-weight:600;">${esc(customer.mejl)}</a></td></tr>
          </table>` : ""}

          <a href="${esc(adminCarUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff !important;text-decoration:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:14px;">
            &Ouml;ppna bilen i admin &rarr;
          </a>

          <div style="border-top:1px solid #e2e8f0;margin:28px 0 20px;"></div>
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet p&aring; Bilto</p>
        </td></tr>
        <tr><td align="center" style="padding-top:16px;">
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} Bilto &nbsp;&middot;&nbsp; <a href="mailto:hej@bilto.se" style="color:#94a3b8;text-decoration:none;">hej@bilto.se</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      `Affär klar: ${title} (${car.regnummer ?? ""})`,
      `Accepterat bud: ${formattedBid} kr`,
      dealer ? `Handlare: ${dealer.foretagsnamn} — ${dealer.telefon ?? ""} — ${dealer.mejl ?? ""}` : "",
      customer ? `Säljare: ${customer.namn} — ${customer.telefon} — ${customer.mejl}` : "",
      `Admin: ${adminCarUrl}`,
    ].filter(Boolean).join("\n");

    let status: "sent" | "failed" = "sent";
    let detaljer = "";

    if (!resendKey) {
      status = "failed";
      detaljer = "RESEND_API_KEY saknas";
    } else {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: fromEmail, to: [ADMIN_EMAIL], subject, html, text }),
        });
        if (!resp.ok) {
          status = "failed";
          detaljer = truncate(await resp.text(), 500);
        }
      } catch (err) {
        status = "failed";
        detaljer = truncate((err as Error).message, 500);
      }
    }

    await supabase.from("notifications_log").insert({
      typ: "bud_accepterat_admin",
      mottagare_mejl: ADMIN_EMAIL,
      status,
      referens_id: carId,
      detaljer,
    });

    return jsonResp({ ok: status === "sent" }, status === "sent" ? 200 : 500);
  } catch (err) {
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

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

function formatKr(v: number): string { return (v ?? 0).toLocaleString("sv-SE"); }
function truncate(s: string, n: number): string { return s.length > n ? s.slice(0, n) : s; }
