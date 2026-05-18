import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Car {
  id: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: number;
  miltal: number;
  skick: string;
  status: string;
  auktion_slut: string | null;
  customer_id: string;
  access_token: string;
}

interface Customer {
  id: string;
  namn: string;
  telefon: string;
  mejl: string;
}

interface Dealer {
  id: string;
  foretagsnamn: string;
  kontaktperson: string;
  telefon: string;
  mejl: string;
}

interface Bid {
  id: string;
  car_id: string;
  dealer_id: string;
  belopp: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ?? "Bilto <hej@bilto.se>";
    const appUrl = Deno.env.get("APP_URL") ?? "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const nowIso = new Date().toISOString();

    const { data: expiredCars, error: carsErr } = await supabase
      .from("cars")
      .select(
        "id, regnummer, marke, modell, ar, miltal, skick, status, auktion_slut, customer_id, access_token",
      )
      .eq("status", "aktiv")
      .not("auktion_slut", "is", null)
      .lte("auktion_slut", nowIso);

    if (carsErr) {
      return jsonResp(
        { error: "Kunde inte hämta bilar", details: carsErr.message },
        500,
      );
    }

    const processed: {
      car_id: string;
      outcome: string;
      emails: { mejl: string; status: "sent" | "failed" }[];
    }[] = [];

    for (const car of (expiredCars ?? []) as Car[]) {
      const result = await closeAuction(supabase, car, {
        resendKey,
        fromEmail,
        appUrl,
      });
      processed.push(result);
    }

    return jsonResp(
      {
        ok: true,
        processed: processed.length,
        details: processed,
      },
      200,
    );
  } catch (err) {
    return jsonResp({ error: (err as Error).message }, 500);
  }
});

