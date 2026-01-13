import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get Stripe Deposit Price ID from environment variable
const DEPOSIT_PRICE_ID = Deno.env.get("STRIPE_DEPOSIT_PRICE_ID") || "price_1SZsbmEYcGIYHnEjxUwipeWf";

interface DepositPaymentRequest {
  customerEmail: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  scheduledDate: string;
  scheduledTime: string;
  customerPhone?: string;
  billingAddress?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-DEPOSIT-PAYMENT] Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const body: DepositPaymentRequest = await req.json();
    console.log("[CREATE-DEPOSIT-PAYMENT] Request body:", JSON.stringify(body));

    const {
      customerEmail,
      customerName,
      serviceId,
      serviceName,
      servicePrice,
      scheduledDate,
      scheduledTime,
      customerPhone,
      billingAddress,
    } = body;

    if (!customerEmail || !customerName || !serviceId || !scheduledDate || !scheduledTime) {
      throw new Error("Missing required fields");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-DEPOSIT-PAYMENT] Found existing customer:", customerId);
    }

    // Create checkout session with metadata for booking
    const origin = req.headers.get("origin") || "https://zsoltdomonkosgym.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: DEPOSIT_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/checkout/${encodeURIComponent(body.serviceId)}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${encodeURIComponent(body.serviceId)}?payment_cancelled=true`,
      metadata: {
        serviceId,
        serviceName,
        servicePrice: servicePrice.toString(),
        scheduledDate,
        scheduledTime,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        billingAddress: billingAddress || "",
        type: "booking_deposit",
      },
      payment_intent_data: {
        metadata: {
          serviceId,
          serviceName,
          customerName,
          customerEmail,
          type: "booking_deposit",
        },
      },
    });

    console.log("[CREATE-DEPOSIT-PAYMENT] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-DEPOSIT-PAYMENT] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
