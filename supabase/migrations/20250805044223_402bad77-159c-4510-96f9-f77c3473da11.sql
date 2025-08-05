-- Fix infinite recursion in admin_users RLS policies
-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.companies WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_super_admin, false) 
  FROM public.admin_users 
  WHERE id = auth.uid() AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies to prevent recursion
DROP POLICY IF EXISTS "Admin users can access their own data" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view their own record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can access all admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert new admins" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all admin records" ON public.admin_users;

-- Create new non-recursive policies
CREATE POLICY "Admin users can view own record" ON public.admin_users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Super admins full access" ON public.admin_users
FOR ALL USING (public.is_super_admin());

-- Update products policies to use the new function
DROP POLICY IF EXISTS "Admin users can manage products" ON public.products;
CREATE POLICY "Admin users can manage products" ON public.products
FOR ALL USING (public.get_current_user_role() = 'admin' OR public.is_super_admin());