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

const LOGO_URL = "data:image/png;base64,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";

function renderEmail(d: EmailData): string {
  return `<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:20px 32px 16px;text-align:center;">
          <a href="https://bilto.se" style="text-decoration:none;display:inline-block;background:#0e6efe;border-radius:12px;padding:10px 24px;">
            <img src="${LOGO_URL}" alt="Bilto" width="100" style="width:100px;height:auto;display:block;" />
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 20px;">
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
