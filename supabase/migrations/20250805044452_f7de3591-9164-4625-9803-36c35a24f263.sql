-- Fix function security warnings by setting search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.companies WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_super_admin, false) 
  FROM public.admin_users 
  WHERE id = auth.uid() AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

-- Also fix existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO companies (id, name, email, is_vendor, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'is_vendor')::boolean, false),
    'active'
  );
  RETURN NEW;
END;
$function$;