import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    const body = await req.json().catch(() => ({}));
    const dealerId: string | undefined = body?.dealer_id;
    if (!dealerId) {
      return new Response(
        JSON.stringify({ error: "dealer_id saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: dealer, error } = await supabase
      .from("dealers")
      .select("id, foretagsnamn, kontaktperson, mejl, godkand, user_id")
      .eq("id", dealerId)
      .maybeSingle();

    if (error || !dealer) {
      return new Response(
        JSON.stringify({ error: "Kunde inte hämta handlaren", details: error?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!dealer.godkand) {
      return new Response(
        JSON.stringify({ error: "Handlaren är inte godkänd" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let userId: string | null = dealer.user_id ?? null;
    let tempPassword: string | null = null;

    if (!userId) {
      tempPassword = generatePassword();
      const { data: created, error: createErr } = await supabase.auth.admin
        .createUser({
          email: dealer.mejl,
          password: tempPassword,
          email_confirm: true,
        });

      if (createErr || !created.user) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(
          (u) => u.email?.toLowerCase() === dealer.mejl.toLowerCase(),
        );
        if (existing) {
          userId = existing.id;
          const { error: updErr } = await supabase.auth.admin.updateUserById(
            existing.id,
            { password: tempPassword, email_confirm: true },
          );
          if (updErr) {
            return new Response(
              JSON.stringify({ error: "Kunde inte uppdatera konto", details: updErr.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: "Kunde inte skapa konto", details: createErr?.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } else {
        userId = created.user.id;
      }

      await supabase.from("dealers").update({ user_id: userId }).eq("id", dealer.id);
    }

    const baseUrl = appUrl.replace(/\/$/, "");
    const loginUrl = baseUrl
      ? `${baseUrl}/handlare/logga-in`
      : "/handlare/logga-in";
    const settingsUrl = baseUrl
      ? `${baseUrl}/handlare/installningar`
      : "/handlare/installningar";
    const setPasswordRedirect = baseUrl
      ? `${baseUrl}/handlare/valj-losenord`
      : "/handlare/valj-losenord";

    let setPasswordUrl: string | null = null;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: dealer.mejl,
        options: { redirectTo: setPasswordRedirect },
      });
      setPasswordUrl = linkData?.properties?.action_link ?? null;
    } catch (_e) {
      setPasswordUrl = null;
    }

    if (!resendKey) {
      return new Response(
        JSON.stringify({
          ok: true,
          warning: "RESEND_API_KEY saknas — välkomstmejl ej skickat",
          temp_password: tempPassword,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subject = `Ditt handlarkonto hos Bilto är godkänt`;
    const hej = dealer.kontaktperson?.trim()
      ? `Hej ${escapeHtml(dealer.kontaktperson.split(" ")[0])}!`
      : "Hej!";

    const pwBlock = setPasswordUrl
      ? `<p style="margin:0 0 14px;">Sätt ditt lösenord direkt med en säker länk — den är klar för dig:</p>
         <p style="margin:0 0 14px;">
           <a href="${escapeAttr(setPasswordUrl)}" style="display:inline-block;background:#ffffff;color:#0e6efe !important;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;border:1.5px solid #0e6efe;-webkit-text-fill-color:#0e6efe !important;">Välj ditt lösenord</a>
         </p>
         <p style="margin:0 0 14px;color:#64748b;font-size:13px;">Länken är personlig och giltig en kort stund. När du satt lösenordet kan du logga in nedan.</p>`
      : tempPassword
        ? `<p style="margin:0 0 14px;">Här är ditt tillfälliga lösenord — byt det efter första inloggningen:</p>
           <p style="margin:0 0 14px;"><code style="background:#f1f5f9;border-radius:6px;padding:8px 12px;font-size:15px;display:inline-block;">${escapeHtml(tempPassword)}</code></p>`
        : `<p style="margin:0 0 14px;">Logga in med din befintliga e-post och lösenord.</p>`;

    const html = `<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:36px 32px 24px;">
          <p style="margin:0 0 6px;color:#059669;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Kontot godkänt</p>
          <h1 style="margin:0;color:#0f172a;font-size:24px;">Välkommen till Bilto</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 8px;color:#334155;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 14px;">${hej}</p>
          <p style="margin:0 0 14px;">Din ansökan för <strong>${escapeHtml(dealer.foretagsnamn)}</strong> är godkänd. Du kan nu logga in och börja lägga bud på bilar.</p>
          <p style="margin:0 0 14px;"><strong>E-post:</strong> ${escapeHtml(dealer.mejl)}</p>
          ${pwBlock}
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 28px;">
          <a href="${escapeAttr(loginUrl)}" style="display:inline-block;background:#ffffff;color:#0e6efe !important;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;border:1.5px solid #0e6efe;-webkit-text-fill-color:#0e6efe !important;">Logga in</a>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${escapeHtml(loginUrl)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;color:#64748b;font-size:13px;line-height:1.6;">
          Har du frågor? Svara bara på det här mejlet så hjälper vi dig.
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = [
      subject,
      "",
      `${dealer.kontaktperson?.split(" ")[0] ?? ""}`,
      `Din ansökan för ${dealer.foretagsnamn} är godkänd.`,
      `E-post: ${dealer.mejl}`,
      setPasswordUrl ? `Välj ditt lösenord: ${setPasswordUrl}` : "",
      tempPassword && !setPasswordUrl ? `Tillfälligt lösenord: ${tempPassword}` : "",
      "",
      `Logga in: ${loginUrl}`,
    ].filter(Boolean).join("\n");

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [dealer.mejl],
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

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
