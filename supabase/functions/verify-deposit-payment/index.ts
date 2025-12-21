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

    // Send booking confirmation email
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        // Format date for email
        const dateForEmail = new Date(metadata.scheduledDate).toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Domonkos Fitness <onboarding@resend.dev>",
            to: [metadata.customerEmail],
            subject: "Foglalás megerősítve - Domonkos Fitness",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #D4FF00, #B8E000); color: #000; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4FF00; }
                    .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
                    .detail-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #000; font-size: 16px; }
                    .payment-info { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1 style="margin: 0;">✅ Foglalás Megerősítve!</h1>
                  </div>
                  <div class="content">
                    <p>Kedves ${metadata.customerName}!</p>
                    <p>Örömmel értesítünk, hogy az időpontfoglalásod <strong>megerősítésre került</strong>.</p>
                    
                    <div class="booking-details">
                      <div class="detail-row">
                        <div class="label">Szolgáltatás:</div>
                        <div class="value">${metadata.serviceName}</div>
                      </div>
                      <div class="detail-row">
                        <div class="label">Dátum:</div>
                        <div class="value">${dateForEmail}</div>
                      </div>
                      <div class="detail-row">
                        <div class="label">Időpont:</div>
                        <div class="value">${metadata.scheduledTime}</div>
                      </div>
                    </div>
                    
                    <div class="payment-info">
                      <p><strong>💳 Fizetés állapota:</strong></p>
                      <p>✓ Előleg fizetve: ${depositAmount.toLocaleString('hu-HU')} Ft</p>
                      ${remainingAmount > 0 ? `<p>Fennmaradó összeg (helyszínen fizetendő): ${remainingAmount.toLocaleString('hu-HU')} Ft</p>` : ''}
                    </div>
                    
                    <p>Kérlek, érkezz pontosan a megadott időpontra. Ha bármi kérdésed van, vagy módosítani szeretnéd az időpontot, kérlek vedd fel velem a kapcsolatot.</p>
                    
                    <p>Várlak szeretettel!</p>
                    
                    <p style="margin-top: 30px;">
                      <strong>Üdvözlettel,</strong><br>
                      Domonkos Zsolt<br>
                      Fitness szakértő
                    </p>
                    
                    <div class="footer">
                      <p>Ez egy automatikus értesítő email. Kérlek ne válaszolj rá.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          console.log("[VERIFY-DEPOSIT-PAYMENT] Confirmation email sent successfully");
        } else {
          const emailError = await emailResponse.text();
          console.error("[VERIFY-DEPOSIT-PAYMENT] Email send error:", emailError);
        }
      }
    } catch (emailError) {
      console.error("[VERIFY-DEPOSIT-PAYMENT] Failed to send confirmation email:", emailError);
      // Don't throw - booking is still successful even if email fails
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
