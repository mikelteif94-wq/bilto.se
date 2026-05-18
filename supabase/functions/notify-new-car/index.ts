import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SKICK_LABELS: Record<string, string> = {
  mycket_bra: "Mycket bra",
  bra: "Bra",
  okej: "Okej",
  ok: "OK",
  slitet: "Slitet",
  skadat: "Skadat",
  utmärkt: "Utmärkt",
};

interface CarRecord {
  id: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: number;
  miltal: number;
  skick: string;
  status: string;
  customer_id: string;
  created_at: string;
  sales_type?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: CarRecord;
  schema: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "hej@bilto.se";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY är inte konfigurerad" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!adminEmail) {
      return new Response(
        JSON.stringify({ error: "ADMIN_EMAIL är inte konfigurerad" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = (await req.json()) as WebhookPayload;

    if (payload.type !== "INSERT" || payload.table !== "cars" || !payload.record) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not an INSERT on cars" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const car = payload.record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: customer } = await supabase
      .from("customers")
      .select("namn, telefon, mejl")
      .eq("id", car.customer_id)
      .maybeSingle();

    const marke = car.marke?.trim() || "";
    const modell = car.modell?.trim() || "";
    const titelBil = [marke, modell].filter(Boolean).join(" ");
    const skickLabel = SKICK_LABELS[car.skick] ?? car.skick;
    const detailUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/admin/bilar/${car.id}` : `/admin/bilar/${car.id}`;
    const leadLabel = car.sales_type === "brokerage" ? "LEAD Förmedling" : "LEAD Direktbud";
    const subjectTitel = [titelBil, car.regnummer].filter(Boolean).join(" ");
    const subject = `${leadLabel}${subjectTitel ? `: ${subjectTitel}` : ""}`;

    const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 6px;color:#0e6efe;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">${leadLabel}</p>
          <h1 style="margin:0;color:#0f172a;font-size:22px;">${escapeHtml(titelBil) || escapeHtml(car.regnummer || "Ny lead")}</h1>
          ${car.regnummer ? `<p style="margin:6px 0 0;color:#64748b;font-family:monospace;letter-spacing:0.05em;font-weight:600;">${escapeHtml(car.regnummer)}</p>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <h2 style="margin:0 0 12px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Bilinformation</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
            <tr><td style="padding:6px 0;color:#64748b;width:140px;">Märke</td><td>${escapeHtml(marke) || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Modell</td><td>${escapeHtml(modell) || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Årsmodell</td><td>${car.ar || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Miltal</td><td>${car.miltal?.toLocaleString("sv-SE") ?? "—"} mil</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Skick</td><td>${escapeHtml(skickLabel)}</td></tr>
          </table>
        </td>
      </tr>
      ${customer ? `
      <tr>
        <td style="padding:0 32px 28px;">
          <h2 style="margin:0 0 12px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Säljare</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
            <tr><td style="padding:6px 0;color:#64748b;width:140px;">Namn</td><td>${escapeHtml(customer.namn ?? "")}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Telefon</td><td><a href="tel:${escapeAttr(customer.telefon ?? "")}" style="color:#0f172a;text-decoration:none;">${escapeHtml(customer.telefon ?? "")}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Mejl</td><td><a href="mailto:${escapeAttr(customer.mejl ?? "")}" style="color:#0f172a;text-decoration:none;">${escapeHtml(customer.mejl ?? "")}</a></td></tr>
          </table>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:0 32px 32px;">
          <a href="${escapeAttr(detailUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Öppna i admin</a>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">${escapeHtml(detailUrl)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = [
      `${leadLabel}${subjectTitel ? `: ${subjectTitel}` : ""}`,
      "",
      "Bilinformation:",
      `  Märke: ${marke || "—"}`,
      `  Modell: ${modell || "—"}`,
      `  Årsmodell: ${car.ar ?? "—"}`,
      `  Miltal: ${car.miltal?.toLocaleString("sv-SE") ?? "—"} mil`,
      `  Skick: ${skickLabel}`,
      "",
      customer ? "Säljare:" : "Säljare: (okänd)",
      customer ? `  Namn: ${customer.namn ?? ""}` : "",
      customer ? `  Telefon: ${customer.telefon ?? ""}` : "",
      customer ? `  Mejl: ${customer.mejl ?? ""}` : "",
      "",
      `Admin: ${detailUrl}`,
    ].filter(Boolean).join("\n");

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject,
        html,
        text,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      return new Response(
        JSON.stringify({ error: "Resend misslyckades", details: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendJson = await resendResp.json();

    return new Response(
      JSON.stringify({ ok: true, id: resendJson.id ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
