import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsubscribeRequest {
  token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token }: UnsubscribeRequest = await req.json();

    if (!token) {
      throw new Error('Token is required');
    }

    console.log('Processing unsubscribe for token:', token);

    // Find contact by unsubscribe token
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('unsubscribe_token', token)
      .single();

    if (contactError || !contact) {
      throw new Error('Invalid unsubscribe token');
    }

    if (!contact.is_subscribed) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already unsubscribed',
          email: contact.email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update contact to unsubscribed
    const { error: updateError } = await supabaseClient
      .from('contacts')
      .update({
        is_subscribed: false,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      throw new Error(`Failed to unsubscribe: ${updateError.message}`);
    }

    console.log('Successfully unsubscribed:', contact.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully unsubscribed',
        email: contact.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in unsubscribe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});