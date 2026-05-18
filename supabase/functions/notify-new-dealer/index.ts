import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DealerRow {
  id: string;
  foretagsnamn: string;
  orgnr: string;
  kontaktperson: string;
  telefon: string;
  mejl: string;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "hej@bilto.se";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    if (!resendKey || !adminEmail) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY eller ADMIN_EMAIL saknas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const dealerId: string | undefined = body?.dealer_id ?? body?.record?.id;
    const inlineDealer = body?.dealer as Partial<DealerRow> | undefined;

    let dealer: DealerRow | null = null;

    if (dealerId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data, error } = await supabase
        .from("dealers")
        .select("id, foretagsnamn, orgnr, kontaktperson, telefon, mejl, created_at")
        .eq("id", dealerId)
        .maybeSingle<DealerRow>();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Kunde inte hämta handlare", details: error?.message }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      dealer = data;
    } else if (inlineDealer && inlineDealer.foretagsnamn && inlineDealer.mejl) {
      dealer = {
        id: "",
        foretagsnamn: inlineDealer.foretagsnamn ?? "",
        orgnr: inlineDealer.orgnr ?? "",
        kontaktperson: inlineDealer.kontaktperson ?? "",
        telefon: inlineDealer.telefon ?? "",
        mejl: inlineDealer.mejl ?? "",
        created_at: new Date().toISOString(),
      };
    } else {
      return new Response(
        JSON.stringify({ error: "dealer_id eller dealer-payload saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminLink = appUrl
      ? `${appUrl.replace(/\/$/, "")}/admin/handlare`
      : "/admin/handlare";

    const subject = `Ny handlaransökan: ${dealer.foretagsnamn}`;

    const html = `<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Ny ansökan</p>
          <h1 style="margin:0;color:#0f172a;font-size:22px;">${escapeHtml(dealer.foretagsnamn)}</h1>
          <p style="margin:6px 0 0;color:#64748b;">${escapeHtml(dealer.orgnr)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <h2 style="margin:0 0 12px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Kontakt</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
            <tr><td style="padding:6px 0;color:#64748b;width:140px;">Kontaktperson</td><td>${escapeHtml(dealer.kontaktperson)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Telefon</td><td><a href="tel:${escapeAttr(dealer.telefon)}" style="color:#0f172a;text-decoration:none;">${escapeHtml(dealer.telefon)}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Mejl</td><td><a href="mailto:${escapeAttr(dealer.mejl)}" style="color:#0f172a;text-decoration:none;">${escapeHtml(dealer.mejl)}</a></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;">
          <a href="${escapeAttr(adminLink)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Granska i admin</a>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = [
      `Ny handlaransökan: ${dealer.foretagsnamn}`,
      "",
      `Orgnr: ${dealer.orgnr}`,
      `Kontaktperson: ${dealer.kontaktperson}`,
      `Telefon: ${dealer.telefon}`,
      `Mejl: ${dealer.mejl}`,
      "",
      `Granska: ${adminLink}`,
    ].join("\n");

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject,
        html,
        text,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      return new Response(
        JSON.stringify({ error: "Resend misslyckades", details: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendJson = await resendResp.json();

    // Bekräftelsemejl till handlaren
    const dealerFornamn = (dealer.kontaktperson ?? "").trim().split(" ")[0] || dealer.kontaktperson;
    const dealerHtml = `<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 6px;color:#0e6efe;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Ansökan mottagen</p>
          <h1 style="margin:0;color:#0f172a;font-size:22px;">Tack, ${escapeHtml(dealerFornamn)}!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;color:#334155;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 12px;">Vi har tagit emot ansökan från <strong>${escapeHtml(dealer.foretagsnamn)}</strong>.</p>
          <p style="margin:0 0 12px;">Vårt team granskar din ansökan och återkommer inom 24 timmar med besked. När du är godkänd får du ett mejl med inloggningsuppgifter till handlarportalen.</p>
          <p style="margin:0;color:#64748b;font-size:14px;">Har du frågor? Svara bara på det här mejlet så hjälper vi dig.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const dealerText = [
      `Hej ${dealerFornamn},`,
      "",
      `Vi har tagit emot ansökan från ${dealer.foretagsnamn}.`,
      "Vårt team granskar din ansökan och återkommer inom 24 timmar.",
      "",
      "Har du frågor? Svara bara på det här mejlet.",
    ].join("\n");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [dealer.mejl],
        subject: "Vi har tagit emot din ansökan till Bilto",
        html: dealerHtml,
        text: dealerText,
      }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({ ok: true, id: resendJson.id ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
