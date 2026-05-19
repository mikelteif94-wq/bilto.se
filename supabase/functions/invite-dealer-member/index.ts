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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the calling user is authenticated and is the dealer owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Ej inloggad." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Ej inloggad." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { dealer_id, fornamn, efternamn, mejl, telefon } = body;

    if (!dealer_id || !fornamn || !efternamn || !mejl) {
      return new Response(JSON.stringify({ error: "Saknade fält." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify calling user is the owner of this dealer
    const { data: dealer, error: dealerErr } = await adminClient
      .from("dealers")
      .select("id, foretagsnamn, godkand")
      .eq("id", dealer_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (dealerErr || !dealer) {
      return new Response(
        JSON.stringify({ error: "Bara kontoägaren kan bjuda in teammedlemmar." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dealer.godkand) {
      return new Response(
        JSON.stringify({ error: "Kontot är inte godkänt ännu." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check that this email isn't already a member
    const { data: existingMember } = await adminClient
      .from("dealer_members")
      .select("id")
      .eq("dealer_id", dealer_id)
      .eq("mejl", mejl.toLowerCase())
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: "Den här mejladressen är redan inbjuden." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if a Supabase auth user already exists for this email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === mejl.toLowerCase()
    );

    let memberUserId: string | null = null;

    if (existingAuthUser) {
      // User already has an account — just link them
      memberUserId = existingAuthUser.id;
    } else {
      // Create a new auth user with a random temporary password
      const tempPassword = Array.from(
        crypto.getRandomValues(new Uint8Array(16)),
        (b) => b.toString(16).padStart(2, "0")
      ).join("") + "Aa1!";

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: mejl.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: { fornamn, efternamn, dealer_id, role: "dealer_member" },
      });

      if (createErr || !newUser?.user) {
        return new Response(
          JSON.stringify({ error: "Kunde inte skapa konto: " + (createErr?.message ?? "okänt fel") }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      memberUserId = newUser.user.id;

      // Send password reset email so they can set their own password
      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: mejl.toLowerCase(),
        options: { redirectTo: `${supabaseUrl.replace("supabase.co", "supabase.co")}/handlare/installningar` },
      });
    }

    // Insert the dealer_member row
    const { error: insertErr } = await adminClient
      .from("dealer_members")
      .insert({
        dealer_id,
        user_id: memberUserId,
        fornamn,
        efternamn,
        mejl: mejl.toLowerCase(),
        telefon: telefon ?? "",
        roll: "member",
      });

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: "Kunde inte spara teammedlem: " + insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send invite email via Supabase magic link / recovery
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://bilto.se";
    await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: mejl.toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/handlare/valj-losenord`,
      },
    });

    // Send a friendly notification email
    try {
      await fetch(`${supabaseUrl}/functions/v1/notify-new-dealer-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          fornamn,
          efternamn,
          mejl: mejl.toLowerCase(),
          foretagsnamn: dealer.foretagsnamn,
          invite_link: `${siteUrl}/handlare/valj-losenord`,
        }),
      });
    } catch {
      // Non-critical — ignore notification errors
    }

    return new Response(
      JSON.stringify({ success: true, user_id: memberUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Serverfel: " + String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
