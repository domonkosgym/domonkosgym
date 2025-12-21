import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerName, 
      customerEmail, 
      serviceName,
      scheduledDate,
      scheduledTime 
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending booking confirmation to:", customerEmail);

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #D4FF00, #B8E000);
              color: #000;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .booking-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #D4FF00;
            }
            .detail-row {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #000;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✅ Foglalás Megerősítve!</h1>
          </div>
          <div class="content">
            <p>Kedves ${customerName}!</p>
            
            <p>Örömmel értesítünk, hogy az időpontfoglalásod <strong>megerősítésre került</strong>.</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <div class="label">Szolgáltatás:</div>
                <div class="value">${serviceName}</div>
              </div>
              <div class="detail-row">
                <div class="label">Dátum:</div>
                <div class="value">${scheduledDate}</div>
              </div>
              <div class="detail-row">
                <div class="label">Időpont:</div>
                <div class="value">${scheduledTime}</div>
              </div>
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
    `;

    // Email küldése Resend API-val
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Domonkos Fitness <onboarding@resend.dev>",
        to: [customerEmail],
        subject: "Foglalás megerősítve - Domonkos Fitness",
        html: emailHTML,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Email send error:", errorData);
      throw new Error(`Email küldése sikertelen: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Megerősítő email elküldve"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
