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
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    const body = await req.json().catch(() => ({}));
    // dispatch_ids: array of dealer_dispatch row IDs to notify
    // is_nudge: bool — true = påminnelse, false = första utskick
    const dispatchIds: string[] = body?.dispatch_ids ?? [];
    const isNudge: boolean = body?.is_nudge ?? false;

    if (dispatchIds.length === 0) {
      return jsonResp({ error: "dispatch_ids saknas" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch all dispatches with dealer info
    const { data: dispatches } = await supabase
      .from("dealer_dispatches")
      .select(`
        id, car_id, quote_request_id, message, deadline_at,
        dealer_id,
        dealers ( foretagsnamn, kontaktperson, mejl )
      `)
      .in("id", dispatchIds);

    if (!dispatches || dispatches.length === 0) {
      return jsonResp({ error: "Inga dispatches hittades" }, 404);
    }

    if (!resendKey) {
      return jsonResp({ ok: true, warning: "RESEND_API_KEY saknas — ingen e-post skickad" }, 200);
    }

    let sentCount = 0;
    let failCount = 0;

    for (const dispatch of dispatches) {
      const dealer = Array.isArray(dispatch.dealers) ? dispatch.dealers[0] : dispatch.dealers;
      if (!dealer?.mejl) continue;

      // Fetch context: car or quote_request
      let contextHtml = "";
      let contextText = "";
      let subjectContext = "";
      let detailUrl = "";

      if (dispatch.car_id) {
        const { data: car } = await supabase
          .from("cars")
          .select("id, regnummer, marke, modell, ar, miltal")
          .eq("id", dispatch.car_id)
          .maybeSingle();

        if (car) {
          const carTitle = [car.ar, car.marke, car.modell].filter(Boolean).join(" ");
          subjectContext = carTitle || car.regnummer;
          detailUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/handlare/bilar/${car.id}` : "";
          contextHtml = `
            <tr><td style="padding:0 32px 24px;">
              <h2 style="margin:0 0 10px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Bil</h2>
              <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;width:100%;">
                <tr><td style="padding:4px 0;color:#64748b;width:120px;">Reg.nr</td><td style="font-family:monospace;font-weight:600;">${esc(car.regnummer)}</td></tr>
                ${car.marke ? `<tr><td style="padding:4px 0;color:#64748b;">Märke</td><td>${esc(car.marke)} ${esc(car.modell ?? "")}</td></tr>` : ""}
                ${car.ar ? `<tr><td style="padding:4px 0;color:#64748b;">År</td><td>${esc(String(car.ar))}</td></tr>` : ""}
                ${car.miltal ? `<tr><td style="padding:4px 0;color:#64748b;">Miltal</td><td>${Number(car.miltal).toLocaleString("sv-SE")} mil</td></tr>` : ""}
              </table>
            </td></tr>`;
          contextText = `Bil: ${carTitle || car.regnummer}`;
        }
      } else if (dispatch.quote_request_id) {
        const { data: qr } = await supabase
          .from("quote_requests")
          .select("id, search_option, car_model, budget, payment_type, fuel_type, additional_requests, firstname, lastname, phone")
          .eq("id", dispatch.quote_request_id)
          .maybeSingle();

        if (qr) {
          const customerName = [qr.firstname, qr.lastname].filter(Boolean).join(" ");
          subjectContext = qr.car_model || "bilsökande kund";
          const searchTypeLabel: Record<string, string> = {
            found: "Hittad specifik bil",
            searching: "Söker bil",
            trade: "Inbyte",
            explore: "Utforskar alternativ",
          };
          contextHtml = `
            <tr><td style="padding:0 32px 24px;">
              <h2 style="margin:0 0 10px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Kundens förfrågan</h2>
              <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;width:100%;">
                ${customerName ? `<tr><td style="padding:4px 0;color:#64748b;width:120px;">Kund</td><td>${esc(customerName)}</td></tr>` : ""}
                ${qr.search_option ? `<tr><td style="padding:4px 0;color:#64748b;">Typ</td><td>${esc(searchTypeLabel[qr.search_option] ?? qr.search_option)}</td></tr>` : ""}
                ${qr.car_model ? `<tr><td style="padding:4px 0;color:#64748b;">Bilmodell</td><td>${esc(qr.car_model)}</td></tr>` : ""}
                ${qr.budget ? `<tr><td style="padding:4px 0;color:#64748b;">Budget</td><td>${esc(qr.budget)}</td></tr>` : ""}
                ${qr.fuel_type ? `<tr><td style="padding:4px 0;color:#64748b;">Drivmedel</td><td>${esc(qr.fuel_type)}</td></tr>` : ""}
                ${qr.additional_requests ? `<tr><td style="padding:4px 0;color:#64748b;vertical-align:top;">Önskemål</td><td>${esc(qr.additional_requests)}</td></tr>` : ""}
                ${qr.phone ? `<tr><td style="padding:4px 0;color:#64748b;">Telefon</td><td><a href="tel:${escAttr(qr.phone)}" style="color:#0f172a;">${esc(qr.phone)}</a></td></tr>` : ""}
              </table>
            </td></tr>`;
          contextText = [
            customerName ? `Kund: ${customerName}` : "",
            qr.car_model ? `Bilmodell: ${qr.car_model}` : "",
            qr.budget ? `Budget: ${qr.budget}` : "",
            qr.phone ? `Telefon: ${qr.phone}` : "",
          ].filter(Boolean).join("\n");
        }
      }

      const fname = dealer.kontaktperson?.split(" ")[0] || dealer.foretagsnamn;
      const deadlineStr = dispatch.deadline_at
        ? new Date(dispatch.deadline_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })
        : "";

      const subject = isNudge
        ? `Påminnelse: Nytt lead väntar — ${subjectContext || "bilaffär"}`
        : `Nytt lead från Bilto — ${subjectContext || "bilaffär"}`;

      const topLabel = isNudge ? "Påminnelse – lead väntar på svar" : "Nytt lead – agera snabbt";
      const topColor = isNudge ? "#b45309" : "#0e6efe";
      const topBg = isNudge ? "#fffbeb" : "#eff6ff";
      const intro = isNudge
        ? `Vi påminner om att du har ett lead som ännu inte besvarats. Deadline är <strong>${deadlineStr}</strong>.`
        : `Du har fått ett nytt lead via Bilto. Svara inom <strong>${deadlineStr ? `deadline: ${deadlineStr}` : "angiven tid"}</strong> för att ha störst chans att vinna affären.`;

      const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px 16px;background:${topBg};">
      <p style="margin:0 0 6px;color:${topColor};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${topLabel}</p>
      <h1 style="margin:0;color:#0f172a;font-size:22px;">${esc(subjectContext || "Bilaffär")}</h1>
    </td></tr>
    <tr><td style="padding:20px 32px 4px;color:#334155;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 10px;">Hej ${esc(fname)},</p>
      <p style="margin:0 0 10px;">${intro}</p>
    </td></tr>
    ${contextHtml}
    ${dispatch.message ? `
    <tr><td style="padding:0 32px 24px;">
      <div style="background:#f1f5f9;border-radius:10px;padding:14px 16px;font-size:14px;color:#475569;white-space:pre-line;">${esc(dispatch.message)}</div>
    </td></tr>` : ""}
    ${detailUrl ? `
    <tr><td style="padding:0 32px 32px;">
      <a href="${escAttr(detailUrl)}" style="display:inline-block;background:#ffffff;color:#0e6efe !important;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;border:1.5px solid #0e6efe;-webkit-text-fill-color:#0e6efe !important;">Öppna i Handlarportalen</a>
    </td></tr>` : `
    <tr><td style="padding:0 32px 32px;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">Logga in på er handlarportal för att se detaljer och svara på leadet.</p>
    </td></tr>`}
    <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Bilto · bilto.se · Det här mailet skickades automatiskt vid tilldelning av lead.</p>
    </td></tr>
  </table>
</body></html>`;

      const text = [
        `Hej ${dealer.kontaktperson || dealer.foretagsnamn},`,
        "",
        isNudge ? `Påminnelse: Du har ett lead som väntar på svar (deadline ${deadlineStr}).` : `Du har fått ett nytt lead via Bilto.`,
        "",
        contextText,
        "",
        dispatch.message ? `Meddelande: ${dispatch.message}` : "",
        detailUrl ? `Öppna: ${detailUrl}` : "",
        "",
        "Bilto · bilto.se",
      ].filter(s => s !== undefined).join("\n");

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: fromEmail, to: [dealer.mejl], subject, html, text }),
      });

      const ok = resp.ok;
      ok ? sentCount++ : failCount++;

      await supabase.from("notifications_log").insert({
        typ: isNudge ? "handlare_dispatch_nudge" : "handlare_dispatch",
        mottagare_mejl: dealer.mejl,
        status: ok ? "sent" : "failed",
        referens_id: dispatch.car_id ?? dispatch.quote_request_id ?? dispatch.id,
        detaljer: ok ? "" : truncate(await resp.text(), 500),
      });
    }

    return jsonResp({ ok: true, sent: sentCount, failed: failCount }, 200);
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

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}
