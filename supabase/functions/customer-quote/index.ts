import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const token =
      url.searchParams.get("token") ?? null;

    if (!token || typeof token !== "string") {
      return jsonResp({ error: "Token saknas" }, 400);
    }

    const { data: quote, error } = await supabase
      .from("quote_requests")
      .select(
        "id, firstname, lastname, search_option, car_model, budget, payment_type, status, created_at",
      )
      .eq("access_token", token)
      .maybeSingle();

    if (error || !quote) {
      return jsonResp({ error: "Hittar ingen forfragan for denna lank" }, 404);
    }

    const { data: suggestions } = await supabase
      .from("quote_suggestions")
      .select(
        "id, car_description, car_image_url, price, monthly_cost, link, admin_comment, status, sent_at, created_at",
      )
      .eq("quote_request_id", quote.id)
      .in("status", ["sent", "viewed"])
      .order("created_at", { ascending: false });

    const { data: offers } = await supabase
      .from("car_offers")
      .select("*")
      .eq("quote_request_id", quote.id)
      .in("status", ["sent", "viewed"])
      .order("sent_at", { ascending: false });

    // Mark suggestions as viewed
    if (suggestions && suggestions.length > 0) {
      const unviewed = suggestions
        .filter((s) => s.status === "sent")
        .map((s) => s.id);
      if (unviewed.length > 0) {
        await supabase
          .from("quote_suggestions")
          .update({ status: "viewed" })
          .in("id", unviewed);
      }
    }

    // Mark offers as viewed
    if (offers && offers.length > 0) {
      const unviewed = offers
        .filter((o) => o.status === "sent")
        .map((o) => o.id);
      if (unviewed.length > 0) {
        await supabase
          .from("car_offers")
          .update({
            status: "viewed",
            viewed_at: new Date().toISOString(),
          })
          .in("id", unviewed);
      }
    }

    return jsonResp(
      {
        quote: {
          id: quote.id,
          firstname: quote.firstname,
          lastname: quote.lastname,
          search_option: quote.search_option,
          car_model: quote.car_model,
          budget: quote.budget,
          payment_type: quote.payment_type,
          status: quote.status,
          created_at: quote.created_at,
        },
        suggestions: suggestions ?? [],
        offers: offers ?? [],
      },
      200,
    );
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
