-- Create demo citizen + driver accounts (run in Supabase SQL Editor).
-- Login via /auth/login with the emails and passwords below.
--
-- Citizen: demo_user2@gmail.com / user@12345
-- Driver:  demo_driver1@gmail.com / driver@12345

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1) Citizen — demo_user2@gmail.com
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  new_id uuid := gen_random_uuid();
  target_email text := 'demo_user2@gmail.com';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(target_email)) THEN
    RAISE NOTICE 'Citizen already exists: %', target_email;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      target_email,
      crypt('user@12345', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'demo_user2', 'phone', '1234567890'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    RAISE NOTICE 'Created citizen auth user: % (id: %)', target_email, new_id;
  END IF;

  UPDATE public.users
  SET
    full_name = 'demo_user2',
    phone = '1234567890',
    role = 'citizen'::public.user_role
  WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower(target_email));
END $$;

-- -----------------------------------------------------------------------------
-- 2) Driver — demo_driver1@gmail.com
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  new_id uuid := gen_random_uuid();
  target_email text := 'demo_driver1@gmail.com';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(target_email)) THEN
    RAISE NOTICE 'Driver auth user already exists: %', target_email;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      target_email,
      crypt('driver@12345', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'demo_driver1', 'phone', ''),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    RAISE NOTICE 'Created driver auth user: % (id: %)', target_email, new_id;
  END IF;

  INSERT INTO public.users (id, full_name, role, phone, eco_points)
  SELECT
    a.id,
    'demo_driver1',
    'driver'::public.user_role,
    '',
    0
  FROM auth.users a
  WHERE lower(a.email) = lower(target_email)
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = 'driver'::public.user_role;
END $$;

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------
SELECT a.email, u.full_name, u.role, u.phone
FROM auth.users a
JOIN public.users u ON u.id = a.id
WHERE a.email IN ('demo_user2@gmail.com', 'demo_driver1@gmail.com')
ORDER BY a.email;
