-- Add billing address columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS billing_name text,
  ADD COLUMN IF NOT EXISTS billing_postal_code text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_country text DEFAULT 'Magyarország',
  ADD COLUMN IF NOT EXISTS billing_same_as_shipping boolean DEFAULT true;