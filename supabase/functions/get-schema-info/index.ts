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

    console.log("Fetching table info...");
    const { data: tables, error: tablesError } = await supabaseClient.rpc('get_all_table_info');
    if (tablesError) {
      console.error("Tables error:", tablesError);
      throw tablesError;
    }

    console.log("Fetching enum types...");
    const { data: enums, error: enumsError } = await supabaseClient.rpc('get_all_enum_types');
    if (enumsError) {
      console.error("Enums error:", enumsError);
      throw enumsError;
    }

    console.log("Fetching RLS policies...");
    const { data: policies, error: policiesError } = await supabaseClient.rpc('get_rls_policies');
    if (policiesError) {
      console.error("Policies error:", policiesError);
      throw policiesError;
    }

    console.log("Fetching foreign keys...");
    const { data: foreignKeys, error: fkError } = await supabaseClient.rpc('get_foreign_keys');
    if (fkError) {
      console.error("Foreign keys error:", fkError);
      throw fkError;
    }

    console.log("Fetching primary keys...");
    const { data: primaryKeys, error: pkError } = await supabaseClient.rpc('get_primary_keys');
    if (pkError) {
      console.error("Primary keys error:", pkError);
      throw pkError;
    }

    console.log("Fetching unique constraints...");
    const { data: uniqueConstraints, error: ucError } = await supabaseClient.rpc('get_unique_constraints');
    if (ucError) {
      console.error("Unique constraints error:", ucError);
      throw ucError;
    }

    console.log("Schema info fetched successfully");
    return new Response(
      JSON.stringify({
        tables,
        enums,
        policies,
        foreignKeys,
        primaryKeys,
        uniqueConstraints
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
