-- Function to get all table column info
CREATE OR REPLACE FUNCTION public.get_all_table_info()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  udt_name text,
  is_nullable text,
  column_default text,
  ordinal_position integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.udt_name::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position::integer
  FROM information_schema.columns c
  JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
  WHERE c.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Function to get all enum types
CREATE OR REPLACE FUNCTION public.get_all_enum_types()
RETURNS TABLE (
  enum_name text,
  enum_values text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.typname::text as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder)::text[] as enum_values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  GROUP BY t.typname;
$$;

-- Function to get RLS policies
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE (
  table_name text,
  policy_name text,
  policy_command text,
  policy_qual text,
  policy_with_check text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd::text as policy_command,
    qual::text as policy_qual,
    with_check::text as policy_with_check
  FROM pg_policies
  WHERE schemaname = 'public';
$$;

-- Function to get foreign keys
CREATE OR REPLACE FUNCTION public.get_foreign_keys()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table text,
  foreign_column text,
  constraint_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table,
    ccu.column_name::text as foreign_column,
    tc.constraint_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';
$$;

-- Function to get primary keys
CREATE OR REPLACE FUNCTION public.get_primary_keys()
RETURNS TABLE (
  table_name text,
  column_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.ordinal_position;
$$;

-- Function to get unique constraints
CREATE OR REPLACE FUNCTION public.get_unique_constraints()
RETURNS TABLE (
  table_name text,
  constraint_name text,
  column_names text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.table_name::text,
    tc.constraint_name::text,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position)::text[] as column_names
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_schema = 'public'
  GROUP BY tc.table_name, tc.constraint_name;
$$;