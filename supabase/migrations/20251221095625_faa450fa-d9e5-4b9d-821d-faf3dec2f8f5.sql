-- Add sale_price and is_on_sale columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS sale_price numeric,
ADD COLUMN IF NOT EXISTS is_on_sale boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;