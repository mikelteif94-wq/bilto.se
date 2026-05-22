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

const LOGO_URL = "https://bilto.se/ChatGPT_Image_9_maj_2026_15_33_44.png";
const SITE = "https://bilto.se";

function emailShell(opts: { preheader: string; heroContent: string; bodyContent: string; footerExtra?: string }): string {
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>Bilto</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
        <tr><td style="padding:0;line-height:0;">
          <a href="${SITE}" style="text-decoration:none;display:block;">
            <img src="${LOGO_URL}" alt="Bilto" width="580" style="width:100%;max-width:580px;height:auto;display:block;border-radius:16px 16px 0 0;" />
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#0a4fd4 0%,#0e6efe 60%,#3b87ff 100%);padding:40px 40px 36px;text-align:center;">
              ${opts.heroContent}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 32px;">
              ${opts.bodyContent}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 40px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:24px 40px 36px;">
              <p style="margin:0 0 2px;font-size:14px;color:#64748b;line-height:1.6;">Med vänliga hälsningar,</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">Teamet på Bilto</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
            <a href="mailto:hej@bilto.se" style="color:#64748b;text-decoration:none;font-weight:500;">hej@bilto.se</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE}" style="color:#64748b;text-decoration:none;font-weight:500;">bilto.se</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} Bilto. Alla rättigheter förbehållna.</p>
        </td></tr>
      </table>
    </td></tr>
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
  const firstName = dealer.kontaktperson?.split(" ")[0] || dealer.foretagsnamn;
  return emailShell({
    preheader: `Grattis ${esc(firstName)}! Du vann auktionen för ${esc(buildTitle(car))}.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Du vann auktionen</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Grattis ${esc(firstName)}!</h1>
      <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${esc(buildTitle(car))}</p>
    `,
    bodyContent: `
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.7;font-weight:500;">Ditt bud på <strong>${formatKr(bid.belopp)} kr</strong> var högst — du har vunnit auktionen!</p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">Kontakta säljaren inom 24 timmar för att slutföra affären.</p>
      ${customer ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Säljarens kontakt</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
          <tr><td style="padding:5px 0;color:#64748b;width:80px;">Namn</td><td style="font-weight:600;color:#0f172a;">${esc(customer.namn)}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">Telefon</td><td><a href="tel:${escAttr(customer.telefon)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">${esc(customer.telefon)}</a></td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">Mejl</td><td><a href="mailto:${escAttr(customer.mejl)}" style="color:#0e6efe;text-decoration:none;font-weight:600;">${esc(customer.mejl)}</a></td></tr>
        </table>
      </div>` : ""}
      <a href="${escAttr(detailUrl)}" style="display:inline-block;background:#ffffff;color:#0e6efe !important;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.02em;border:1.5px solid #0e6efe;-webkit-text-fill-color:#0e6efe !important;">Öppna bilen &rarr;</a>
    `,
  });
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
  const firstName = customer.namn?.split(" ")[0] || customer.namn;
  return emailShell({
    preheader: `Hej ${esc(firstName)}! Din auktion är avslutad — du har fått ett bud på ${formatKr(bid.belopp)} kr.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Auktionen är avslutad</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Du har fått ett bud!</h1>
      <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${esc(buildTitle(car))} &middot; ${esc(car.regnummer)}</p>
    `,
    bodyContent: `
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.7;font-weight:500;">Hej ${esc(firstName)},</p>
      <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1e40af;">Högsta bud</p>
        <p style="margin:0;font-size:28px;font-weight:800;color:#0f172a;">${formatKr(bid.belopp)} kr</p>
        <p style="margin:4px 0 0;font-size:14px;color:#475569;">från <strong>${esc(dealer.foretagsnamn)}</strong></p>
      </div>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Handlaren kontaktar dig inom 24 timmar. Du kan också svara på budet redan nu via din personliga länk.</p>
      ${trackingUrl ? `<a href="${escAttr(trackingUrl)}" style="display:inline-block;background:#ffffff;color:#0e6efe !important;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.02em;border:1.5px solid #0e6efe;-webkit-text-fill-color:#0e6efe !important;">Se budet och svara &rarr;</a>` : ""}
    `,
  });
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
  const firstName = customer.namn?.split(" ")[0] || customer.namn;
  return emailShell({
    preheader: `Hej ${esc(firstName)}. Auktionen för ${esc(buildTitle(car))} är avslutad — vi hör av oss om nästa steg.`,
    heroContent: `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Auktionen är avslutad</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">${esc(buildTitle(car))}</h1>
      <p style="margin:10px 0 0;font-size:14px;font-family:monospace;letter-spacing:0.08em;color:rgba(255,255,255,0.7);">${esc(car.regnummer)}</p>
    `,
    bodyContent: `
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.7;font-weight:500;">Hej ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Tyvärr kom inga bud in på din bil den här gången. Vi vet att det kan kännas frustrerande — men ge inte upp!</p>
      <div style="background:#fefce8;border-left:4px solid #eab308;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#713f12;line-height:1.6;">Vårt team hör av sig inom kort för att diskutera nästa steg och hitta den bästa vägen framåt för dig.</p>
      </div>
      ${trackingUrl ? `<a href="${escAttr(trackingUrl)}" style="display:inline-block;background:#ffffff;color:#0e6efe !important;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.02em;border:1.5px solid #0e6efe;-webkit-text-fill-color:#0e6efe !important;">Se din bil &rarr;</a>` : ""}
    `,
  });
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
