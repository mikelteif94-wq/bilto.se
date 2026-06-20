import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
const SITE = "https://bilto.se";

const SYFTE_LABELS: Record<string, string> = {
  kop_bil: "Köpa bil",
  salj_bil: "Sälja bil",
  inbyte: "Inbyte",
  finansiering: "Finansiering",
  ovrig: "Annat",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const adminEmail = Deno.env.get("INTERNAL_INBOX_EMAIL") ?? Deno.env.get("ADMIN_EMAIL") ?? "hej@bilto.se";

    const body = await req.json().catch(() => ({}));
    const { namn, telefon, email, syfte, booking_date, booking_time, meddelande } = body;

    const syfteLabel = SYFTE_LABELS[syfte] ?? syfte ?? "–";
    const firstName = (namn ?? "").split(" ")[0] || "du";

    // Format date nicely
    const dateObj = booking_date ? new Date(booking_date + "T12:00:00") : null;
    const dayNames = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
    const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const dateLabel = dateObj
      ? `${dayNames[dateObj.getDay()]} ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`
      : booking_date ?? "–";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const year = new Date().getFullYear();

    // ── Admin notification ──────────────────────────────────────
    const adminSubject = `Ny konsultationsbokning${namn ? " – " + namn : ""} · ${dateLabel} kl. ${booking_time ?? "–"}`;
    const adminHtml = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <tr><td style="padding:20px 24px 16px;background:#0e6efe;">
      <h1 style="margin:0;color:#ffffff;font-size:18px;">Ny konsultationsbokning</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${escHtml(dateLabel)} kl. ${escHtml(booking_time ?? "–")}</p>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row("Namn", namn)}
        ${row("Telefon", telefon)}
        ${email ? row("E-post", email) : ""}
        ${row("Ärende", syfteLabel)}
        ${row("Datum", dateLabel)}
        ${row("Tid", `kl. ${booking_time ?? "–"}`)}
        ${meddelande ? row("Meddelande", meddelande) : ""}
      </table>
    </td></tr>
    <tr><td style="padding:0 24px 16px;color:#94a3b8;font-size:12px;">Bilto AB · hej@bilto.se</td></tr>
  </table>
</body></html>`;

    let adminOk = false;
    if (resendKey) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [adminEmail], subject: adminSubject, html: adminHtml }),
      });
      adminOk = r.ok;
    }

    await supabase.from("notifications_log").insert({
      typ: "consultation_admin",
      mottagare_mejl: adminEmail,
      status: adminOk ? "sent" : "failed",
      detaljer: resendKey ? "" : "RESEND_API_KEY saknas",
    });

    // ── Customer confirmation ───────────────────────────────────
    let customerOk = false;
    if (email && resendKey) {
      const customerSubject = `Bokningsbekräftelse – konsultation ${dateLabel} kl. ${booking_time ?? "–"} · Bilto`;
      const customerHtml = `<!doctype html>
<html lang="sv">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Bilto</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Din konsultation är bokad – vi ringer ${escHtml(booking_time ?? "")} på ${escHtml(dateLabel)}.</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <a href="${SITE}"><img src="${LOGO_URL}" alt="Bilto" width="220" style="width:220px;height:auto;display:block;"/></a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px 28px 28px;">
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Hej ${escHtml(firstName)}!</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Din konsultation är bekräftad.</p>

          <div style="background:#eff6ff;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Bokad tid</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:#0e6efe;">${escHtml(dateLabel)} kl. ${escHtml(booking_time ?? "–")}</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            ${row("Namn", namn)}
            ${row("Telefon", telefon)}
            ${row("Ärende", syfteLabel)}
          </table>

          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
            En av våra bilexperter ringer upp dig på <strong>${escHtml(telefon ?? "")}</strong> vid den bokade tiden. Vi ser fram emot att prata med dig!
          </p>

          <div style="background:#f8fafc;border-left:3px solid #0e6efe;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:8px;">
            <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">Behöver du ändra eller avboka? Kontakta oss på <a href="mailto:hej@bilto.se" style="color:#0e6efe;font-weight:600;text-decoration:none;">hej@bilto.se</a>.</p>
          </div>

          <div style="border-top:1px solid #e2e8f0;margin:28px 0 20px;"></div>
          <p style="margin:0 0 2px;font-size:13px;color:#94a3b8;">Med vänliga hälsningar,</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet på Bilto</p>
        </td></tr>
        <tr><td align="center" style="padding-top:16px;">
          <p style="margin:0 0 3px;font-size:12px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#94a3b8;text-decoration:none;">hej@bilto.se</a>
            &nbsp;·&nbsp;
            <a href="${SITE}" style="color:#94a3b8;text-decoration:none;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${year} Bilto</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [email], subject: customerSubject, html: customerHtml }),
      });
      customerOk = r.ok;

      await supabase.from("notifications_log").insert({
        typ: "consultation_customer",
        mottagare_mejl: email,
        status: customerOk ? "sent" : "failed",
        detaljer: "",
      });
    }

    return new Response(
      JSON.stringify({ ok: adminOk, customer_ok: customerOk }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:40%;">${escHtml(label)}</td>
    <td style="padding:7px 0;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;">${escHtml(value ?? "–")}</td>
  </tr>`;
}

function escHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