async function closeAuction(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  car: Car,
  cfg: { resendKey?: string; fromEmail: string; appUrl: string },
): Promise<{
  car_id: string;
  outcome: string;
  emails: { mejl: string; status: "sent" | "failed" }[];
}> {
  const emails: { mejl: string; status: "sent" | "failed" }[] = [];

  const { data: customer } = (await supabase
    .from("customers")
    .select("id, namn, telefon, mejl")
    .eq("id", car.customer_id)
    .maybeSingle()) as { data: Customer | null };

  const { data: bids } = (await supabase
    .from("bids")
    .select("id, car_id, dealer_id, belopp")
    .eq("car_id", car.id)
    .order("belopp", { ascending: false })) as { data: Bid[] | null };

  const allBids = bids ?? [];

  if (allBids.length === 0) {
    await supabase
      .from("cars")
      .update({ status: "inga_bud" })
      .eq("id", car.id);

    if (customer?.mejl) {
      const noBidsUrl = cfg.appUrl && car.access_token
        ? `${cfg.appUrl.replace(/\/$/, "")}/min-bil/${car.access_token}`
        : "";
      const sent = await sendEmail(cfg, {
        to: customer.mejl,
        subject: `Auktionen för ${buildTitle(car)} är avslutad`,
        html: renderNoBidsCustomerEmail(car, customer, noBidsUrl),
        text: [
          `Hej ${customer.namn},`,
          "",
          `Tyvärr kom inga bud in på din bil ${buildTitle(car)} (${car.regnummer}). Vi hör av oss om nästa steg.`,
          noBidsUrl ? `\nStatus: ${noBidsUrl}` : "",
        ].filter(Boolean).join("\n"),
      });
      await logNotification(supabase, {
        typ: "auktion_inga_bud_kund",
        mottagare_mejl: customer.mejl,
        status: sent.ok ? "sent" : "failed",
        referens_id: car.id,
        detaljer: sent.detaljer,
      });
      emails.push({ mejl: customer.mejl, status: sent.ok ? "sent" : "failed" });
    }

    return { car_id: car.id, outcome: "inga_bud", emails };
  }

  const winningBid = allBids[0];
  const losingBids = allBids.slice(1);

  await supabase
    .from("cars")
    .update({
      status: "auktion_avslutad",
      vinnande_bud_id: winningBid.id,
    })
    .eq("id", car.id);

  await supabase
    .from("bids")
    .update({ status: "vunnit" })
    .eq("id", winningBid.id);

  if (losingBids.length > 0) {
    await supabase
      .from("bids")
      .update({ status: "avslaget" })
      .in(
        "id",
        losingBids.map((b) => b.id),
      );
  }

  const dealerIds = Array.from(new Set(allBids.map((b) => b.dealer_id)));
  const { data: dealersData } = (await supabase
    .from("dealers")
    .select("id, foretagsnamn, kontaktperson, telefon, mejl")
    .in("id", dealerIds)) as { data: Dealer[] | null };

  const dealerById = new Map<string, Dealer>();
  (dealersData ?? []).forEach((d) => dealerById.set(d.id, d));

  const winningDealer = dealerById.get(winningBid.dealer_id);

  if (winningDealer?.mejl) {
    const sent = await sendEmail(cfg, {
      to: winningDealer.mejl,
      subject: `Du vann auktionen: ${buildTitle(car)}`,
      html: renderWinnerEmail(car, winningBid, winningDealer, customer, cfg.appUrl),
      text: renderWinnerText(car, winningBid, winningDealer, customer, cfg.appUrl),
    });
    await logNotification(supabase, {
      typ: "auktion_vinnare_handlare",
      mottagare_mejl: winningDealer.mejl,
      status: sent.ok ? "sent" : "failed",
      referens_id: car.id,
      detaljer: sent.detaljer,
    });
    emails.push({ mejl: winningDealer.mejl, status: sent.ok ? "sent" : "failed" });
  }

  const trackingUrl = cfg.appUrl && car.access_token
    ? `${cfg.appUrl.replace(/\/$/, "")}/min-bil/${car.access_token}`
    : "";

  if (customer?.mejl && winningDealer) {
    const sent = await sendEmail(cfg, {
      to: customer.mejl,
      subject: `Din bil ${buildTitle(car)} har fått ett vinnande bud`,
      html: renderCustomerEmail(car, winningBid, winningDealer, customer, trackingUrl),
      text: renderCustomerText(car, winningBid, winningDealer, customer, trackingUrl),
    });
    await logNotification(supabase, {
      typ: "auktion_vinnare_kund",
      mottagare_mejl: customer.mejl,
      status: sent.ok ? "sent" : "failed",
      referens_id: car.id,
      detaljer: sent.detaljer,
    });
    emails.push({ mejl: customer.mejl, status: sent.ok ? "sent" : "failed" });
  }

  // SMS till kunden
  if (customer?.telefon && winningDealer) {
    const smsText = trackingUrl
      ? `Ditt högsta bud: ${formatKr(winningBid.belopp)} kr från ${winningDealer.foretagsnamn}. De ringer inom 24h. Se och svara: ${trackingUrl}`
      : `Ditt högsta bud: ${formatKr(winningBid.belopp)} kr från ${winningDealer.foretagsnamn}. De ringer inom 24h.`;
    const smsRes = await sendSms(customer.telefon, smsText);
    if (smsRes.attempted) {
      await logNotification(supabase, {
        typ: "sms_auktion_vinnare_kund",
        mottagare_mejl: customer.telefon,
        status: smsRes.ok ? "sent" : "failed",
        referens_id: car.id,
        detaljer: smsRes.detaljer,
      });
    }
  }

  // SMS till vinnande handlare
  if (winningDealer?.telefon) {
    const smsText = `Du vann auktionen på ${buildTitle(car)}. Kunduppgifter skickade via mejl.`;
    const smsRes = await sendSms(winningDealer.telefon, smsText);
    if (smsRes.attempted) {
      await logNotification(supabase, {
        typ: "sms_auktion_vinnare_handlare",
        mottagare_mejl: winningDealer.telefon,
        status: smsRes.ok ? "sent" : "failed",
        referens_id: car.id,
        detaljer: smsRes.detaljer,
      });
    }
  }

  for (const losing of losingBids) {
    const dealer = dealerById.get(losing.dealer_id);
    if (!dealer?.mejl) continue;
    const sent = await sendEmail(cfg, {
      to: dealer.mejl,
      subject: `Auktionen är avslutad: ${buildTitle(car)}`,
      html: renderLoserEmail(car, winningBid.belopp, dealer),
      text: renderLoserText(car, winningBid.belopp, dealer),
    });
    await logNotification(supabase, {
      typ: "auktion_forlorare_handlare",
      mottagare_mejl: dealer.mejl,
      status: sent.ok ? "sent" : "failed",
      referens_id: car.id,
      detaljer: sent.detaljer,
    });
    emails.push({ mejl: dealer.mejl, status: sent.ok ? "sent" : "failed" });
  }

  return { car_id: car.id, outcome: "auktion_avslutad", emails };
}

