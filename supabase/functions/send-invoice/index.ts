import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  serviceName: string;
  servicePrice: number;
}

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}-${random}`;
};

const generateInvoiceHTML = (
  invoiceNumber: string,
  companyInfo: any,
  customerName: string,
  customerEmail: string,
  customerAddress: string | undefined,
  serviceName: string,
  servicePrice: number,
  taxRate: number,
  totalAmount: number,
  issuedDate: string
) => {
  const netAmount = servicePrice;
  const taxAmount = (servicePrice * taxRate) / 100;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #333; }
    .company-info, .customer-info { margin-bottom: 20px; }
    .section-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 18px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="invoice-title">SZÁMLA</div>
    <div style="margin-top: 10px;">
      <strong>Számlaszám:</strong> ${invoiceNumber}<br>
      <strong>Kiállítás dátuma:</strong> ${issuedDate}
    </div>
  </div>

  <div class="company-info">
    <div class="section-title">SZOLGÁLTATÓ ADATAI</div>
    <strong>${companyInfo.company_name}</strong><br>
    Adószám: ${companyInfo.tax_number}<br>
    ${companyInfo.address}<br>
    ${companyInfo.postal_code} ${companyInfo.city}, ${companyInfo.country}<br>
    Email: ${companyInfo.contact_email}<br>
    ${companyInfo.contact_phone ? `Telefon: ${companyInfo.contact_phone}<br>` : ''}
    ${companyInfo.bank_name ? `Bank: ${companyInfo.bank_name}<br>` : ''}
    ${companyInfo.bank_account ? `Számlaszám: ${companyInfo.bank_account}` : ''}
  </div>

  <div class="customer-info">
    <div class="section-title">VEVŐ ADATAI</div>
    <strong>${customerName}</strong><br>
    Email: ${customerEmail}<br>
    ${customerAddress ? customerAddress : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Szolgáltatás megnevezése</th>
        <th style="text-align: right;">Nettó ár</th>
        <th style="text-align: right;">ÁFA (${taxRate}%)</th>
        <th style="text-align: right;">Bruttó ár</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${serviceName}</td>
        <td style="text-align: right;">${netAmount.toLocaleString('hu-HU')} HUF</td>
        <td style="text-align: right;">${taxAmount.toLocaleString('hu-HU')} HUF</td>
        <td style="text-align: right;">${totalAmount.toLocaleString('hu-HU')} HUF</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">Fizetendő összeg:</td>
        <td style="text-align: right;">${totalAmount.toLocaleString('hu-HU')} HUF</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Fizetési határidő:</strong> Azonnali</p>
    <p><strong>Fizetési mód:</strong> Bankkártya</p>
    <p>Köszönjük, hogy szolgáltatásunkat igénybe vette!</p>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      customerName,
      customerEmail,
      customerAddress,
      serviceName,
      servicePrice,
    }: InvoiceRequest = await req.json();

    // Céges adatok lekérése
    const { data: companyInfo, error: companyError } = await supabase
      .from("company_billing_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (companyError || !companyInfo) {
      console.error("Company info error:", companyError);
      return new Response(
        JSON.stringify({ error: "Céges adatok hiányoznak. Állítsd be az admin felületen." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invoiceNumber = generateInvoiceNumber();
    const taxRate = 27.0;
    const totalAmount = servicePrice * (1 + taxRate / 100);
    const issuedDate = new Date().toLocaleDateString("hu-HU");

    // Számla mentése az adatbázisba
    const { error: invoiceError } = await supabase.from("invoices").insert({
      invoice_number: invoiceNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_address: customerAddress,
      service_name: serviceName,
      service_price: servicePrice,
      tax_rate: taxRate,
      total_amount: totalAmount,
    });

    if (invoiceError) {
      console.error("Invoice save error:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Számla mentése sikertelen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invoiceHTML = generateInvoiceHTML(
      invoiceNumber,
      companyInfo,
      customerName,
      customerEmail,
      customerAddress,
      serviceName,
      servicePrice,
      taxRate,
      totalAmount,
      issuedDate
    );

    // Email küldése Resend API-val
    const fromEmail = Deno.env.get("FROM_EMAIL") || "info@thecoach.hu";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${companyInfo.company_name} <${fromEmail}>`,
        to: [customerEmail],
        subject: `Számla - ${invoiceNumber}`,
        html: `
          <h2>Köszönjük a vásárlást!</h2>
          <p>Kedves ${customerName}!</p>
          <p>Köszönjük, hogy szolgáltatásunkat igénybe vetted. Az alábbi mellékletben megtalálod a számládat.</p>
          <p><strong>Szolgáltatás:</strong> ${serviceName}</p>
          <p><strong>Összeg:</strong> ${totalAmount.toLocaleString('hu-HU')} HUF</p>
          <hr>
          ${invoiceHTML}
          <hr>
          <p>Üdvözlettel,<br>${companyInfo.company_name}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Email send error:", errorData);
      throw new Error(`Email küldése sikertelen: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoiceNumber,
        message: "Számla sikeresen elküldve"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
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
