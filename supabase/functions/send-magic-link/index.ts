import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
const SITE = "https://bilto.se";
const TOKEN_TTL_MINUTES = 30;
const MAX_SEND_PER_HOUR = 5;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail: string | undefined = body?.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return jsonResp({ error: "E-postadress saknas" }, 400);
    }

    const email = rawEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResp({ error: "Ogiltig e-postadress" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Rate-limit: max MAX_SEND_PER_HOUR sends per email per hour
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: recentCount } = await supabase
      .from("customer_magic_links")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((recentCount ?? 0) >= MAX_SEND_PER_HOUR) {
      return jsonResp(
        { error: "För många försök. Vänta en stund och försök igen." },
        429,
      );
    }

    // Generate a 48-byte random token (URL-safe base64)
    const rawBytes = new Uint8Array(48);
    crypto.getRandomValues(rawBytes);
    const token = btoa(String.fromCharCode(...rawBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();

    const { error: insertErr } = await supabase.from("customer_magic_links").insert({
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertErr) {
      console.error("[send-magic-link] insert error:", insertErr);
      return jsonResp({ error: "Kunde inte skapa länk. Försök igen." }, 500);
    }

    const origin = Deno.env.get("SITE_URL") ?? SITE;
    const portalUrl = `${origin}/portal?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";

    if (!resendKey) {
      console.log(`[send-magic-link] DEV LINK for ${email}: ${portalUrl}`);
      return jsonResp({ ok: true }, 200);
    }

    const html = renderMagicLinkEmail({ email, portalUrl, ttlMinutes: TOKEN_TTL_MINUTES });
    const text = `Klicka på länken nedan för att komma in i din portal hos Bilto:\n\n${portalUrl}\n\nLänken gäller i ${TOKEN_TTL_MINUTES} minuter och kan bara användas en gång.\n\nDela aldrig din länk med någon annan.`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Din säkra inloggningslänk till Bilto",
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[send-magic-link] Resend error:", errText);
      return jsonResp({ error: "Kunde inte skicka e-post. Försök igen." }, 500);
    }

    return jsonResp({ ok: true }, 200);
  } catch (err) {
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function renderMagicLinkEmail(d: {
  email: string;
  portalUrl: string;
  ttlMinutes: number;
}): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Din inloggningslänk till Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Din säkra länk till Bilto-portalen&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <a href="${SITE}" style="text-decoration:none;">
            <img src="${LOGO_URL}" alt="Bilto" width="200" style="width:200px;height:auto;display:block;" />
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:36px 28px 28px;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Din portal hos Bilto</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
            Klicka på knappen nedan för att komma direkt in i din portal och följa ditt ärende. Länken är personlig och gäller i ${d.ttlMinutes} minuter.
          </p>
          <div style="text-align:center;margin:0 0 28px;">
            <a href="${esc(d.portalUrl)}"
               style="display:inline-block;background:#0e6efe;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:0.01em;">
              Öppna min portal
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
            Fungerar inte knappen? Kopiera och klistra in länken i webbläsaren:
          </p>
          <p style="margin:0 0 24px;font-size:11px;color:#94a3b8;word-break:break-all;text-align:center;">
            ${esc(d.portalUrl)}
          </p>
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
            <p style="margin:0;font-size:12.5px;color:#713f12;line-height:1.5;">
              Dela aldrig den h\u00e4r l\u00e4nken med n\u00e5gon annan. Den \u00e4r kopplad till din e-postadress <strong>${esc(d.email)}</strong>.
            </p>
          </div>
          <div style="border-top:1px solid #e2e8f0;margin:24px 0 20px;"></div>
          <p style="margin:0 0 2px;font-size:13px;color:#94a3b8;">Med v\u00e4nliga h\u00e4lsningar,</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet p\u00e5 Bilto</p>
        </td></tr>
        <tr><td align="center" style="padding-top:14px;">
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${year} Bilto &middot; <a href="mailto:hej@bilto.se" style="color:#cbd5e1;text-decoration:none;">hej@bilto.se</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
