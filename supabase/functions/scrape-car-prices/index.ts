import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Brand-specific model page URL builders for Swedish sites
const BRAND_URL_BUILDERS: Record<string, (model: string) => string> = {
  volvo:      (m) => `https://www.volvocars.com/sv-se/cars/${m.toLowerCase().replace(/\s+/g, "-")}/`,
  bmw:        (m) => `https://www.bmw.se/sv/alla-modeller.html`,
  kia:        (m) => `https://www.kia.com/se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}/`,
  tesla:      (m) => `https://www.tesla.com/sv_SE/${m.toLowerCase().replace(/\s+/g, "-")}`,
  volkswagen: (m) => `https://www.vw.se/sv/modeller/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  audi:       (m) => `https://www.audi.se/se/web/sv/models/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  "mercedes-benz": (m) => `https://www.mercedes-benz.se/passbilar/modeller.html`,
  mercedes:   (m) => `https://www.mercedes-benz.se/passbilar/modeller.html`,
  toyota:     (m) => `https://www.toyota.se/cars/${m.toLowerCase().replace(/\s+/g, "-")}`,
  hyundai:    (m) => `https://www.hyundai.com/se/models/${m.toLowerCase().replace(/\s+/g, "-")}`,
  ford:       (m) => `https://www.ford.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}`,
  polestar:   (m) => `https://www.polestar.com/se/cars/${m.toLowerCase().replace(/\s+/g, "-")}/`,
  skoda:      (m) => `https://www.skoda.se/modeller/${m.toLowerCase().replace(/\s+/g, "-")}`,
  seat:       (m) => `https://www.seat.se/modeller/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  cupra:      (m) => `https://www.cupraofficial.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  renault:    (m) => `https://www.renault.se/personbilar/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  peugeot:    (m) => `https://www.peugeot.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  opel:       (m) => `https://www.opel.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  nissan:     (m) => `https://www.nissan.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  mazda:      (m) => `https://www.mazda.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}/`,
  honda:      (m) => `https://www.honda.se/cars/${m.toLowerCase().replace(/\s+/g, "-")}.html`,
  subaru:     (m) => `https://www.subaru.se/bilar/${m.toLowerCase().replace(/\s+/g, "-")}/`,
  mg:         (m) => `https://www.mgmotor.se/modeller/${m.toLowerCase().replace(/\s+/g, "-")}`,
  byd:        (m) => `https://www.bydbil.se/modeller/${m.toLowerCase().replace(/\s+/g, "-")}`,
};

function getBrandUrl(make: string, model: string): string {
  const key = make.toLowerCase().replace(/-/g, "").replace(/\s+/g, "");
  const fn = BRAND_URL_BUILDERS[key] ?? BRAND_URL_BUILDERS[make.toLowerCase()];
  if (fn) return fn(model);
  // Fallback: Wayke new cars search
  return `https://www.wayke.se/bilar/nybilar?q=${encodeURIComponent(`${make} ${model}`)}`;
}

async function scrapeNewPrice(
  make: string,
  model: string,
  apiKey: string
): Promise<{ price_new_from: number | null; price_new_to: number | null; source: string }> {
  const brandUrl = getBrandUrl(make, model);

  // Primary: scrape brand website with LLM extraction
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: brandUrl,
      formats: ["extract"],
      extract: {
        prompt: `Find the official starting price (från-pris / grundpris) for ${make} ${model} in Sweden in Swedish kronor (SEK).
If there are multiple variants, find the cheapest (lowest) price and the most expensive listed price.
Return prices as plain integers without spaces or currency symbols.
If price not found on this page, return null for both.`,
        schema: {
          type: "object",
          properties: {
            price_from_sek: {
              type: "number",
              description: "Cheapest / starting price in SEK (e.g. 549900)",
            },
            price_to_sek: {
              type: "number",
              description: "Most expensive listed variant price in SEK, or null",
            },
          },
        },
      },
      timeout: 30000,
    }),
  });

  if (!res.ok) {
    // Fallback: search Wayke
    return scrapeWaykeNewPrice(make, model, apiKey);
  }

  const data = await res.json();
  const extracted = data?.data?.extract ?? {};
  const priceFrom = typeof extracted.price_from_sek === "number" ? Math.round(extracted.price_from_sek) : null;
  const priceTo = typeof extracted.price_to_sek === "number" ? Math.round(extracted.price_to_sek) : null;

  if (!priceFrom) {
    // Fallback to Wayke
    return scrapeWaykeNewPrice(make, model, apiKey);
  }

  return { price_new_from: priceFrom, price_new_to: priceTo, source: brandUrl };
}

