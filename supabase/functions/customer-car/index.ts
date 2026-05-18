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
    const body = req.method === "POST" ? (await cloneJson(req)) : null;
    const token = url.searchParams.get("token") ?? (body?.token as string | undefined) ?? null;

    if (!token || typeof token !== "string") {
      return jsonResp({ error: "Token saknas" }, 400);
    }

    const { data: car, error } = await supabase
      .from("cars")
      .select(
        "id, regnummer, marke, modell, ar, miltal, skick, status, sales_type, auktion_slut, vinnande_bud_id, kund_beslut, kund_beslut_at, created_at, access_token_expires_at, access_token_revoked_at, direct_bid_estimate, brokerage_estimate_low, brokerage_estimate_high, condition_report, customers(namn, telefon, mejl), car_images(storage_url, ordning)",
      )
      .eq("access_token", token)
      .maybeSingle();

    if (error || !car) {
      return jsonResp({ error: "Hittar ingen bil för denna länk" }, 404);
    }

    if (car.access_token_revoked_at) {
      return jsonResp({ error: "Länken har återkallats. Kontakta support." }, 410);
    }
    if (car.access_token_expires_at && new Date(car.access_token_expires_at) < new Date()) {
      return jsonResp({ error: "Länken har gått ut. Kontakta support för en ny länk." }, 410);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      "";
    const userAgent = req.headers.get("user-agent") ?? "";

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCount } = await supabase
      .from("customer_token_access_log")
      .select("id", { count: "exact", head: true })
      .eq("car_id", car.id)
      .eq("ip", ip)
      .gte("created_at", oneMinuteAgo);
    if ((recentCount ?? 0) > 60) {
      return jsonResp({ error: "För många försök. Vänta en stund och försök igen." }, 429);
    }

    await supabase.from("customer_token_access_log").insert({
      car_id: car.id,
      ip,
      user_agent: userAgent.slice(0, 500),
      action: req.method === "POST" ? ((body?.action as string) ?? "decide") : "view",
    });

    if (req.method === "POST") {
      const action: string | undefined = (body?.action as string) ?? "decide";

      if (action === "complete_listing") {
        // Customer fills in missing condition report and/or extra images.
        // Allowed while car has not yet ended (ny | aktiv).
        if (car.status !== "ny" && car.status !== "aktiv") {
          return jsonResp(
            { error: "Komplettering kan bara göras innan auktionen är klar" },
            400,
          );
        }

        const update: Record<string, unknown> = {};
        if (body?.condition_report && typeof body.condition_report === "object") {
          update.condition_report = body.condition_report;
        }
        if (typeof body?.skick_kommentar === "string") {
          update.skick_kommentar = body.skick_kommentar.slice(0, 4000);
        }

        if (Object.keys(update).length > 0) {
          const { error: updErr } = await supabase
            .from("cars")
            .update(update)
            .eq("id", car.id);
          if (updErr) {
            return jsonResp({ error: "Kunde inte spara skickrapporten" }, 500);
          }
        }

        // Append new images if provided as { storage_url, ordning } pairs
        if (Array.isArray(body?.images) && body.images.length > 0) {
          type IncomingImage = { storage_url?: unknown; ordning?: unknown };
          const rows = (body.images as IncomingImage[])
            .filter(
              (i): i is { storage_url: string; ordning: number | string | undefined } =>
                typeof i?.storage_url === "string" && i.storage_url.length > 10,
            )
            .map((i, idx) => ({
              car_id: car.id,
              storage_url: i.storage_url,
              ordning:
                typeof i.ordning === "number"
                  ? i.ordning
                  : (car.car_images?.length ?? 0) + idx,
            }));
          if (rows.length > 0) {
            const { error: imgErr } = await supabase.from("car_images").insert(rows);
            if (imgErr) {
              return jsonResp(
                { error: "Bilderna kunde inte sparas i databasen" },
                500,
              );
            }
          }
        }

        await supabase.from("notifications_log").insert({
          typ: "kund_komplettering",
          mottagare_mejl: car.customers?.mejl ?? "",
          status: "sent",
          referens_id: car.id,
          detaljer: JSON.stringify({
            condition_report: !!update.condition_report,
            images: Array.isArray(body?.images) ? body.images.length : 0,
          }),
        });

        return jsonResp({ ok: true }, 200);
      }

      if (action === "accept_brokerage_offer") {
        const offerId = body?.offer_id as string | undefined;
        if (!offerId) return jsonResp({ error: "offer_id saknas" }, 400);
        if (car.sales_type !== "brokerage") {
          return jsonResp({ error: "Endast förmedlingsbilar" }, 400);
        }
        if (car.kund_beslut === "vill_salja") {
          return jsonResp({ error: "Ett erbjudande är redan accepterat" }, 409);
        }

        const { data: offer } = await supabase
          .from("brokerage_offers")
          .select("id, car_id, dealer_id")
          .eq("id", offerId)
          .maybeSingle();
        if (!offer) return jsonResp({ error: "Hittar inte erbjudandet" }, 404);

        await supabase
          .from("brokerage_offers")
          .update({ status: "accepted" })
          .eq("id", offerId);
        await supabase
          .from("brokerage_offers")
          .update({ status: "rejected" })
          .eq("car_id", car.id)
          .neq("id", offerId);
        await supabase
          .from("cars")
          .update({
            kund_beslut: "vill_salja",
            kund_beslut_at: new Date().toISOString(),
            status: "auktion_avslutad",
          })
          .eq("id", car.id);
        await supabase.from("notifications_log").insert({
          typ: "brokerage_accepted",
          mottagare_mejl: car.customers?.mejl ?? "",
          status: "sent",
          referens_id: car.id,
          detaljer: offerId,
        });
        return jsonResp({ ok: true }, 200);
      }

      // default: decision on auction
      const decision: string | undefined = body?.beslut as string | undefined;
      if (decision !== "vill_salja" && decision !== "vill_inte_salja") {
        return jsonResp({ error: "Ogiltigt beslut" }, 400);
      }
      if (car.status !== "auktion_avslutad") {
        return jsonResp(
          { error: "Beslut kan bara lämnas när auktionen är avslutad" },
          400,
        );
      }
      if (car.kund_beslut && car.kund_beslut !== "") {
        return jsonResp({ error: "Beslut har redan lämnats" }, 409);
      }
      const { error: updateErr } = await supabase
        .from("cars")
        .update({
          kund_beslut: decision,
          kund_beslut_at: new Date().toISOString(),
        })
        .eq("id", car.id);
      if (updateErr) {
        return jsonResp({ error: "Kunde inte spara beslut" }, 500);
      }
      await supabase.from("notifications_log").insert({
        typ: "kund_beslut",
        mottagare_mejl: car.customers?.mejl ?? "",
        status: "sent",
        referens_id: car.id,
        detaljer: decision,
      });

      if (decision === "vill_salja" && car.vinnande_bud_id) {
        try {
          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-bid-approved`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({ car_id: car.id }),
            },
          );
        } catch (_e) {
          // best-effort
        }
      }

      return jsonResp({ ok: true, beslut: decision }, 200);
    }

    // GET: bygg svar för kundsidan
    const images = [...(car.car_images ?? [])].sort(
      (a: { ordning: number }, b: { ordning: number }) => a.ordning - b.ordning,
    );

    let winningBid: { belopp: number; foretagsnamn: string } | null = null;
    if (car.status === "auktion_avslutad" && car.vinnande_bud_id) {
      const { data: bid } = await supabase
        .from("bids")
        .select("belopp, dealer_id")
        .eq("id", car.vinnande_bud_id)
        .maybeSingle();
      if (bid) {
        const { data: dealer } = await supabase
          .from("dealers")
          .select("foretagsnamn")
          .eq("id", bid.dealer_id)
          .maybeSingle();
        winningBid = {
          belopp: bid.belopp,
          foretagsnamn: dealer?.foretagsnamn ?? "",
        };
      }
    }

    let brokerageOffers: Array<{
      id: string;
      expected_sale_price: number;
      commission_kr: number;
      estimated_days: number;
      kommentar: string;
      status: string;
      net_to_customer: number;
      foretagsnamn: string;
      created_at: string;
    }> = [];
    if (car.sales_type === "brokerage") {
      const { data: offers } = await supabase
        .from("brokerage_offers")
        .select("id, dealer_id, expected_sale_price, commission_kr, estimated_days, kommentar, status, created_at")
        .eq("car_id", car.id)
        .order("created_at", { ascending: false });
      if (offers && offers.length > 0) {
        const dealerIds = [...new Set(offers.map((o) => o.dealer_id))];
        const { data: dealers } = await supabase
          .from("dealers")
          .select("id, foretagsnamn")
          .in("id", dealerIds);
        const byId = new Map((dealers ?? []).map((d) => [d.id, d.foretagsnamn]));
        brokerageOffers = offers.map((o) => ({
          id: o.id,
          expected_sale_price: o.expected_sale_price,
          commission_kr: o.commission_kr,
          estimated_days: o.estimated_days,
          kommentar: o.kommentar,
          status: o.status,
          net_to_customer: o.expected_sale_price - o.commission_kr,
          foretagsnamn: byId.get(o.dealer_id) ?? "",
          created_at: o.created_at,
        }));
      }
    }

    return jsonResp({
      car: {
        id: car.id,
        regnummer: car.regnummer,
        marke: car.marke,
        modell: car.modell,
        ar: car.ar,
        miltal: car.miltal,
        skick: car.skick,
        status: car.status,
        sales_type: car.sales_type ?? "auction",
        auktion_slut: car.auktion_slut,
        kund_beslut: car.kund_beslut,
        kund_beslut_at: car.kund_beslut_at,
        created_at: car.created_at,
        direct_bid_estimate: car.direct_bid_estimate,
        brokerage_estimate_low: car.brokerage_estimate_low,
        brokerage_estimate_high: car.brokerage_estimate_high,
        condition_report: car.condition_report ?? null,
        image_count: images.length,
        images: images.map((i: { storage_url: string }) => i.storage_url),
        customer: car.customers ? { namn: car.customers.namn } : null,
        winning_bid: winningBid,
        brokerage_offers: brokerageOffers,
      },
    }, 200);
  } catch (err) {
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

async function cloneJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    return await req.clone().json();
  } catch {
    return null;
  }
}

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
