import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  contactId: string;
  subject: string;
  bodyHtml?: string;
  bodyText: string;
  attachmentIds?: string[];
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { contactId, subject, bodyHtml = "", bodyText, attachmentIds = [] }: SendEmailRequest = await req.json();

    console.log('Sending single email to contact:', contactId);
    console.log('Email content - Subject:', subject);
    console.log('Email content - bodyText length:', bodyText?.length || 0);
    console.log('Email content - bodyText preview:', bodyText?.substring(0, 100));

    // Fetch contact
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    if (!contact.is_subscribed) {
      console.warn('Warning: Sending email to unsubscribed contact:', contact.email);
    }

    // Create email message record
    const { data: message, error: messageError } = await supabaseClient
      .from('email_messages')
      .insert({
        contact_id: contactId,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        status: 'sending',
        direction: 'outgoing'
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    // Fetch attachments if any
    const attachments: { filename: string; content: string }[] = [];
    if (attachmentIds.length > 0) {
      const { data: attachmentRecords, error: attachError } = await supabaseClient
        .from('email_attachments')
        .select('*')
        .in('id', attachmentIds);

      if (attachError) {
        console.error('Error fetching attachments:', attachError);
      } else if (attachmentRecords) {
        for (const attachment of attachmentRecords) {
          const { data: fileData, error: fileError } = await supabaseClient
            .storage
            .from('email_attachments')
            .download(attachment.storage_path);

          if (!fileError && fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            attachments.push({
              filename: attachment.filename,
              content: base64Content,
            });
          }
        }
      }
    }

    // Add unsubscribe link to email
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const unsubscribeUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/unsubscribe?token=${contact.unsubscribe_token}`;
    
    // Prepare email body
    const textWithUnsubscribe = `${bodyText}\n\n---\nHa nem szeretnél több emailt kapni, kattints ide a leiratkozáshoz: ${unsubscribeUrl}`;
    
    // Send email via Resend REST API
    const emailData: any = {
      from: 'Domonkos Gym <onboarding@resend.dev>',
      to: [contact.email],
      subject,
      text: textWithUnsubscribe,
    };

    // If HTML is provided, use it
    if (bodyHtml) {
      const emailBodyWithUnsubscribe = `
        ${bodyHtml}
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          Ha nem szeretnél több emailt kapni, <a href="${unsubscribeUrl}" style="color: #3b82f6;">kattints ide a leiratkozáshoz</a>.
        </p>
      `;
      emailData.html = emailBodyWithUnsubscribe;
    }

    if (attachments.length > 0) {
      emailData.attachments = attachments;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    const responseData = await resendResponse.json();

    if (!resendResponse.ok) {
      // Update message status to failed
      await supabaseClient
        .from('email_messages')
        .update({
          status: 'failed',
          error_message: responseData.message || 'Failed to send email'
        })
        .eq('id', message.id);

      throw new Error(`Failed to send email: ${responseData.message || 'Unknown error'}`);
    }

    // Update message status to sent
    await supabaseClient
      .from('email_messages')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', message.id);

    console.log('Email sent successfully:', responseData);

    return new Response(
      JSON.stringify({ success: true, messageId: message.id, emailId: responseData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-single-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
