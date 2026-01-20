import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all tables in public schema
    const { data: tables, error: tablesError } = await supabaseClient.rpc('get_all_table_info');
    
    if (tablesError) {
      throw tablesError;
    }

    // Get all enum types
    const { data: enums, error: enumsError } = await supabaseClient.rpc('get_all_enum_types');
    
    if (enumsError) {
      throw enumsError;
    }

    // Get RLS policies
    const { data: policies, error: policiesError } = await supabaseClient.rpc('get_rls_policies');
    
    if (policiesError) {
      throw policiesError;
    }

    // Get foreign keys
    const { data: foreignKeys, error: fkError } = await supabaseClient.rpc('get_foreign_keys');
    
    if (fkError) {
      throw fkError;
    }

    return new Response(
      JSON.stringify({
        tables,
        enums,
        policies,
        foreignKeys
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching schema:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
