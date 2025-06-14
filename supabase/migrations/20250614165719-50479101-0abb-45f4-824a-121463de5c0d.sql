
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID from auth.users based on the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'naveedahmedm@hotmail.com';

  -- If the user exists, ensure their profile exists in 'companies' and has the 'admin' role.
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.companies (id, name, email, role, status)
    VALUES (admin_user_id, 'Admin User', 'naveedahmedm@hotmail.com', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE 
    SET 
      role = 'admin',
      name = COALESCE(public.companies.name, 'Admin User'), -- Don't overwrite existing name
      status = 'active';

    RAISE NOTICE 'Admin user profile and role ensured for naveedahmedm@hotmail.com.';
  ELSE
    -- If the user does not exist, a notice will be raised.
    -- The user will need to be created via the application's sign-up process.
    RAISE NOTICE 'Admin user naveedahmedm@hotmail.com not found. Please sign up using the application. You can use the password "admin123".';
  END IF;
END $$;
