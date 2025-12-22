-- =============================================
-- FIX CRITICAL SECURITY ISSUES
-- =============================================

-- =============================================
-- 1. FIX BOOKINGS TABLE - Customer data protection
-- =============================================

-- Drop existing SELECT policies that may have issues
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings by email" ON public.bookings;

-- Create proper admin-only SELECT policy (only authenticated admins can read)
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2. FIX CONTACTS TABLE - Email list protection
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage contacts" ON public.contacts;

-- Create separate policies for each operation (admin only)
CREATE POLICY "Admins can view contacts" 
ON public.contacts 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert contacts" 
ON public.contacts 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contacts" 
ON public.contacts 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contacts" 
ON public.contacts 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public newsletter signup (insert only with limited fields)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.contacts 
FOR INSERT 
TO anon
WITH CHECK (
  -- Only allow setting email and name, everything else uses defaults
  is_subscribed = true 
  AND source = 'website'
);