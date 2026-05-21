-- Quick auth / profile diagnostic (safe to run anytime)

SELECT 'auth.users count' AS check_name, count(*)::text AS result FROM auth.users
UNION ALL
SELECT 'public.users count', count(*)::text FROM public.users
UNION ALL
SELECT 'admins', count(*)::text FROM public.users WHERE role = 'admin'
UNION ALL
SELECT 'drivers', count(*)::text FROM public.users WHERE role = 'driver'
UNION ALL
SELECT 'citizens', count(*)::text FROM public.users WHERE role = 'citizen';

SELECT
  a.email,
  p.role,
  p.id IS NOT NULL AS has_profile
FROM auth.users a
LEFT JOIN public.users p ON p.id = a.id
ORDER BY a.created_at DESC;