async function scrapeWaykeNewPrice(
  make: string,
  model: string,
  apiKey: string
): Promise<{ price_new_from: number | null; price_new_to: number | null; source: string }> {
  const waykeUrl = `https://www.wayke.se/bilar/nybilar?q=${encodeURIComponent(`${make} ${model}`)}`;

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: waykeUrl,
      formats: ["extract"],
      extract: {
        prompt: `Find the cheapest new ${make} ${model} price listed on this page in SEK. Return the lowest price and highest price seen.`,
        schema: {
          type: "object",
          properties: {
            price_from_sek: { type: "number" },
            price_to_sek: { type: "number" },
          },
        },
      },
      timeout: 30000,
    }),
  });

  if (!res.ok) return { price_new_from: null, price_new_to: null, source: waykeUrl };

  const data = await res.json();
  const extracted = data?.data?.extract ?? {};
  return {
    price_new_from: typeof extracted.price_from_sek === "number" ? Math.round(extracted.price_from_sek) : null,
    price_new_to: typeof extracted.price_to_sek === "number" ? Math.round(extracted.price_to_sek) : null,
    source: waykeUrl,
  };
}

async function scrapeUsedPrice(
  make: string,
  model: string,
  apiKey: string
): Promise<{ price_used_min: number | null; price_used_max: number | null; source: string }> {
  // Search Blocket for used listings
  const blocketUrl = `https://www.blocket.se/annonser/hela_sverige/fordon/bilar?q=${encodeURIComponent(`${make} ${model}`)}&cg=1020`;

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: blocketUrl,
      formats: ["extract"],
      extract: {
        prompt: `Extract the prices of ${make} ${model} cars listed for sale on this page.
Find the typical market price range (ignore extreme outliers).
Return the lowest reasonable price and highest reasonable price in SEK as plain integers.`,
        schema: {
          type: "object",
          properties: {
            price_min_sek: {
              type: "number",
              description: "Lowest typical asking price in SEK",
            },
            price_max_sek: {
              type: "number",
              description: "Highest typical asking price in SEK",
            },
            typical_median_sek: {
              type: "number",
              description: "Typical / median market price in SEK",
            },
          },
        },
      },
      timeout: 30000,
    }),
  });

  if (!res.ok) return { price_used_min: null, price_used_max: null, source: blocketUrl };

  const data = await res.json();
  const extracted = data?.data?.extract ?? {};
  return {
    price_used_min: typeof extracted.price_min_sek === "number" ? Math.round(extracted.price_min_sek) : null,
    price_used_max: typeof extracted.price_max_sek === "number" ? Math.round(extracted.price_max_sek) : null,
    source: blocketUrl,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY saknas — lägg till som secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { catalog_id, make, model, type = "both" } = body as {
      catalog_id: string;
      make: string;
      model: string;
      type?: "new" | "used" | "both";
    };

    if (!catalog_id || !make || !model) {
      return new Response(
        JSON.stringify({ error: "catalog_id, make och model krävs." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: Record<string, unknown> = {};

    if (type === "new" || type === "both") {
      const newPrices = await scrapeNewPrice(make, model, firecrawlKey);
      if (newPrices.price_new_from) {
        result.price_new_from = newPrices.price_new_from;
        result.price_new_to = newPrices.price_new_to;
        result.price_source_new = newPrices.source;
      }
    }

    if (type === "used" || type === "both") {
      const usedPrices = await scrapeUsedPrice(make, model, firecrawlKey);
      if (usedPrices.price_used_min) {
        result.price_used_min = usedPrices.price_used_min;
        result.price_used_max = usedPrices.price_used_max;
        result.price_source_used = usedPrices.source;
      }
    }

    if (Object.keys(result).length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Inga priser hittades — prova att ange manuellt." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build combined price_source string
    const sources = [result.price_source_new, result.price_source_used]
      .filter(Boolean)
      .join("; ");

    const updatePayload: Record<string, unknown> = {
      price_verified: false, // scraped prices are unverified until human confirms
      price_source: `Firecrawl: ${sources}`,
      updated_at: new Date().toISOString(),
    };
    if (result.price_new_from) updatePayload.price_new_from = result.price_new_from;
    if (result.price_new_to) updatePayload.price_new_to = result.price_new_to;
    if (result.price_used_min) updatePayload.price_used_min = result.price_used_min;
    if (result.price_used_max) updatePayload.price_used_max = result.price_used_max;

    const { error: updateError } = await supabase
      .from("car_catalog")
      .update(updatePayload)
      .eq("id", catalog_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped: {
          price_new_from: result.price_new_from ?? null,
          price_new_to: result.price_new_to ?? null,
          price_used_min: result.price_used_min ?? null,
          price_used_max: result.price_used_max ?? null,
          source: `Firecrawl: ${sources}`,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
