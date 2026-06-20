import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { dealer_id } = await req.json();
    if (!dealer_id) {
      return new Response(JSON.stringify({ error: "dealer_id krävs." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch dealer's Blocket credentials
    const { data: dealer, error: dealerErr } = await supabase
      .from("dealers")
      .select("blocket_api_key, blocket_store_id")
      .eq("id", dealer_id)
      .maybeSingle();

    if (dealerErr || !dealer?.blocket_api_key) {
      return new Response(
        JSON.stringify({ error: "Ingen API-nyckel konfigurerad för denna handlare." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = dealer.blocket_api_key;
    const storeId = dealer.blocket_store_id;

    // Call Blocket API — their ads endpoint
    // Blocket's public API base: https://api.blocket.se/car/v2/ads
    const blocketUrl = storeId
      ? `https://api.blocket.se/car/v2/ads?store_id=${storeId}&limit=100`
      : `https://api.blocket.se/car/v2/ads?limit=100`;

    const blocketRes = await fetch(blocketUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!blocketRes.ok) {
      const errText = await blocketRes.text();
      return new Response(
        JSON.stringify({ error: `Blocket API-fel (${blocketRes.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blocketData = await blocketRes.json();

    // Blocket returns { data: [...ads] } or similar shape
    const ads: Record<string, unknown>[] = Array.isArray(blocketData)
      ? blocketData
      : (blocketData.data ?? blocketData.ads ?? blocketData.results ?? []);

    if (ads.length === 0) {
      return new Response(
        JSON.stringify({ imported: 0, skipped: 0, message: "Inga annonser hittades i Blocket-butiken." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const ad of ads) {
      try {
        // Map Blocket fields to our dealer_inventory schema
        // Blocket car ads typically have these fields
        const subject = (ad.subject as string) ?? "";
        const params = (ad.parameters as Record<string, unknown>) ?? {};

        // Parse make/model from subject or dedicated fields
        const make = (ad.make as string) ?? (params.make as string) ?? "";
        const model = (ad.model as string) ?? (params.model as string) ?? subject.split(" ").slice(1).join(" ") ?? "";
        const year = Number(ad.year ?? params.year ?? params.model_year ?? 0);
        const price = Number((ad.price as Record<string, unknown>)?.value ?? ad.price ?? params.price ?? 0) || null;
        const mileage = Number(params.mileage ?? params.miltal ?? 0) || null;
        const regNo = ((params.registration_number ?? params.regnr ?? "") as string).toUpperCase();
        const fuel = ((params.fuel_type ?? params.drivmedel ?? "") as string).toLowerCase();
        const gearbox = ((params.gearbox ?? params.vaxellada ?? "") as string).toLowerCase();
        const color = ((params.color ?? params.farg ?? "") as string);
        const body = ((params.body_type ?? params.karosseri ?? "") as string).toLowerCase();
        const externalId = String(ad.id ?? ad.ad_id ?? "");

        if (!make || !model || !year) {
          skipped++;
          continue;
        }

        const payload = {
          dealer_id,
          marke: make,
          modell: model,
          ar: year,
          pris: price,
          miltal: mileage,
          regnummer: regNo || null,
          drivmedel: fuel || null,
          vaxellada: gearbox || null,
          farg: color || null,
          karosseri: body || null,
          external_id: externalId || null,
          source: "api",
          status: "tillganglig",
          notes: (ad.body as string) ?? null,
        };

        const { error: upsertErr } = await supabase
          .from("dealer_inventory")
          .upsert(payload, {
            onConflict: externalId ? "dealer_id,external_id" : undefined,
            ignoreDuplicates: false,
          });

        if (upsertErr) skipped++;
        else imported++;
      } catch {
        skipped++;
      }
    }

    // Update last sync timestamp
    await supabase
      .from("dealers")
      .update({ blocket_last_sync: new Date().toISOString() })
      .eq("id", dealer_id);

    return new Response(
      JSON.stringify({ imported, skipped, total: ads.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
