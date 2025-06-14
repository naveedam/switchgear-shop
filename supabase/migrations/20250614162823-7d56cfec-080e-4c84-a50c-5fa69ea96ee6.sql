
-- This migration ensures the primary admin user has the correct role.
-- It's safe to run multiple times.
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID from auth.users based on the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'naveedahmedm@hotmail.com';

  -- If the user exists, update their role in the 'companies' table to 'admin'
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.companies
    SET role = 'admin'
    WHERE id = admin_user_id AND role IS DISTINCT FROM 'admin';

    IF FOUND THEN
      RAISE NOTICE 'Admin role set for user naveedahmedm@hotmail.com.';
    ELSE
      RAISE NOTICE 'Admin role was already correctly set for user naveedahmedm@hotmail.com.';
    END IF;
  ELSE
    -- If the user does not exist, a notice will be raised.
    -- The user will need to be created via the application's sign-up process.
    RAISE NOTICE 'Admin user naveedahmedm@hotmail.com not found. Please sign up using the application.';
  END IF;
END $$;
