import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CarPayload {
  make: string;
  model: string;
  [key: string]: unknown;
}

// Normalize string for fuzzy matching (strips accents, lowercases, collapses whitespace/hyphens)
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
}

// Strip leading make prefix from model if present (e.g. "BMW X5" → "X5")
function stripMakeFromModel(make: string, model: string): string {
  const prefix = norm(make) + " ";
  const normalizedModel = norm(model);
  return normalizedModel.startsWith(prefix)
    ? model.slice(make.length + 1).trim()
    : model;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify caller is an admin by checking their JWT against admin_users
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rows } = (await req.json()) as { rows: CarPayload[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No rows provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load all catalog entries once for fuzzy matching
    const { data: catalog } = await supabase
      .from("car_catalog")
      .select("id, make, model");

    const catalogRows = (catalog ?? []) as { id: string; make: string; model: string }[];

    function findCatalogEntry(make: string, model: string): { id: string } | null {
      const cleanModel = stripMakeFromModel(make, model);
      const nMake = norm(make);
      const nModel = norm(cleanModel);

      // 1. Exact match (case-insensitive)
      for (const row of catalogRows) {
        if (norm(row.make) === nMake && norm(row.model) === nModel) {
          return { id: row.id };
        }
      }

      // 2. Same make, model contains or starts with search model
      for (const row of catalogRows) {
        if (norm(row.make) === nMake) {
          const rm = norm(row.model);
          if (rm.startsWith(nModel) || nModel.startsWith(rm)) {
            return { id: row.id };
          }
        }
      }

      // 3. Full string match ignoring make (e.g. "Range" → "Land Rover", model "Range Rover Sport")
      const fullSearch = norm(`${make} ${cleanModel}`);
      for (const row of catalogRows) {
        const fullCatalog = norm(`${row.make} ${row.model}`);
        if (fullCatalog === fullSearch || fullCatalog.includes(fullSearch) || fullSearch.includes(fullCatalog)) {
          return { id: row.id };
        }
      }

      return null;
    }

    const results: { make: string; model: string; status: "updated" | "not_found" | "error"; error?: string }[] = [];

    for (const row of rows) {
      const { make, model, ...fields } = row;
      if (!make || !model) {
        results.push({ make: String(make), model: String(model), status: "error", error: "Saknar make/model" });
        continue;
      }

      // Remove undefined/null values
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) payload[k] = v;
      }

      const existing = findCatalogEntry(make, model);

      if (!existing) {
        results.push({ make, model, status: "not_found" });
        continue;
      }

      const { error: updateErr } = await supabase
        .from("car_catalog")
        .update(payload)
        .eq("id", existing.id);

      if (updateErr) {
        results.push({ make, model, status: "error", error: updateErr.message });
      } else {
        results.push({ make, model, status: "updated" });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
