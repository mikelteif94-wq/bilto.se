import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_ATTEMPTS = 5;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail: string | undefined = body?.email;
    const rawCode: string | undefined = body?.code;

    if (!rawEmail || typeof rawEmail !== "string") {
      return jsonResp({ error: "E-postadress saknas" }, 400);
    }
    if (!rawCode || typeof rawCode !== "string") {
      return jsonResp({ error: "Kod saknas" }, 400);
    }

    const email = rawEmail.trim().toLowerCase();
    const code = rawCode.trim();

    if (!/^\d{6}$/.test(code)) {
      return jsonResp({ error: "Koden måste vara 6 siffror" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Find the latest unverified, unexpired OTP for this email
    const { data: otpRow } = await supabase
      .from("email_otp_codes")
      .select("id, code_hash, expires_at, attempts, verified_at")
      .eq("email", email)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return jsonResp({ error: "Ingen giltig kod hittades. Begär en ny." }, 404);
    }

    if (otpRow.attempts >= MAX_ATTEMPTS) {
      return jsonResp({ error: "För många felaktiga försök. Begär en ny kod." }, 429);
    }

    const inputHash = await sha256(code);

    if (inputHash !== otpRow.code_hash) {
      // Increment attempt counter
      await supabase
        .from("email_otp_codes")
        .update({ attempts: otpRow.attempts + 1 })
        .eq("id", otpRow.id);

      const remaining = MAX_ATTEMPTS - (otpRow.attempts + 1);
      return jsonResp(
        { error: remaining > 0 ? `Fel kod. ${remaining} försök kvar.` : "För många felaktiga försök. Begär en ny kod." },
        400,
      );
    }

    // Mark as verified (single-use)
    await supabase
      .from("email_otp_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    return jsonResp({ ok: true, verified_email: email }, 200);
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

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
