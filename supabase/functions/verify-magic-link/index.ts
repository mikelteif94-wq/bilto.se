import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawToken: string | undefined = body?.token;
    const rawEmail: string | undefined = body?.email;

    if (!rawToken || typeof rawToken !== "string") {
      return jsonResp({ error: "Token saknas" }, 400);
    }
    if (!rawEmail || typeof rawEmail !== "string") {
      return jsonResp({ error: "E-postadress saknas" }, 400);
    }

    const email = rawEmail.trim().toLowerCase();
    const tokenHash = await sha256(rawToken.trim());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Find a valid, unused, unexpired token matching both hash and email
    const { data: linkRow } = await supabase
      .from("customer_magic_links")
      .select("id, email, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .eq("email", email)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (!linkRow) {
      return jsonResp(
        { error: "Länken är ogiltig eller har gått ut. Begär en ny länk." },
        404,
      );
    }

    // Mark token as used (single-use)
    const usedAt = new Date().toISOString();
    await supabase
      .from("customer_magic_links")
      .update({ used_at: usedAt })
      .eq("id", linkRow.id);

    // Sign the user in (or create account) using Supabase magic link OTP
    // We use the admin API to generate a session for this email directly.
    const { data: signInData, error: signInErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (signInErr || !signInData?.properties?.hashed_token) {
      // Fallback: create user if not exists, then generate a session token via signInWithOtp
      console.error("[verify-magic-link] generateLink error:", signInErr);
      return jsonResp({ error: "Kunde inte skapa session. Försök igen." }, 500);
    }

    // Exchange the generated token for a real session
    const actionLink = signInData.properties.action_link;

    return jsonResp({ ok: true, email, action_link: actionLink }, 200);
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
