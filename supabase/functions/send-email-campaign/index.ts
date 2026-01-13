import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendCampaignRequest {
  campaignId: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const BATCH_SIZE = 2; // Reduced to respect rate limits
const DELAY_BETWEEN_EMAILS_MS = 600; // 600ms delay between individual emails (allows ~1.5 emails/sec)
const DELAY_BETWEEN_BATCHES_MS = 2000; // 2 second delay between batches

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

    const { campaignId }: SendCampaignRequest = await req.json();

    console.log('Starting campaign send:', campaignId);

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    console.log('Campaign data:', {
      name: campaign.name,
      subject: campaign.subject,
      body_text_length: campaign.body_text?.length || 0,
      body_html_length: campaign.body_html?.length || 0,
      has_body_text: !!campaign.body_text,
      has_body_html: !!campaign.body_html
    });

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign already sent or in progress');
    }

    // Update campaign status to sending
    await supabaseClient
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    // Fetch all subscribed contacts
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('is_subscribed', true);

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      throw new Error('No subscribed contacts found');
    }

    console.log(`Found ${contacts.length} subscribed contacts`);

    // Create recipient records
    const recipientRecords = contacts.map(contact => ({
      campaign_id: campaignId,
      contact_id: contact.id,
      email: contact.email,
      status: 'pending'
    }));

    const { error: recipientsError } = await supabaseClient
      .from('email_campaign_recipients')
      .upsert(recipientRecords, { onConflict: 'campaign_id,contact_id' });

    if (recipientsError) {
      console.error('Error creating recipients:', recipientsError);
    }

    // Fetch attachments if any
    const { data: attachmentRecords } = await supabaseClient
      .from('email_attachments')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('message_type', 'campaign');

    const attachments: { filename: string; content: string }[] = [];
    if (attachmentRecords && attachmentRecords.length > 0) {
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

    // Send emails in batches with delays
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(contacts.length / BATCH_SIZE)}`);

      // Send emails sequentially with delay to respect rate limits
      for (let j = 0; j < batch.length; j++) {
        const contact = batch[j];
        try {
          // Add unsubscribe link using SITE_URL
          const siteUrl = Deno.env.get('SITE_URL') || 'https://www.thecoach.hu';
          const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${contact.unsubscribe_token}`;
          
          const campaignBodyText = campaign.body_text ?? '';
          const textWithUnsubscribe = `${campaignBodyText}\n\n---\nHa nem szeretnél több emailt kapni, kattints ide a leiratkozáshoz: ${unsubscribeUrl}`;
          
          console.log(`Preparing email for ${contact.email}:`, {
            subject: campaign.subject,
            text_length: textWithUnsubscribe.length,
            has_html: !!campaign.body_html
          });
          
          const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@thecoach.hu';
          const emailData: any = {
            from: `The Coach <${fromEmail}>`,
            to: [contact.email],
            subject: campaign.subject,
            text: textWithUnsubscribe,
          };

          // If HTML is provided, use it
          if (campaign.body_html) {
            const emailBodyWithUnsubscribe = `
              ${campaign.body_html}
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
            await supabaseClient
              .from('email_campaign_recipients')
              .update({
                status: 'failed',
                error_message: responseData.message || 'Failed to send email'
              })
              .eq('campaign_id', campaignId)
              .eq('contact_id', contact.id);

            failCount++;
            console.error(`Failed to send to ${contact.email}:`, responseData.message);
          } else {
            await supabaseClient
              .from('email_campaign_recipients')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('campaign_id', campaignId)
              .eq('contact_id', contact.id);

            successCount++;
          }
        } catch (error: any) {
          await supabaseClient
            .from('email_campaign_recipients')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('campaign_id', campaignId)
            .eq('contact_id', contact.id);

          failCount++;
          console.error(`Exception sending to ${contact.email}:`, error);
        }

        // Add delay between individual emails within batch (except for last email)
        if (j < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
        }
      }

      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
    }

    // Update campaign status to sent
    await supabaseClient
      .from('email_campaigns')
      .update({ status: 'sent' })
      .eq('id', campaignId);

    console.log(`Campaign completed: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        campaignId,
        stats: {
          total: contacts.length,
          sent: successCount,
          failed: failCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-email-campaign:', error);
    
    // Try to update campaign status to failed
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { campaignId } = await req.json();
      await supabaseClient
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
    } catch (e) {
      console.error('Failed to update campaign status:', e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
