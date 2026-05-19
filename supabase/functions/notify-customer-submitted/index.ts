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
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const rawAppUrl = Deno.env.get("APP_URL") ?? "";
    const appUrl = isPublicUrl(rawAppUrl) ? rawAppUrl : "https://bilto.se";

    const body = await req.json().catch(() => ({}));
    const carId: string | undefined = body?.car_id;
    const providedUrl: string | undefined = body?.tracking_url;

    if (!carId) {
      return jsonResp({ error: "car_id saknas" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select(
        "id, regnummer, marke, modell, ar, access_token, customers(namn, mejl)",
      )
      .eq("id", carId)
      .maybeSingle();

    if (carErr || !car) {
      return jsonResp({ error: "Bilen hittades inte" }, 404);
    }

    const customer = (car as {
      customers?: { namn: string; mejl: string } | null;
    }).customers;

    if (!customer?.mejl) {
      return jsonResp({ skipped: true, reason: "Ingen kundmejl" }, 200);
    }

    const titel = [car.marke, car.modell, car.ar]
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
      .join(" ") || "bil";

    const safeProvidedUrl = providedUrl && isPublicUrl(providedUrl) ? providedUrl : null;
    const trackingUrl =
      safeProvidedUrl ||
      (appUrl && car.access_token
        ? `${appUrl.replace(/\/$/, "")}/min-bil/${car.access_token}`
        : "");

    if (!resendKey) {
      await supabase.from("notifications_log").insert({
        typ: "mejl_bekraftelse_kund",
        mottagare_mejl: customer.mejl,
        status: "failed",
        referens_id: car.id,
        detaljer: "RESEND_API_KEY saknas",
      });
      return jsonResp({ error: "RESEND_API_KEY saknas" }, 500);
    }

    const fornamn = (customer.namn ?? "").trim().split(" ")[0] || customer.namn;

    const html = renderEmail({
      fornamn,
      titel,
      regnummer: car.regnummer,
      trackingUrl,
      appUrl,
    });

    const text = [
      `Hej ${fornamn}!`,
      "",
      "Tack — nu är vi igång!",
      "En av våra experter ringer dig inom kort för att gå igenom nästa steg.",
      "",
      "Under tiden kan du luta dig tillbaka ☕",
      trackingUrl ? "" : undefined,
      trackingUrl ? `Följ ärendet här: ${trackingUrl}` : undefined,
      "",
      "Vi hörs snart!",
      "Hälsningar, Bilto 🚗",
    ].filter((v): v is string => v !== undefined).join("\n");

    let status: "sent" | "failed" = "sent";
    let detaljer = "";
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [customer.mejl],
          subject: `Tack ${fornamn}! Vi ringer dig snart`,
          html,
          text,
        }),
      });
      if (!resp.ok) {
        status = "failed";
        detaljer = truncate(await resp.text(), 500);
      }
    } catch (err) {
      status = "failed";
      detaljer = truncate((err as Error).message, 500);
    }

    await supabase.from("notifications_log").insert({
      typ: "mejl_bekraftelse_kund",
      mottagare_mejl: customer.mejl,
      status,
      referens_id: car.id,
      detaljer,
    });

    return jsonResp({ ok: status === "sent" }, status === "sent" ? 200 : 500);
  } catch (err) {
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

function renderEmail(d: {
  fornamn: string;
  titel: string;
  regnummer: string;
  trackingUrl: string;
  appUrl: string;
}): string {
  const site = d.appUrl ? d.appUrl.replace(/\/$/, "") : "https://bilto.se";
  const iconUrl = `${site}/manrope_(1920_x_1080_px)_(Instagram_Post_(34))_(1).png`;
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="padding:0 0 20px;text-align:center;">
      <a href="${escAttr(site)}" style="display:inline-block;text-decoration:none;">
        <img src="${escAttr(iconUrl)}" alt="Bilto" width="40" height="40" style="width:40px;height:40px;border-radius:10px;display:inline-block;vertical-align:middle;" />
        <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">Bilto</span>
      </a>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background:#0e6efe;text-align:center;padding:36px 16px;">
          <a href="${escAttr(site)}" style="display:inline-block;text-decoration:none;">
            <img src="${escAttr(iconUrl)}" alt="Bilto" width="56" height="56" style="width:56px;height:56px;border-radius:14px;display:inline-block;vertical-align:middle;" />
            <span style="display:inline-block;vertical-align:middle;margin-left:12px;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bilto</span>
          </a>
        </td></tr>
        <tr><td style="padding:32px 32px 16px;">
          <p style="margin:0 0 6px;color:#0e6efe;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Nu kör vi</p>
          <h1 style="margin:0;color:#0f172a;font-size:26px;">Tack ${esc(d.fornamn)}!</h1>
          ${d.regnummer ? `<p style="margin:6px 0 0;color:#64748b;font-family:monospace;letter-spacing:0.05em;font-weight:600;">${esc(d.regnummer)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:0 32px 20px;color:#334155;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 12px;">Tack — nu är vi igång!</p>
          <p style="margin:0 0 12px;">En av våra experter ringer dig inom kort för att gå igenom nästa steg och svara på alla frågor.</p>
          <p style="margin:0 0 12px;color:#64748b;font-size:14px;">Under tiden kan du luta dig tillbaka — vi hör av oss snart!</p>
        </td></tr>
        ${d.trackingUrl ? `
        <tr><td style="padding:0 32px 32px;">
          <a href="${escAttr(d.trackingUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">Se min bil</a>
        </td></tr>` : ""}
      </table>
    </td></tr>
    <tr><td style="padding:28px 16px 8px;text-align:center;">
      <a href="${escAttr(site)}" style="display:inline-block;text-decoration:none;">
        <img src="${escAttr(iconUrl)}" alt="Bilto" width="28" height="28" style="width:28px;height:28px;border-radius:7px;display:inline-block;vertical-align:middle;" />
        <span style="display:inline-block;vertical-align:middle;margin-left:6px;font-size:15px;font-weight:700;color:#475569;">Bilto</span>
      </a>
      <p style="margin:10px 0 4px;color:#475569;font-size:13px;font-weight:600;">Trygg bilförsäljning</p>
      <p style="margin:0 0 10px;color:#94a3b8;font-size:12px;">
        <a href="mailto:hej@bilto.se" style="color:#64748b;text-decoration:none;">hej@bilto.se</a>
        &nbsp;·&nbsp;
        <a href="${escAttr(site)}" style="color:#64748b;text-decoration:none;">bilto.se</a>
      </p>
      <p style="margin:0;color:#cbd5e1;font-size:11px;">© ${new Date().getFullYear()} Bilto. Alla rättigheter förbehållna.</p>
    </td></tr>
  </table>
</body></html>`;
}

function jsonResp(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(s: string | null | undefined): string {
  return esc(s);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}

function isPublicUrl(u: string): boolean {
  if (!u) return false;
  try {
    const h = new URL(u).hostname.toLowerCase();
    if (!h) return false;
    if (h === "localhost" || h.endsWith(".local")) return false;
    if (h.includes("webcontainer")) return false;
    if (h.includes("stackblitz")) return false;
    if (h.includes("credentialless")) return false;
    if (h.endsWith(".bolt.new") || h.includes("bolt.new")) return false;
    return true;
  } catch {
    return false;
  }
}
