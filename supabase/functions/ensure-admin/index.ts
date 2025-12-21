// Deno Edge Function: ensure-admin
// Creates admin user safely using Supabase service role
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('Checking for existing user:', email);
    const { data: existingUserId } = await admin.rpc('get_user_id_by_email', { _email: email });

    let userId = existingUserId;

    if (!existingUserId) {
      console.log('Creating new user');
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error('Create error:', createError);
        throw createError;
      }

      userId = created?.user?.id;
      console.log('User created:', userId);
    } else {
      console.log('User exists, updating password');
      const { error: updateError } = await admin.auth.admin.updateUserById(existingUserId, {
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error('Update error, attempting fallback email:', updateError);
        // Fallback: create or repair a dedicated admin email
        const fallbackEmail = 'admin@admin.local';
        let fallbackId: string | null = null;
        const { data: existingFallbackId } = await admin.rpc('get_user_id_by_email', { _email: fallbackEmail });
        if (existingFallbackId) {
          const { error: upd2 } = await admin.auth.admin.updateUserById(existingFallbackId, {
            password,
            email_confirm: true,
          });
          if (upd2) throw upd2;
          fallbackId = existingFallbackId;
        } else {
          const { data: created2, error: create2 } = await admin.auth.admin.createUser({
            email: fallbackEmail,
            password,
            email_confirm: true,
          });
          if (create2) throw create2;
          fallbackId = created2?.user?.id ?? null;
        }
        // Assign role to fallback and respond with that email
        await admin.rpc('setup_admin_user_by_email', { _email: fallbackEmail });
        return new Response(JSON.stringify({ ok: true, userId: fallbackId, userEmail: fallbackEmail }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Assign admin role
    console.log('Assigning admin role');
    await admin.rpc('setup_admin_user_by_email', { _email: email });

    return new Response(JSON.stringify({ ok: true, userId, userEmail: email }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Function error:', message, e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
