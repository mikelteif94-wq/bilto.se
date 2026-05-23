import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    // Verify caller is an admin via their JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: isAdmin } = await anonClient.rpc("get_is_admin");
    if (!isAdmin) {
      return jsonResp({ error: "Ej behörig" }, 403);
    }

    const body = await req.json();
    const {
      car_id,
      quote_request_id,
      dealer_ids,
      message,
      deadline_hours,
      dispatched_by,
      dispatched_by_name,
    }: {
      car_id?: string;
      quote_request_id?: string;
      dealer_ids: string[];
      message: string;
      deadline_hours: number;
      dispatched_by?: string;
      dispatched_by_name: string;
    } = body;

    if (!dealer_ids || dealer_ids.length === 0) {
      return jsonResp({ error: "dealer_ids saknas" }, 400);
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const deadline = new Date(Date.now() + deadline_hours * 3600000).toISOString();

    // Check which dealers already have a dispatch for this item
    let existingQuery = supabase
      .from("dealer_dispatches")
      .select("dealer_id")
      .in("dealer_id", dealer_ids);
    if (car_id) existingQuery = existingQuery.eq("car_id", car_id);
    else if (quote_request_id) existingQuery = existingQuery.eq("quote_request_id", quote_request_id);

    const { data: existing } = await existingQuery;
    const alreadySent = new Set((existing ?? []).map((r: { dealer_id: string }) => r.dealer_id));
    const newDealers = dealer_ids.filter((id) => !alreadySent.has(id));

    if (newDealers.length === 0) {
      return jsonResp({ error: "Valda handlare har redan fått detta lead." }, 409);
    }

    const rows = newDealers.map((dealerId) => ({
      car_id: car_id ?? null,
      quote_request_id: quote_request_id ?? null,
      dealer_id: dealerId,
      response_status: "sent",
      response_deadline_hours: deadline_hours,
      deadline_at: deadline,
      dispatched_by: dispatched_by ?? null,
      dispatched_by_name,
      message,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("dealer_dispatches")
      .insert(rows)
      .select("id");

    if (insertErr) {
      return jsonResp({ error: insertErr.message }, 500);
    }

    // Log activity
    const { data: dealerNames } = await supabase
      .from("dealers")
      .select("foretagsnamn")
      .in("id", newDealers);
    const names = (dealerNames ?? []).map((d: { foretagsnamn: string }) => d.foretagsnamn).join(", ");

    if (car_id) {
      await supabase.from("car_activities").insert({
        car_id,
        type: "dispatch",
        title: `Skickat till ${newDealers.length} handlare`,
        body: `Lead skickat till: ${names}`,
        source: "admin",
        actor_type: "admin",
        actor_id: dispatched_by ?? null,
        created_by: dispatched_by ?? null,
        created_by_name: dispatched_by_name,
      });
    }
    if (quote_request_id) {
      await supabase.from("quote_request_activities").insert({
        quote_request_id,
        type: "dispatch",
        title: `Skickat till ${newDealers.length} handlare`,
        body: `Lead skickat till: ${names}`,
        source: "admin",
        actor_type: "admin",
        actor_id: dispatched_by ?? null,
        created_by: dispatched_by ?? null,
        created_by_name: dispatched_by_name,
        data: { dealer_ids: newDealers, dealer_names: names },
      });
    }

    // Trigger email notifications (best effort)
    if (inserted && inserted.length > 0) {
      const dispatchIds = inserted.map((r: { id: string }) => r.id);
      const appUrl = Deno.env.get("APP_URL") ?? "";
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-dealer-dispatch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dispatch_ids: dispatchIds, is_nudge: false, app_url: appUrl }),
      }).catch(() => {});
    }

    return jsonResp({ ok: true, dispatched: newDealers.length }, 200);
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
