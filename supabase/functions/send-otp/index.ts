import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
const SITE = "https://bilto.se";
const CODE_TTL_MINUTES = 10;
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
      .from("email_otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((recentCount ?? 0) >= MAX_SEND_PER_HOUR) {
      return jsonResp(
        { error: "För många försök. Vänta en stund och försök igen." },
        429,
      );
    }

    // Generate 6-digit code and hash it
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

    await supabase.from("email_otp_codes").insert({
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";

    if (!resendKey) {
      // Dev fallback: log the code so it can be found in function logs
      console.log(`[send-otp] DEV CODE for ${email}: ${code}`);
      return jsonResp({ ok: true, dev_code: code }, 200);
    }

    const html = renderOtpEmail({ email, code, ttlMinutes: CODE_TTL_MINUTES });
    const text = `Din verifieringskod för Bilto är: ${code}\n\nKoden gäller i ${CODE_TTL_MINUTES} minuter.\n\nDela aldrig din kod med någon annan.`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `${code} — din Bilto-kod`,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[send-otp] Resend error:", errText);
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

function renderOtpEmail(d: { email: string; code: string; ttlMinutes: number }): string {
  const year = new Date().getFullYear();
  const digits = d.code.split("").map((c) =>
    `<span style="display:inline-block;width:40px;height:52px;line-height:52px;text-align:center;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;font-size:26px;font-weight:800;color:#0f172a;margin:0 3px;font-family:monospace;">${c}</span>`
  ).join("");

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Din Bilto-kod</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(d.code)} — din Bilto-verifieringskod&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px 36px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="background:#0e6efe;border-radius:12px 12px 0 0;padding:18px 28px;">
          <a href="${SITE}" style="text-decoration:none;">
            <img src="${LOGO_URL}" alt="Bilto" width="200" style="width:200px;height:auto;display:block;" />
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:36px 28px 28px;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Verifiera din e-postadress</h1>
          <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
            Ange koden nedan för att bekräfta att <strong style="color:#0f172a;">${esc(d.email)}</strong> tillhör dig.
          </p>
          <div style="text-align:center;margin:0 0 28px;">${digits}</div>
          <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;text-align:center;">
            Koden gäller i ${d.ttlMinutes} minuter. Dela den aldrig med någon.
          </p>
          <div style="border-top:1px solid #e2e8f0;margin:24px 0 20px;"></div>
          <p style="margin:0 0 2px;font-size:13px;color:#94a3b8;">Med vänliga hälsningar,</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Teamet på Bilto</p>
        </td></tr>
        <tr><td align="center" style="padding-top:14px;">
          <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${year} Bilto &middot; <a href="mailto:hej@bilto.se" style="color:#cbd5e1;text-decoration:none;">hej@bilto.se</a></p>
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
