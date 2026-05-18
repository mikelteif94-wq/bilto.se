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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY saknas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const carId: string | undefined = body?.car_id;
    const dealerIds: string[] | undefined = Array.isArray(body?.dealer_ids)
      ? body.dealer_ids.filter((x: unknown): x is string => typeof x === "string")
      : undefined;
    if (!carId) {
      return new Response(
        JSON.stringify({ error: "car_id saknas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select("*, car_images(storage_url, ordning), customers(id, namn, telefon, mejl)")
      .eq("id", carId)
      .maybeSingle();

    if (carErr || !car) {
      return new Response(
        JSON.stringify({ error: "Kunde inte hämta bilen", details: carErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (car.status !== "aktiv") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Bilen är inte aktiv" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let dealersQuery = supabase
      .from("dealers")
      .select("id, foretagsnamn, kontaktperson, mejl")
      .eq("godkand", true);
    if (dealerIds && dealerIds.length > 0) {
      dealersQuery = dealersQuery.in("id", dealerIds);
    }
    const { data: dealers, error: dealersErr } = await dealersQuery;

    if (dealersErr) {
      return new Response(
        JSON.stringify({ error: "Kunde inte hämta handlare", details: dealersErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const marke = (car.marke ?? "").trim();
    const modell = (car.modell ?? "").trim();
    const ar = car.ar ?? "";
    const titel = [marke, modell, ar].filter(Boolean).join(" ") || "Ny bil";
    const skickLabel = SKICK_LABELS[car.skick] ?? car.skick;
    const subject = `Ny bil till salu: ${titel}`;
    const detailUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/handlare/bilar/${car.id}`
      : `/handlare/bilar/${car.id}`;

    const images = [...(car.car_images ?? [])].sort(
      (a: { ordning: number }, b: { ordning: number }) => a.ordning - b.ordning,
    );
    const heroImage: string | null = images[0]?.storage_url ?? null;

    const auktionSlut = car.auktion_slut
      ? new Date(car.auktion_slut).toLocaleString("sv-SE", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

    const recipients = (dealers ?? []).filter(
      (d): d is { id: string; foretagsnamn: string; kontaktperson: string; mejl: string } =>
        !!d?.mejl,
    );

    const results: {
      mejl: string;
      status: "sent" | "failed";
      detaljer: string;
    }[] = [];

    for (const dealer of recipients) {
      const hej = dealer.kontaktperson?.trim()
        ? `Hej ${escapeHtml(dealer.kontaktperson.split(" ")[0])}!`
        : "Hej!";

      const html = renderEmail({
        hej,
        titel,
        regnummer: car.regnummer,
        marke,
        modell,
        ar: String(ar || "—"),
        miltal: car.miltal?.toLocaleString("sv-SE") ?? "—",
        skickLabel,
        heroImage,
        detailUrl,
        auktionSlut,
      });

      const text = [
        `Ny bil till salu: ${titel}`,
        "",
        hej.replace(/<[^>]+>/g, ""),
        "",
        `Regnummer: ${car.regnummer}`,
        `Märke: ${marke || "—"}`,
        `Modell: ${modell || "—"}`,
        `Årsmodell: ${ar || "—"}`,
        `Miltal: ${car.miltal?.toLocaleString("sv-SE") ?? "—"} mil`,
        `Skick: ${skickLabel}`,
        "",
        auktionSlut ? `Auktionen stänger ${auktionSlut}` : "",
        "",
        `Öppna bilen: ${detailUrl}`,
      ].filter(Boolean).join("\n");

      try {
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

        if (!resp.ok) {
          const errBody = await resp.text();
          results.push({
            mejl: dealer.mejl,
            status: "failed",
            detaljer: truncate(errBody, 500),
          });
        } else {
          results.push({ mejl: dealer.mejl, status: "sent", detaljer: "" });
        }
      } catch (err) {
        results.push({
          mejl: dealer.mejl,
          status: "failed",
          detaljer: truncate((err as Error).message, 500),
        });
      }
    }

    if (results.length > 0) {
      const rows = results.map((r) => ({
        typ: "ny_bil_aktiv",
        mottagare_mejl: r.mejl,
        status: r.status,
        referens_id: car.id,
        detaljer: r.detaljer,
      }));
      await supabase.from("notifications_log").insert(rows);
    }

    // Notiser till kund: auktionen har startat
    const customer = (car as { customers?: { namn: string; telefon: string; mejl: string } | null }).customers;
    const trackingUrl = appUrl && (car as { access_token?: string }).access_token
      ? `${appUrl.replace(/\/$/, "")}/min-bil/${(car as { access_token: string }).access_token}`
      : "";

    if (customer?.mejl) {
      const fornamn = (customer.namn ?? "").trim().split(" ")[0] || customer.namn || "";
      const kundHtml = renderCustomerStartEmail({
        fornamn,
        titel,
        regnummer: car.regnummer,
        trackingUrl,
        auktionSlut: car.auktion_slut
          ? new Date(car.auktion_slut).toLocaleString("sv-SE", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : null,
      });
      const kundText = [
        `Hej ${fornamn},`,
        "",
        `Din ${titel} (${car.regnummer}) är nu ute för budgivning.`,
        "Vi återkommer inom 48 timmar med högsta budet.",
        trackingUrl ? "" : undefined,
        trackingUrl ? `Följ din bil: ${trackingUrl}` : undefined,
      ].filter((s): s is string => s !== undefined).join("\n");

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
            subject: `Din ${titel} är ute för budgivning`,
            html: kundHtml,
            text: kundText,
          }),
        });
        await supabase.from("notifications_log").insert({
          typ: "mejl_auktion_start_kund",
          mottagare_mejl: customer.mejl,
          status: resp.ok ? "sent" : "failed",
          referens_id: car.id,
          detaljer: resp.ok ? "" : truncate(await resp.text(), 500),
        });
      } catch (err) {
        await supabase.from("notifications_log").insert({
          typ: "mejl_auktion_start_kund",
          mottagare_mejl: customer.mejl,
          status: "failed",
          referens_id: car.id,
          detaljer: truncate((err as Error).message, 500),
        });
      }
    }

    if (customer?.telefon) {
      const fornamn = (customer.namn ?? "").trim().split(" ")[0] || customer.namn || "";
      const smsText = trackingUrl
        ? `Hej ${fornamn}, din ${titel} är nu ute för budgivning. Vi återkommer inom 48h med högsta bud. Följ din bil: ${trackingUrl}`
        : `Hej ${fornamn}, din ${titel} är nu ute för budgivning. Vi återkommer inom 48h med högsta bud.`;
      const smsResult = await sendSms(customer.telefon, smsText);
      if (smsResult.attempted) {
        await supabase.from("notifications_log").insert({
          typ: "sms_auktion_start_kund",
          mottagare_mejl: customer.telefon,
          status: smsResult.ok ? "sent" : "failed",
          referens_id: car.id,
          detaljer: smsResult.detaljer,
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return new Response(
      JSON.stringify({
        ok: true,
        total: results.length,
        sent,
        failed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

interface EmailData {
  hej: string;
  titel: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: string;
  miltal: string;
  skickLabel: string;
  heroImage: string | null;
  detailUrl: string;
  auktionSlut: string | null;
}

function renderEmail(d: EmailData): string {
  return `<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 20px;">
          <p style="margin:0 0 6px;color:#0f766e;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Ny bil till salu</p>
          <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:1.25;">${escapeHtml(d.titel)}</h1>
          <p style="margin:6px 0 0;color:#64748b;font-family:monospace;letter-spacing:0.05em;font-weight:600;">${escapeHtml(d.regnummer)}</p>
        </td>
      </tr>
      ${d.heroImage ? `
      <tr>
        <td style="padding:0 0 8px;">
          <img src="${escapeAttr(d.heroImage)}" alt="${escapeAttr(d.titel)}" style="display:block;width:100%;height:auto;max-height:340px;object-fit:cover;" />
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:20px 32px 8px;color:#334155;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">${d.hej}</p>
          <p style="margin:0 0 16px;">Vi har lagt upp en ny bil för budgivning. Se detaljer nedan och logga in för att lägga bud.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;border-top:1px solid #e2e8f0;">
            <tr><td style="padding:10px 0;color:#64748b;width:140px;border-bottom:1px solid #f1f5f9;">Märke</td><td style="border-bottom:1px solid #f1f5f9;">${escapeHtml(d.marke) || "—"}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Modell</td><td style="border-bottom:1px solid #f1f5f9;">${escapeHtml(d.modell) || "—"}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Årsmodell</td><td style="border-bottom:1px solid #f1f5f9;">${escapeHtml(d.ar)}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f1f5f9;">Miltal</td><td style="border-bottom:1px solid #f1f5f9;">${escapeHtml(d.miltal)} mil</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;">Skick</td><td>${escapeHtml(d.skickLabel)}</td></tr>
          </table>
        </td>
      </tr>
      ${d.auktionSlut ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;color:#78350f;font-size:14px;font-weight:600;">
            Auktionen stänger ${escapeHtml(d.auktionSlut)}
          </div>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:0 32px 32px;">
          <a href="${escapeAttr(d.detailUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Öppna bilen</a>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${escapeHtml(d.detailUrl)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderCustomerStartEmail(d: {
  fornamn: string;
  titel: string;
  regnummer: string;
  trackingUrl: string;
  auktionSlut: string | null;
}): string {
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:32px 32px 16px;">
      <p style="margin:0 0 6px;color:#0f766e;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Budgivning startad</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;">${escapeHtml(d.titel)}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;letter-spacing:0.05em;font-weight:600;">${escapeHtml(d.regnummer)}</p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;color:#334155;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 12px;">Hej ${escapeHtml(d.fornamn)},</p>
      <p style="margin:0 0 12px;">Din bil är nu ute för budgivning. Vi återkommer inom 48 timmar med högsta budet — via mejl, SMS eller telefon.</p>
      ${d.auktionSlut ? `<p style="margin:0 0 12px;color:#64748b;font-size:14px;">Auktionen stänger ${escapeHtml(d.auktionSlut)}.</p>` : ""}
    </td></tr>
    ${d.trackingUrl ? `
    <tr><td style="padding:0 32px 32px;">
      <a href="${escapeAttr(d.trackingUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Följ din bil</a>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${escapeHtml(d.trackingUrl)}</p>
    </td></tr>` : ""}
  </table>
</body></html>`;
}

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

function normalizeSwedishPhone(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/[\s\-()]/g, "");
  if (!trimmed) return null;
  let digits = trimmed;
  if (digits.startsWith("+46")) {
    digits = "+46" + digits.slice(3).replace(/\D/g, "");
  } else if (digits.startsWith("0046")) {
    digits = "+46" + digits.slice(4).replace(/\D/g, "");
  } else if (digits.startsWith("46") && !digits.startsWith("+")) {
    digits = "+46" + digits.slice(2).replace(/\D/g, "");
  } else if (digits.startsWith("0")) {
    digits = "+46" + digits.slice(1).replace(/\D/g, "");
  } else {
    return null;
  }
  const body = digits.slice(3);
  if (!/^\d{7,10}$/.test(body)) return null;
  if (!body.startsWith("7")) return null;
  return digits;
}

async function sendSms(
  phone: string,
  message: string,
): Promise<{ attempted: boolean; ok: boolean; detaljer: string }> {
  const apiUser = Deno.env.get("ELKS_API_USERNAME");
  const apiPass = Deno.env.get("ELKS_API_PASSWORD");
  const smsFrom = Deno.env.get("ELKS_SMS_FROM") ?? "Bilauktion";

  if (!apiUser || !apiPass) {
    return { attempted: false, ok: false, detaljer: "46elks-nycklar saknas" };
  }
  const normalized = normalizeSwedishPhone(phone);
  if (!normalized) {
    return {
      attempted: false,
      ok: false,
      detaljer: "Inget giltigt svenskt mobilnummer",
    };
  }

  try {
    const auth = btoa(`${apiUser}:${apiPass}`);
    const body = new URLSearchParams({
      from: smsFrom,
      to: normalized,
      message,
    });
    const resp = await fetch("https://api.46elks.com/a1/sms", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      return { attempted: true, ok: false, detaljer: truncate(errBody, 500) };
    }
    return { attempted: true, ok: true, detaljer: "" };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      detaljer: truncate((err as Error).message, 500),
    };
  }
}
