import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationRequest {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAmount: number;
  currency: string;
  shippingAddress?: string;
  billingAddress?: string;
  shippingMethod?: string;
  shippingProvider?: string;
  downloadTokens?: { productName: string; token: string }[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      customerName, 
      customerEmail, 
      orderId,
      items,
      totalAmount,
      shippingAmount,
      currency,
      shippingAddress,
      billingAddress,
      shippingMethod,
      shippingProvider,
      downloadTokens
    }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", customerEmail);

    // Fetch company billing info for contact details
    const { data: companyInfo } = await supabase
      .from('company_billing_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    const companyName = companyInfo?.company_name || 'Domonkos Fitness';
    const companyPhone = companyInfo?.contact_phone || '';
    const companyEmail = companyInfo?.contact_email || '';
    const companyAddress = companyInfo ? 
      `${companyInfo.postal_code} ${companyInfo.city}, ${companyInfo.address}` : '';

    const formatPrice = (amount: number) => {
      if (currency === 'HUF') {
        return `${amount.toLocaleString('hu-HU')} Ft`;
      }
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    // Build order items HTML
    const itemsHtml = items.map(item => `
      <div class="item-row">
        <span>${item.title}</span>
        <span>${item.quantity} db × ${formatPrice(item.price)} = ${formatPrice(item.quantity * item.price)}</span>
      </div>
    `).join('');

    // Build download links if any
    const downloadSection = downloadTokens && downloadTokens.length > 0 ? `
      <div class="download-section">
        <h3>📥 Letöltések</h3>
        ${downloadTokens.map(dt => `
          <p><strong>${dt.productName}:</strong></p>
          <a href="${supabaseUrl}/functions/v1/download-file?token=${dt.token}" class="download-btn">
            Letöltés
          </a>
        `).join('')}
        <p class="note">A letöltési linkek 72 óráig érvényesek.</p>
      </div>
    ` : '';

    // Build shipping section
    const shippingSection = shippingAddress ? `
      <div class="shipping-section">
        <h3>📦 Szállítás</h3>
        <p><strong>Szállítási mód:</strong> ${shippingMethod === 'HOME' ? 'Házhozszállítás' : shippingMethod === 'BOX' ? 'Csomagpont' : 'Nincs'}</p>
        ${shippingProvider ? `<p><strong>Szolgáltató:</strong> ${shippingProvider}</p>` : ''}
        <p class="address">${shippingAddress}</p>
      </div>
    ` : '';

    // Build billing section
    const billingSection = billingAddress ? `
      <div class="billing-section">
        <h3>🧾 Számlázási adatok</h3>
        <p class="address">${billingAddress}</p>
      </div>
    ` : '';

    const orderDate = new Date().toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

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
            .item-row {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 10px;
            }
            .item-row:last-child {
              border-bottom: none;
            }
            .summary-row {
              padding: 8px 0;
              display: flex;
              justify-content: space-between;
            }
            .total-row {
              font-size: 18px;
              font-weight: bold;
              background: #f0f0f0;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
            }
            .download-section, .shipping-section, .billing-section {
              background: #e8f5e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .billing-section {
              background: #e3f2fd;
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
            .contact-section {
              background: #fff3e0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .company-info {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #888;
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
              <div class="summary-row">
                <span><strong>Rendelésszám:</strong></span>
                <span>#${orderId.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="summary-row">
                <span><strong>Dátum:</strong></span>
                <span>${orderDate}</span>
              </div>
              
              <h4 style="margin-top: 20px; margin-bottom: 10px;">Rendelt termékek:</h4>
              ${itemsHtml}
              
              ${shippingAmount > 0 ? `
                <div class="summary-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                  <span>Szállítási költség:</span>
                  <span>${formatPrice(shippingAmount)}</span>
                </div>
              ` : ''}
              
              <div class="total-row">
                <span>Összesen: ${formatPrice(totalAmount)}</span>
              </div>
            </div>

            ${downloadSection}
            ${shippingSection}
            ${billingSection}
            
            <div class="contact-section">
              <h3>📞 Kapcsolat</h3>
              <p>Ha bármilyen kérdésed vagy módosítási igényed van a szállítással kapcsolatban, kérlek vedd fel velünk a kapcsolatot:</p>
              ${companyPhone ? `<p><strong>Telefon:</strong> ${companyPhone}</p>` : ''}
              ${companyEmail ? `<p><strong>Email:</strong> ${companyEmail}</p>` : ''}
            </div>
            
            <p style="margin-top: 30px;">
              <strong>Üdvözlettel,</strong><br>
              ${companyName}
            </p>
            
            <div class="footer">
              <p>Ez egy automatikus visszaigazoló email.</p>
              <div class="company-info">
                ${companyName}<br>
                ${companyAddress}
              </div>
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
        from: `${companyName} <onboarding@resend.dev>`,
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
