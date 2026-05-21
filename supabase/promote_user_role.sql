-- =============================================================================
-- STEP 1 — Run this first (no edits needed). See who exists in Auth vs public.users
-- =============================================================================
SELECT
  a.id AS auth_id,
  a.email,
  a.email_confirmed_at IS NOT NULL AS email_confirmed,
  a.created_at AS signed_up_at,
  p.role AS profile_role,
  CASE
    WHEN p.id IS NULL THEN 'MISSING — need Step 2'
    WHEN p.role = 'admin' THEN 'OK — already admin'
    ELSE 'EXISTS — run Step 2 to promote'
  END AS status
FROM auth.users a
LEFT JOIN public.users p ON p.id = a.id
ORDER BY a.created_at DESC;

-- =============================================================================
-- STEP 2 — Change ONLY the email on the next line, then run this block alone
-- =============================================================================
DO $$
DECLARE
  target_email text := 'PUT-YOUR-LOGIN-EMAIL-HERE@example.com';
  uid uuid;
BEGIN
  SELECT id INTO uid
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(target_email));

  IF uid IS NULL THEN
    RAISE EXCEPTION
      'No user in auth.users with email "%". Create the account first: open /auth/signup or Supabase → Authentication → Users → Add user.',
      target_email;
  END IF;

  INSERT INTO public.users (id, full_name, role, phone, eco_points)
  SELECT
    a.id,
    COALESCE(NULLIF(trim(a.raw_user_meta_data ->> 'full_name'), ''), 'Admin User'),
    'admin'::public.user_role,
    COALESCE(a.raw_user_meta_data ->> 'phone', ''),
    0
  FROM auth.users a
  WHERE a.id = uid
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin'::public.user_role;

  RAISE NOTICE 'Success: % is now admin (id: %)', target_email, uid;
END $$;

-- =============================================================================
-- STEP 3 — Verify (replace email to match Step 2)
-- =============================================================================
SELECT a.email, u.role, u.full_name, u.id
FROM auth.users a
JOIN public.users u ON u.id = a.id
WHERE lower(a.email) = lower('PUT-YOUR-LOGIN-EMAIL-HERE@example.com');
