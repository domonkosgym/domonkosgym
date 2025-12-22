-- Create domains table for tracking multiple domains
CREATE TABLE public.domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_name text NOT NULL UNIQUE,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Only admins can manage domains
CREATE POLICY "Admins can manage domains" 
ON public.domains 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view domains (for potential redirect logic)
CREATE POLICY "Anyone can view domains" 
ON public.domains 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();