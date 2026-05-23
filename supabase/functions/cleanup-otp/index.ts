import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Purge strategy:
// 1. All expired and unverified rows older than 1 hour (safe — they can never be used)
// 2. All verified rows older than 7 days (audit trail kept for a week)
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const now = new Date();

    // Delete expired + unverified rows that are at least 1 hour old
    const expiredCutoff = new Date(now.getTime() - 3600_000).toISOString();
    const { count: expiredDeleted, error: expiredErr } = await supabase
      .from("email_otp_codes")
      .delete({ count: "exact" })
      .is("verified_at", null)
      .lt("expires_at", expiredCutoff);

    if (expiredErr) {
      console.error("[cleanup-otp] expired delete error:", expiredErr.message);
    }

    // Delete verified rows older than 7 days
    const verifiedCutoff = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const { count: verifiedDeleted, error: verifiedErr } = await supabase
      .from("email_otp_codes")
      .delete({ count: "exact" })
      .not("verified_at", "is", null)
      .lt("verified_at", verifiedCutoff);

    if (verifiedErr) {
      console.error("[cleanup-otp] verified delete error:", verifiedErr.message);
    }

    const result = {
      ok: true,
      expired_deleted: expiredDeleted ?? 0,
      verified_deleted: verifiedDeleted ?? 0,
      ran_at: now.toISOString(),
    };

    console.log("[cleanup-otp]", JSON.stringify(result));
    return jsonResp(result, 200);
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
