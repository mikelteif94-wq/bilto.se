import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REG_REGEX = /^[A-Z]{3}\d{2}[A-Z0-9]$/;

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

    const apiKey = Deno.env.get("BILUPPGIFTER_API_KEY");
    if (!apiKey) {
      return jsonResp({ error: "API-nyckel saknas" }, 500);
    }

    const apiUrl = `https://data.biluppgifter.se/v2/${encodeURIComponent(regnummer)}`;

    const apiResp = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (apiResp.status === 404) {
      return jsonResp({ found: false }, 200);
    }

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      console.error("[lookup-vehicle] API error:", apiResp.status, errText);
      return jsonResp({ error: "Kunde inte hämta fordonsdata" }, 502);
    }

    const raw_data = await apiResp.json();

    // Normalize fields from biluppgifter.se response format
    const vehicle = raw_data?.data ?? raw_data ?? {};

    const result = {
      found: true,
      marke: normalize(vehicle.make ?? vehicle.marke ?? vehicle.brand ?? ""),
      modell: normalize(vehicle.model ?? vehicle.modell ?? ""),
      ar: toYear(vehicle.model_year ?? vehicle.year ?? vehicle.ar ?? vehicle.arsmodell ?? vehicle.first_registered ?? ""),
      bransle: normalize(vehicle.fuel ?? vehicle.fuel_type ?? vehicle.bransle ?? vehicle.drivmedel ?? ""),
      farg: normalize(vehicle.color ?? vehicle.colour ?? vehicle.farg ?? vehicle.color_name ?? ""),
      fordonstyp: normalize(vehicle.vehicle_type ?? vehicle.fordonstyp ?? vehicle.body_type ?? ""),
      miltal: toMiltal(vehicle.mileage ?? vehicle.miltal ?? vehicle.odometer ?? null),
    };

    return jsonResp(result, 200);
  } catch (err) {
    console.error("[lookup-vehicle] Unexpected error:", err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

function normalize(val: unknown): string {
  if (!val) return "";
  return String(val).trim();
}

function toYear(val: unknown): number | null {
  if (!val) return null;
  const str = String(val);
  // Handle ISO date strings like "2019-03-01"
  const yearMatch = str.match(/^(\d{4})/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y >= 1980 && y <= new Date().getFullYear() + 1) return y;
  }
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1980 && num <= new Date().getFullYear() + 1) return num;
  return null;
}

function toMiltal(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  if (isNaN(num) || num < 0) return null;
  // biluppgifter.se returns km — convert to Swedish mil (1 mil = 10 km)
  return Math.round(num / 10);
}

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
