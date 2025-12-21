import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  productType: 'DIGITAL' | 'PHYSICAL';
  shippingAddress?: string;
  downloadToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerName, 
      customerEmail, 
      orderId,
      productName,
      quantity,
      totalAmount,
      currency,
      productType,
      shippingAddress,
      downloadToken
    }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", customerEmail);

    const formatPrice = (amount: number) => {
      if (currency === 'HUF') {
        return `${amount.toLocaleString('hu-HU')} Ft`;
      }
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const digitalSection = productType === 'DIGITAL' && downloadToken ? `
      <div class="download-section">
        <h3>📥 Letöltés</h3>
        <p>A megrendelt e-könyvet az alábbi linken töltheted le:</p>
        <a href="https://pnqqntimtllriocggqgr.supabase.co/functions/v1/download-file?token=${downloadToken}" class="download-btn">
          E-könyv letöltése
        </a>
        <p class="note">A letöltési link 72 óráig érvényes.</p>
      </div>
    ` : '';

    const physicalSection = productType === 'PHYSICAL' ? `
      <div class="shipping-section">
        <h3>📦 Szállítás</h3>
        <p>A megrendelésedet hamarosan postázzuk az alábbi címre:</p>
        <p class="address">${shippingAddress || 'Szállítási cím megadva'}</p>
      </div>
    ` : '';

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
            .order-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #D4FF00;
            }
            .detail-row {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
              display: flex;
              justify-content: space-between;
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
            }
            .total-row {
              font-size: 18px;
              font-weight: bold;
              background: #f0f0f0;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
            }
            .download-section, .shipping-section {
              background: #e8f5e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .download-btn {
              display: inline-block;
              background: #D4FF00;
              color: #000;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 10px 0;
            }
            .note {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
            .address {
              background: white;
              padding: 10px;
              border-radius: 4px;
              margin: 10px 0;
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
            <h1 style="margin: 0;">✅ Sikeres Rendelés!</h1>
          </div>
          <div class="content">
            <p>Kedves ${customerName}!</p>
            
            <p>Köszönjük a rendelésedet! Az alábbiakban találod a rendelésed részleteit.</p>
            
            <div class="order-details">
              <div class="detail-row">
                <span class="label">Rendelésszám:</span>
                <span class="value">#${orderId.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Termék:</span>
                <span class="value">${productName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Mennyiség:</span>
                <span class="value">${quantity} db</span>
              </div>
              <div class="total-row">
                <span>Összesen: ${formatPrice(totalAmount)}</span>
              </div>
            </div>

            ${digitalSection}
            ${physicalSection}
            
            <p>Ha bármilyen kérdésed van, kérlek vedd fel velünk a kapcsolatot.</p>
            
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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Domonkos Fitness <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `Rendelés megerősítve - #${orderId.substring(0, 8).toUpperCase()}`,
        html: emailHTML,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Email send error:", errorData);
      throw new Error(`Email küldése sikertelen: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Order confirmation email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Visszaigazoló email elküldve"
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
    console.error("Error in send-order-confirmation function:", error);
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
