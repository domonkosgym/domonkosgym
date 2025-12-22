-- Create shipping providers table for multiple shipping options
CREATE TABLE public.shipping_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('HOME', 'BOX')),
  fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;

-- Admins can manage shipping providers
CREATE POLICY "Admins can manage shipping providers"
ON public.shipping_providers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active shipping providers
CREATE POLICY "Anyone can view active shipping providers"
ON public.shipping_providers
FOR SELECT
USING (is_active = true);

-- Insert default providers
INSERT INTO public.shipping_providers (name, provider_type, fee, sort_order) VALUES
  ('Magyar Posta', 'HOME', 1490, 1),
  ('Foxpost', 'HOME', 1290, 2),
  ('DPD', 'HOME', 1390, 3),
  ('GLS', 'HOME', 1290, 4),
  ('Foxpost Automata', 'BOX', 990, 5),
  ('Posta Automata', 'BOX', 890, 6);