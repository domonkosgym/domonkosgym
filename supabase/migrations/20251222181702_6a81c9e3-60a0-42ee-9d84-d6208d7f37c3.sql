-- Create email templates table for automatic messages
CREATE TABLE public.email_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key text NOT NULL UNIQUE,
    name text NOT NULL,
    subject_hu text NOT NULL,
    subject_en text NOT NULL DEFAULT '',
    subject_es text NOT NULL DEFAULT '',
    body_html_hu text NOT NULL,
    body_html_en text NOT NULL DEFAULT '',
    body_html_es text NOT NULL DEFAULT '',
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view templates (for edge functions)
CREATE POLICY "Anyone can view email templates"
ON public.email_templates
FOR SELECT
USING (true);

-- Insert default templates
INSERT INTO public.email_templates (template_key, name, subject_hu, body_html_hu, description) VALUES
('order_success', 'Sikeres termék vásárlás', 'Rendelés megerősítve - #{{order_id}}', 
'<p>Kedves {{customer_name}}!</p>
<p>Köszönjük a rendelésedet! Az alábbiakban találod a rendelésed részleteit.</p>
<p><strong>Rendelésszám:</strong> #{{order_id}}</p>
<p><strong>Termékek:</strong></p>
{{order_items}}
<p><strong>Összesen:</strong> {{total_amount}}</p>
<p><strong>Szállítási cím:</strong> {{shipping_address}}</p>
<p><strong>Számlázási adatok:</strong> {{billing_address}}</p>
<p>Ha bármilyen kérdésed vagy módosítási igényed van a szállítással kapcsolatban, kérlek vedd fel velünk a kapcsolatot:</p>
<p>📞 Telefon: {{company_phone}}<br>📧 Email: {{company_email}}</p>
<p>Üdvözlettel,<br>{{company_name}}</p>', 
'Automata levél sikeres termék/könyv vásárlásnál'),

('booking_success', 'Sikeres szolgáltatás foglalás', 'Foglalás megerősítve - {{service_name}}',
'<p>Kedves {{customer_name}}!</p>
<p>Köszönjük a foglalásodat! Az alábbiakban találod a foglalásod részleteit.</p>
<p><strong>Szolgáltatás:</strong> {{service_name}}</p>
<p><strong>Időpont:</strong> {{booking_date}} {{booking_time}}</p>
<p><strong>Ár:</strong> {{price}}</p>
<p><strong>Számlázási cím:</strong> {{billing_address}}</p>
<p>Ha bármilyen kérdésed van vagy módosítani szeretnéd az időpontot, kérlek vedd fel velünk a kapcsolatot:</p>
<p>📞 Telefon: {{company_phone}}<br>📧 Email: {{company_email}}</p>
<p>Üdvözlettel,<br>{{company_name}}</p>',
'Automata levél sikeres szolgáltatás foglalásnál');

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();