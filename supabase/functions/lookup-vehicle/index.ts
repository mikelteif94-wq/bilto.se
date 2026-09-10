import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REG_REGEX = /^[A-Z]{3}\d{2}[A-Z0-9]$/;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const raw: string | undefined = body?.regnummer;

    if (!raw || typeof raw !== "string") {
      return jsonResp({ error: "Regnummer saknas" }, 400);
    }

    const regnummer = raw.trim().toUpperCase().replace(/\s/g, "");

    if (!REG_REGEX.test(regnummer)) {
      return jsonResp({ error: "Ogiltigt regnummerformat" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check cache
    const { data: cached } = await supabase
      .from("vehicle_lookup_cache")
      .select("payload, cached_at")
      .eq("regnummer", regnummer)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at).getTime();
      if (age < CACHE_TTL_MS) {
        return jsonResp(cached.payload, 200);
      }
    }

    // Cache miss or stale — fetch from external API
    const apiKey = Deno.env.get("BILUPPGIFTER_API_KEY") ?? "ozMv_omy5skrUSmrLhD4rNZkkjgfW86S3e0Q3XAyScI";
    const apiUrl = `https://data.biluppgifter.se/api/v1/vehicle/regno/${encodeURIComponent(regnummer.toLowerCase())}`;

    const apiResp = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (apiResp.status === 404) {
      const notFound = { found: false };
      await upsertCache(supabase, regnummer, notFound);
      return jsonResp(notFound, 200);
    }

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      console.error("[lookup-vehicle] API error:", apiResp.status, errText);
      return jsonResp({ error: "Kunde inte hämta fordonsdata" }, 502);
    }

    const data = await apiResp.json();
    const v = data?.vehicle ?? {};

    const result = {
      found: true,
      marke: capitalize(v.make ?? ""),
      modell: capitalize(v.model ?? ""),
      variant: capitalize(v.variant ?? ""),
      ar: toYear(v.model_year ?? v.vehicle_year ?? v.manufactured ?? ""),
      farg: capitalize(v.color ?? v.exterior_color ?? ""),
      fordonstyp: capitalize(v.type ?? ""),
      miltal: v.meter != null ? Math.round(v.meter / 10) : null,
    };

    await upsertCache(supabase, regnummer, result);

    return jsonResp(result, 200);
  } catch (err) {
    console.error("[lookup-vehicle] Unexpected error:", err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

async function upsertCache(
  supabase: ReturnType<typeof createClient>,
  regnummer: string,
  payload: unknown,
) {
  await supabase
    .from("vehicle_lookup_cache")
    .upsert({ regnummer, payload, cached_at: new Date().toISOString() }, { onConflict: "regnummer" });
}

function capitalize(val: unknown): string {
  if (!val) return "";
  return String(val).trim();
}

function toYear(val: unknown): number | null {
  if (!val) return null;
  const str = String(val);
  const m = str.match(/^(\d{4})/);
  if (m) {
    const y = parseInt(m[1], 10);
    if (y >= 1980 && y <= new Date().getFullYear() + 1) return y;
  }
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1980 && num <= new Date().getFullYear() + 1) return num;
  return null;
}

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
