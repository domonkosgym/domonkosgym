import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface CheckoutRequest {
  orderId: string;
  items: CartItem[];
  shippingFee: number;
  customerEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe nincs konfigurálva");
    }

    const { orderId, items, shippingFee, customerEmail }: CheckoutRequest = await req.json();
    
    console.log("Creating cart checkout for order:", orderId);
    console.log("Items:", items);
    console.log("Shipping fee:", shippingFee);

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
      price_data: {
        currency: "huf",
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.price),
      },
      quantity: item.quantity,
    }));

    // Add shipping fee if applicable
    if (shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "huf",
          product_data: {
            name: "Szállítási költség",
          },
          unit_amount: Math.round(shippingFee),
        },
        quantity: 1,
      });
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://domonkos.hu";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/order-success/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        order_id: orderId,
        type: "cart_order"
      },
    });

    console.log("Stripe session created:", session.id);

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ notes: `stripe_session_id:${session.id}` })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-cart-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
