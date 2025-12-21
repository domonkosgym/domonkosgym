import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[VERIFY-DEPOSIT-PAYMENT] Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not set");
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    console.log("[VERIFY-DEPOSIT-PAYMENT] Verifying session:", sessionId);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("[VERIFY-DEPOSIT-PAYMENT] Session status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract booking data from metadata
    const metadata = session.metadata;
    if (!metadata || metadata.type !== "booking_deposit") {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid session metadata" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("[VERIFY-DEPOSIT-PAYMENT] Creating booking with metadata:", JSON.stringify(metadata));

    // Create booking in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        service_id: metadata.serviceId,
        customer_name: metadata.customerName,
        customer_email: metadata.customerEmail,
        customer_phone: metadata.customerPhone || null,
        billing_address: metadata.billingAddress || null,
        scheduled_date: metadata.scheduledDate,
        scheduled_time: metadata.scheduledTime,
        duration_minutes: 30,
        price: parseInt(metadata.servicePrice),
        status: "pending",
        paid: false, // Deposit paid, but not full amount
        notes: `Előleg fizetve: 5.000 Ft (Stripe session: ${sessionId})`,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("[VERIFY-DEPOSIT-PAYMENT] Booking error:", bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log("[VERIFY-DEPOSIT-PAYMENT] Booking created:", bookingData.id);

    // Send invoice for remaining amount if service price > 5000
    const servicePrice = parseInt(metadata.servicePrice);
    const depositAmount = 5000;
    const remainingAmount = servicePrice - depositAmount;

    if (remainingAmount > 0) {
      // Optionally trigger invoice for remaining amount
      console.log("[VERIFY-DEPOSIT-PAYMENT] Remaining to pay:", remainingAmount);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      booking: bookingData,
      depositPaid: depositAmount,
      remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[VERIFY-DEPOSIT-PAYMENT] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
