-- Migration: Create get_table_schema function for Supabase RPC
-- Date: 2025-07-02

CREATE OR REPLACE FUNCTION public.get_table_schema()
RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text, column_default text)
LANGUAGE sql
AS $$
  SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
$$; 
