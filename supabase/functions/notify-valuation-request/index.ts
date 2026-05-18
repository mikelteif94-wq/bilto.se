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
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    const body = await req.json().catch(() => ({}));
    const requestId: string | undefined = body?.valuation_request_id;
    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "valuation_request_id saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: vr } = await supabase
      .from("valuation_requests")
      .select("*, cars(id, regnummer, marke, modell, ar, miltal)")
      .eq("id", requestId)
      .maybeSingle();

    if (!vr || !vr.to_user_id) {
      return new Response(
        JSON.stringify({ error: "Förfrågan hittades inte" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: toAdmin } = await supabase
      .from("admin_users")
      .select("email, name")
      .eq("id", vr.to_user_id)
      .maybeSingle();

    if (!toAdmin?.email) {
      return new Response(
        JSON.stringify({ error: "Mottagarens e-post saknas" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const car = (vr as unknown as { cars: { id: string; regnummer: string; marke: string; modell: string; ar: number; miltal: number } }).cars;
    const titel = [car?.marke, car?.modell, car?.ar].filter(Boolean).join(" ") || "Bil";
    const detailUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/admin/bilar/${car.id}`
      : `/admin/bilar/${car.id}`;

    const subject = `Värderingsförfrågan från ${vr.from_user_name || "kollega"}: ${titel}`;

    const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:32px 32px 16px;">
      <p style="margin:0 0 6px;color:#b45309;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Värderingsförfrågan</p>
      <h1 style="margin:0;color:#0f172a;font-size:22px;line-height:1.3;">${escapeHtml(titel)}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;letter-spacing:0.05em;font-weight:600;">${escapeHtml(car?.regnummer ?? "")}</p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;color:#334155;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 12px;">Hej ${escapeHtml(toAdmin.name || "")},</p>
      <p style="margin:0 0 12px;"><strong>${escapeHtml(vr.from_user_name || "En kollega")}</strong> ber dig värdera denna bil.</p>
      ${vr.message ? `<blockquote style="margin:0 0 12px;padding:12px 14px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;color:#78350f;">${escapeHtml(vr.message).replace(/\n/g, "<br/>")}</blockquote>` : ""}
      <p style="margin:0 0 12px;color:#64748b;font-size:14px;">Miltal: ${car?.miltal?.toLocaleString("sv-SE") ?? "—"} mil</p>
    </td></tr>
    <tr><td style="padding:0 32px 32px;">
      <a href="${escapeAttr(detailUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Öppna bilen</a>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      `Värderingsförfrågan från ${vr.from_user_name || "kollega"}`,
      "",
      `Bil: ${titel} (${car?.regnummer ?? ""})`,
      vr.message ? `\nMeddelande: ${vr.message}` : "",
      "",
      `Öppna: ${detailUrl}`,
    ].filter(Boolean).join("\n");

    const results: { channel: string; ok: boolean; detaljer: string }[] = [];

    if (resendKey) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toAdmin.email],
            subject,
            html,
            text,
          }),
        });
        if (!resp.ok) {
          const errBody = await resp.text();
          results.push({ channel: "email", ok: false, detaljer: truncate(errBody, 500) });
        } else {
          results.push({ channel: "email", ok: true, detaljer: "" });
        }
      } catch (err) {
        results.push({ channel: "email", ok: false, detaljer: truncate((err as Error).message, 500) });
      }
    } else {
      results.push({ channel: "email", ok: false, detaljer: "RESEND_API_KEY saknas" });
    }

    await supabase.from("notifications_log").insert(
      results.map((r) => ({
        typ: `valuation_request_${r.channel}`,
        mottagare_mejl: toAdmin.email,
        status: r.ok ? "sent" : "failed",
        referens_id: requestId,
        detaljer: r.detaljer,
      })),
    );

    return new Response(
      JSON.stringify({ ok: true, results }),
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
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}
