import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    // --- Internal notification email to hej@bilto.se ---
    const internalSubject = isGuidance
      ? `Ny rådgivningsförfrågan${namn ? " från " + namn : ""} — Bilto`
      : `Nytt lead${regnummer ? ": " + regnummer : ""} via ${sourceLabel} — Bilto`;

    const internalHtml = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:28px 32px;background:#0e6efe;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;line-height:1.3;">${isGuidance ? "Ny rådgivningsförfrågan" : "Nytt lead"}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Källa: ${escHtml(sourceLabel)}</p>
    </td></tr>
    <tr><td style="padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${namn ? detailRow("Namn", namn) : ""}
        ${telefon ? detailRow("Telefon", telefon) : ""}
        ${email ? detailRow("E-post", email) : ""}
        ${regnummer ? detailRow("Registreringsnummer", regnummer) : ""}
        ${isGuidance ? detailRow("Typ", "Rådgivning (ringer upp)") : ""}
        ${detailRow("Källa", sourceLabel)}
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 24px;color:#94a3b8;font-size:12px;">
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
            to: ["hej@bilto.se"],
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
      mottagare_mejl: "hej@bilto.se",
      status: internalOk ? "sent" : "failed",
      detaljer: internalDetails.slice(0, 500),
    });

    // --- Customer confirmation email (only if email provided) ---
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

      const customerHtml = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:28px 32px;background:#0e6efe;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;">Hej ${escHtml(firstName)}!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">${isGuidance ? "Din rådgivningsförfrågan är mottagen." : "Din intresseanmälan är mottagen."}</p>
    </td></tr>
    <tr><td style="padding:24px 32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">${escHtml(bodyText)}</p>
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">Har du frågor i mellanåt? Kontakta oss på <a href="mailto:hej@bilto.se" style="color:#0e6efe;font-weight:600;">hej@bilto.se</a>.</p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;color:#64748b;font-size:14px;line-height:1.7;">
      <p style="margin:0;">Med vänliga hälsningar,<br><strong style="color:#334155;">Teamet på Bilto</strong></p>
    </td></tr>
    <tr><td style="padding:0 32px 24px;color:#94a3b8;font-size:12px;">
      Bilto AB &middot; hej@bilto.se
    </td></tr>
  </table>
</body></html>`;

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

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:40%;">${escHtml(label)}</td>
    <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${escHtml(value)}</td>
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
