-- Fix the remaining function
CREATE OR REPLACE FUNCTION public.make_user_super_admin(user_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- If user exists, make them super admin
  IF user_id IS NOT NULL THEN
    -- Create or update admin user
    INSERT INTO admin_users (id, email, is_super_admin, status)
    VALUES (user_id, user_email, true, 'active')
    ON CONFLICT (id) DO UPDATE
    SET is_super_admin = true, 
        status = 'active',
        updated_at = now();
    
    -- Ensure company profile exists
    INSERT INTO companies (id, name, email, is_vendor, status)
    VALUES (user_id, 'System Admin', user_email, false, 'active')
    ON CONFLICT (id) DO UPDATE
    SET name = 'System Admin',
        status = 'active',
        updated_at = now();
    
    RETURN 'Successfully made user super admin';
  ELSE
    RETURN 'User not found. Please sign up first.';
  END IF;
END;
$function$;