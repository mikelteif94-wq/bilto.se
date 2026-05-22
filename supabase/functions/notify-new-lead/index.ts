import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_SVG_URL = "https://bilto.se/bilto_logo_transparent_(1).svg";
const SITE = "https://bilto.se";

const SOURCE_LABELS: Record<string, string> = {
  "Startsidan": "Startsidan",
  "Blogg": "Blogginlägg",
  "Köp-rådgivning": "Köprådgivning",
  "Telefonrådgivning": "Telefonrådgivning (Säljsidan)",
  "Förmedlingskalkylator": "Förmedlingskalkylatorn",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const internalRecipient = Deno.env.get("INTERNAL_INBOX_EMAIL") ?? Deno.env.get("ADMIN_EMAIL") ?? "hej@bilto.se";

    const body = await req.json().catch(() => ({}));
    const telefon: string = body?.telefon ?? "";
    const regnummer: string = body?.regnummer ?? "";
    const namn: string = body?.namn ?? "";
    const email: string = body?.email ?? "";
    const source: string = body?.source ?? "";
    const guidanceRequested: boolean = body?.guidance_requested ?? false;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const sourceLabel = SOURCE_LABELS[source] || source || "Okänd källa";
    const isGuidance = guidanceRequested;

    // --- Internal notification email ---
    const internalSubject = isGuidance
      ? `Ny rådgivningsförfrågan${namn ? " från " + namn : ""} — Bilto`
      : `Nytt lead${regnummer ? ": " + regnummer : ""} via ${sourceLabel} — Bilto`;

    const internalHtml = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <tr><td style="padding:20px 24px 16px;background:#0e6efe;">
      <h1 style="margin:0;color:#ffffff;font-size:18px;line-height:1.3;">${isGuidance ? "Ny rådgivningsförfrågan" : "Nytt lead"}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Källa: ${escHtml(sourceLabel)}</p>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${namn ? detailRow("Namn", namn) : ""}
        ${telefon ? detailRow("Telefon", telefon) : ""}
        ${email ? detailRow("E-post", email) : ""}
        ${regnummer ? detailRow("Registreringsnummer", regnummer) : ""}
        ${isGuidance ? detailRow("Typ", "Rådgivning (ringer upp)") : ""}
        ${detailRow("Källa", sourceLabel)}
      </table>
    </td></tr>
    <tr><td style="padding:0 24px 16px;color:#94a3b8;font-size:12px;">
      Bilto AB &middot; hej@bilto.se
    </td></tr>
  </table>
</body></html>`;

    let internalOk = false;
    let internalDetails = "";

    if (resendKey) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [internalRecipient],
            subject: internalSubject,
            html: internalHtml,
          }),
        });
        internalOk = resp.ok;
        if (!resp.ok) internalDetails = await resp.text();
      } catch (err) {
        internalDetails = (err as Error).message;
      }
    } else {
      internalDetails = "RESEND_API_KEY saknas";
    }

    await supabase.from("notifications_log").insert({
      typ: "lead_internal",
      mottagare_mejl: internalRecipient,
      status: internalOk ? "sent" : "failed",
      detaljer: internalDetails.slice(0, 500),
    });

    // --- Customer confirmation email ---
    let customerOk = false;
    let customerDetails = "";

    if (email && resendKey) {
      const firstName = namn.split(" ")[0] || "du";
      const customerSubject = isGuidance
        ? "Vi ringer upp dig snart — Bilto"
        : "Tack för ditt intresse — Bilto";

      const bodyText = isGuidance
        ? `En av våra bilrådgivare ringer upp dig på ${telefon || "ditt nummer"} inom kort för att hjälpa dig vidare. Vi ser fram emot att prata med dig!`
        : `Vi har tagit emot ditt intresse för din bil${regnummer ? " (" + regnummer + ")" : ""}. En av våra bilexperter kontaktar dig på ${telefon || "ditt nummer"} inom kort med en värdering.`;

      const customerHtml = renderCustomerEmail({ firstName, isGuidance, bodyText, telefon });

      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: customerSubject,
            html: customerHtml,
          }),
        });
        customerOk = resp.ok;
        if (!resp.ok) customerDetails = await resp.text();
      } catch (err) {
        customerDetails = (err as Error).message;
      }

      await supabase.from("notifications_log").insert({
        typ: "lead_customer_confirmation",
        mottagare_mejl: email,
        status: customerOk ? "sent" : "failed",
        detaljer: customerDetails.slice(0, 500),
      });
    }

    return new Response(
      JSON.stringify({ ok: internalOk, customer_ok: customerOk }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function renderCustomerEmail(d: {
  firstName: string;
  isGuidance: boolean;
  bodyText: string;
  telefon: string;
}): string {
  const title = d.isGuidance ? "Vi ringer upp dig snart!" : "Tack f&ouml;r ditt intresse!";
  const subtitle = d.isGuidance
    ? "R&aring;dgivning bokad &mdash; vi h&ouml;rs snart."
    : "En expert kontaktar dig inom kort.";

  return emailShell({
    preheader: `Hej ${escHtml(d.firstName)}! ${d.isGuidance ? "Vi ringer upp dig inom kort." : "En expert kontaktar dig snart."}`,
    title: `Hej ${escHtml(d.firstName)}!`,
    subtitle,
    bodyContent: `
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">${escHtml(d.bodyText)}</p>
      <div style="background:#eff6ff;border-left:3px solid #0e6efe;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 8px;">
        <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">Har du fr&aring;gor? Svara p&aring; det h&auml;r mailet eller kontakta oss p&aring; <a href="mailto:hej@bilto.se" style="color:#0e6efe;font-weight:600;text-decoration:none;">hej@bilto.se</a>.</p>
      </div>
    `,
  });
}

function emailShell(opts: {
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
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

        <!-- Blue logo strip -->
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <a href="${SITE}" style="text-decoration:none;display:inline-block;">
            <img src="${LOGO_SVG_URL}" alt="Bilto" width="110" style="width:110px;height:auto;display:block;" />
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
            <a href="${SITE}" style="color:#94a3b8;text-decoration:none;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${year} Bilto</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:40%;">${escHtml(label)}</td>
    <td style="padding:7px 0;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;">${escHtml(value)}</td>
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
