
-- Fix the infinite recursion in RLS policies by creating a security definer function
-- This will prevent the circular reference that's causing the auth hang

-- First, create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = user_id AND role = 'admin' AND status = 'active'
  );
$$;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admin users can access their own data" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can access all admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all admin records" ON public.admin_users;

-- Create simpler, non-recursive policies for admin_users table
CREATE POLICY "Admin users can view their own record"
ON public.admin_users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Super admins can manage admin users"
ON public.admin_users FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Ensure the admin user exists in companies table with correct role
INSERT INTO public.companies (id, name, email, role, status)
SELECT 
  au.id,
  'Admin User',
  'naveedahmedm@hotmail.com',
  'admin',
  'active'
FROM auth.users au
WHERE au.email = 'naveedahmedm@hotmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = now();
