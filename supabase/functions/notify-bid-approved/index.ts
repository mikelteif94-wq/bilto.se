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
    const carId: string | undefined = body?.car_id;
    if (!carId) {
      return jsonResp({ error: "car_id saknas" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: car } = await supabase
      .from("cars")
      .select(
        "id, regnummer, marke, modell, ar, miltal, vinnande_bud_id, customer_id",
      )
      .eq("id", carId)
      .maybeSingle();

    if (!car) return jsonResp({ error: "Bil saknas" }, 404);
    if (!car.vinnande_bud_id) return jsonResp({ error: "Inget vinnande bud" }, 400);

    const { data: bid } = await supabase
      .from("bids")
      .select("id, dealer_id, belopp, kommentar")
      .eq("id", car.vinnande_bud_id)
      .maybeSingle();
    if (!bid) return jsonResp({ error: "Bud saknas" }, 404);

    const { data: dealer } = await supabase
      .from("dealers")
      .select("id, foretagsnamn, kontaktperson, telefon, mejl")
      .eq("id", bid.dealer_id)
      .maybeSingle();

    const { data: customer } = await supabase
      .from("customers")
      .select("id, namn, telefon, mejl")
      .eq("id", car.customer_id)
      .maybeSingle();

    if (!dealer?.mejl) return jsonResp({ error: "Handlare saknas" }, 404);

    if (!resendKey) {
      return jsonResp({ ok: true, warning: "RESEND_API_KEY saknas" }, 200);
    }

    const detailUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/handlare/bilar/${car.id}`
      : "";

    const title = [car.marke, car.modell].filter(Boolean).join(" ") || "bilen";
    const subject = `Grattis – kunden har accepterat ditt bud: ${title}`;
    const fname =
      dealer.kontaktperson?.split(" ")[0] || dealer.foretagsnamn;

    const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px 16px;">
      <p style="margin:0 0 6px;color:#047857;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Grattis – budet är accepterat</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;">${esc(title)}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;font-weight:600;">${esc(car.regnummer)}</p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;color:#334155;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 10px;">Hej ${esc(fname)},</p>
      <p style="margin:0 0 10px;">Kunden har <strong>accepterat ditt bud på ${formatKr(bid.belopp)} kr</strong>. Affären är klar att slutföras.</p>
      <p style="margin:0 0 10px;">Kontakta säljaren inom 24 timmar för att bestämma upphämtning, betalning och papper.</p>
    </td></tr>
    ${customer ? `
    <tr><td style="padding:0 32px 24px;">
      <h2 style="margin:0 0 10px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Säljarens kontaktuppgifter</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;color:#64748b;width:130px;">Namn</td><td>${esc(customer.namn)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Telefon</td><td><a href="tel:${escAttr(customer.telefon)}" style="color:#0f172a;text-decoration:none;">${esc(customer.telefon)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">E-post</td><td><a href="mailto:${escAttr(customer.mejl)}" style="color:#0f172a;text-decoration:none;">${esc(customer.mejl)}</a></td></tr>
      </table>
    </td></tr>` : ""}
    ${detailUrl ? `<tr><td style="padding:0 32px 32px;">
      <a href="${escAttr(detailUrl)}" style="display:inline-block;background:#0e6efe;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Öppna bilen</a>
    </td></tr>` : ""}
  </table>
</body></html>`;

    const text = [
      `Grattis ${dealer.foretagsnamn}!`,
      `Kunden har accepterat ditt bud på ${formatKr(bid.belopp)} kr för ${title} (${car.regnummer}).`,
      "",
      customer ? `Säljare: ${customer.namn}` : "",
      customer ? `Telefon: ${customer.telefon}` : "",
      customer ? `Mejl: ${customer.mejl}` : "",
      "",
      detailUrl ? `Bil: ${detailUrl}` : "",
    ].filter(Boolean).join("\n");

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [dealer.mejl],
        subject,
        html,
        text,
      }),
    });

    const sentOk = resp.ok;
    await supabase.from("notifications_log").insert({
      typ: "bud_accepterat_handlare",
      mottagare_mejl: dealer.mejl,
      status: sentOk ? "sent" : "failed",
      referens_id: car.id,
      detaljer: sentOk ? "" : truncate(await resp.text(), 500),
    });

    return jsonResp({ ok: sentOk }, sentOk ? 200 : 502);
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

function formatKr(v: number): string {
  return (v ?? 0).toLocaleString("sv-SE");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}