async function sendEmail(
  cfg: { resendKey?: string; fromEmail: string },
  msg: { to: string; subject: string; html: string; text: string },
): Promise<{ ok: boolean; detaljer: string }> {
  if (!cfg.resendKey) {
    return { ok: false, detaljer: "RESEND_API_KEY saknas" };
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.fromEmail,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, detaljer: truncate(body, 500) };
    }
    return { ok: true, detaljer: "" };
  } catch (err) {
    return { ok: false, detaljer: truncate((err as Error).message, 500) };
  }
}

async function logNotification(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  row: {
    typ: string;
    mottagare_mejl: string;
    status: "sent" | "failed";
    referens_id: string;
    detaljer: string;
  },
) {
  await supabase.from("notifications_log").insert(row);
}

function buildTitle(car: Car): string {
  const parts = [car.marke, car.modell, car.ar].filter(Boolean);
  return parts.length ? parts.join(" ") : "Okänd bil";
}

function formatKr(v: number): string {
  return (v ?? 0).toLocaleString("sv-SE");
}

function shell(inner: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      ${inner}
    </table>
  </body></html>`;
}

function renderWinnerEmail(
  car: Car,
  bid: Bid,
  dealer: Dealer,
  customer: Customer | null,
  appUrl: string,
): string {
  const detailUrl = appUrl
    ? `${appUrl.replace(/\/$/, "")}/handlare/bilar/${car.id}`
    : `/handlare/bilar/${car.id}`;
  return shell(`
    <tr><td style="padding:32px 32px 16px;">
      <p style="margin:0 0 6px;color:#047857;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Du vann auktionen</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;">${esc(buildTitle(car))}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;font-weight:600;">${esc(car.regnummer)}</p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;color:#334155;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 10px;">Hej ${esc(dealer.kontaktperson?.split(" ")[0] || dealer.foretagsnamn)},</p>
      <p style="margin:0 0 10px;">Grattis — ditt bud på <strong>${formatKr(bid.belopp)} kr</strong> var högst och du har vunnit auktionen.</p>
      <p style="margin:0 0 10px;">Kontakta säljaren inom 24 timmar för att slutföra affären.</p>
    </td></tr>
    ${customer ? `
    <tr><td style="padding:0 32px 24px;">
      <h2 style="margin:0 0 12px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Säljarens kontakt</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;color:#64748b;width:140px;">Namn</td><td>${esc(customer.namn)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Telefon</td><td><a href="tel:${escAttr(customer.telefon)}" style="color:#0f172a;text-decoration:none;">${esc(customer.telefon)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Mejl</td><td><a href="mailto:${escAttr(customer.mejl)}" style="color:#0f172a;text-decoration:none;">${esc(customer.mejl)}</a></td></tr>
      </table>
    </td></tr>` : ""}
    <tr><td style="padding:0 32px 32px;">
      <a href="${escAttr(detailUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Öppna bilen</a>
    </td></tr>
  `);
}

function renderWinnerText(
  car: Car,
  bid: Bid,
  dealer: Dealer,
  customer: Customer | null,
  appUrl: string,
): string {
  const detailUrl = appUrl
    ? `${appUrl.replace(/\/$/, "")}/handlare/bilar/${car.id}`
    : `/handlare/bilar/${car.id}`;
  return [
    `Grattis ${dealer.foretagsnamn}!`,
    `Du vann auktionen för ${buildTitle(car)} (${car.regnummer}) med ${formatKr(bid.belopp)} kr.`,
    "",
    customer ? "Säljarens kontakt:" : "",
    customer ? `  Namn: ${customer.namn}` : "",
    customer ? `  Telefon: ${customer.telefon}` : "",
    customer ? `  Mejl: ${customer.mejl}` : "",
    "",
    `Bil: ${detailUrl}`,
  ].filter(Boolean).join("\n");
}

function renderCustomerEmail(
  car: Car,
  bid: Bid,
  dealer: Dealer,
  customer: Customer,
  trackingUrl: string,
): string {
  return shell(`
    <tr><td style="padding:32px 32px 16px;">
      <p style="margin:0 0 6px;color:#0f766e;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Din auktion är avslutad</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;">${esc(buildTitle(car))}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;font-weight:600;">${esc(car.regnummer)}</p>
    </td></tr>
    <tr><td style="padding:0 32px 24px;color:#334155;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 12px;">Hej ${esc(customer.namn?.split(" ")[0] || customer.namn)},</p>
      <p style="margin:0 0 12px;">Ditt högsta bud är <strong>${formatKr(bid.belopp)} kr</strong> från <strong>${esc(dealer.foretagsnamn)}</strong>. De kontaktar dig inom 24 timmar.</p>
      <p style="margin:0 0 12px;color:#64748b;font-size:14px;">Du kan svara ja eller nej på budet redan nu via din personliga länk — eller vänta tills handlaren ringer.</p>
    </td></tr>
    ${trackingUrl ? `
    <tr><td style="padding:0 32px 32px;">
      <a href="${escAttr(trackingUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Se budet och svara</a>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${esc(trackingUrl)}</p>
    </td></tr>` : ""}
  `);
}

function renderCustomerText(
  car: Car,
  bid: Bid,
  dealer: Dealer,
  customer: Customer,
  trackingUrl: string,
): string {
  return [
    `Hej ${customer.namn},`,
    "",
    `Din auktion för ${buildTitle(car)} (${car.regnummer}) är avslutad.`,
    `Ditt högsta bud är ${formatKr(bid.belopp)} kr från ${dealer.foretagsnamn}. De kontaktar dig inom 24 timmar.`,
    trackingUrl ? "" : "",
    trackingUrl ? `Se budet och svara: ${trackingUrl}` : "",
  ].filter(Boolean).join("\n");
}

function renderLoserEmail(car: Car, winningAmount: number, dealer: Dealer): string {
  return shell(`
    <tr><td style="padding:32px 32px 16px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Auktionen är avslutad</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;">${esc(buildTitle(car))}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;font-weight:600;">${esc(car.regnummer)}</p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;color:#334155;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 12px;">Hej ${esc(dealer.kontaktperson?.split(" ")[0] || dealer.foretagsnamn)},</p>
      <p style="margin:0 0 12px;">Auktionen är avslutad. Vinnande bud var <strong>${formatKr(winningAmount)} kr</strong>.</p>
      <p style="margin:0 0 12px;color:#64748b;font-size:14px;">Tack för ditt bud — vi hör av oss nästa gång en bil som matchar läggs upp.</p>
    </td></tr>
  `);
}

function renderLoserText(car: Car, winningAmount: number, dealer: Dealer): string {
  return [
    `Hej ${dealer.foretagsnamn},`,
    "",
    `Auktionen för ${buildTitle(car)} (${car.regnummer}) är avslutad.`,
    `Vinnande bud var ${formatKr(winningAmount)} kr.`,
  ].join("\n");
}

function renderNoBidsCustomerEmail(
  car: Car,
  customer: Customer,
  trackingUrl: string,
): string {
  return shell(`
    <tr><td style="padding:32px 32px 16px;">
      <p style="margin:0 0 6px;color:#b45309;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Auktionen är avslutad</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;">${esc(buildTitle(car))}</h1>
      <p style="margin:6px 0 0;color:#64748b;font-family:monospace;font-weight:600;">${esc(car.regnummer)}</p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;color:#334155;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 12px;">Hej ${esc(customer.namn?.split(" ")[0] || customer.namn)},</p>
      <p style="margin:0 0 12px;">Tyvärr kom inga bud in på din bil. Vårt team hör av sig inom kort för att diskutera nästa steg.</p>
    </td></tr>
    ${trackingUrl ? `
    <tr><td style="padding:0 32px 32px;">
      <a href="${escAttr(trackingUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Se din bil</a>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${esc(trackingUrl)}</p>
    </td></tr>` : ""}
  `);
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
