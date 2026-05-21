-- Demo data for Smart Waste Management (run once in Supabase SQL Editor).
-- Prerequisite: at least one user with role = 'driver' (sign up via /auth/signup).

-- -----------------------------------------------------------------------------
-- Bins (idempotent by label)
-- -----------------------------------------------------------------------------
INSERT INTO public.bins (label, latitude, longitude, locality, fill_level, status, bin_type)
SELECT v.label, v.latitude, v.longitude, v.locality, v.fill_level, v.status::public.bin_status, v.bin_type::public.bin_type
FROM (
  VALUES
    ('BIN-KR-01', 12.9716, 77.5946, 'Koramangala', 22, 'empty', 'general'),
    ('BIN-KR-02', 12.9738, 77.5968, 'Koramangala', 38, 'filling', 'organic'),
    ('BIN-KR-03', 12.9694, 77.5922, 'Koramangala', 54, 'filling', 'recyclable'),
    ('BIN-KR-04', 12.9751, 77.5981, 'Koramangala', 71, 'filling', 'general'),
    ('BIN-KR-05', 12.9682, 77.5908, 'Koramangala', 83, 'full', 'organic'),
    ('BIN-IN-01', 12.9784, 77.6012, 'Indiranagar', 18, 'empty', 'recyclable'),
    ('BIN-IN-02', 12.9806, 77.6035, 'Indiranagar', 45, 'filling', 'general'),
    ('BIN-IN-03', 12.9769, 77.5994, 'Indiranagar', 62, 'filling', 'organic'),
    ('BIN-IN-04', 12.9818, 77.6051, 'Indiranagar', 88, 'full', 'recyclable'),
    ('BIN-HS-01', 12.9658, 77.5876, 'HSR Layout', 31, 'filling', 'general'),
    ('BIN-HS-02', 12.9636, 77.5854, 'HSR Layout', 57, 'filling', 'recyclable'),
    ('BIN-HS-03', 12.9671, 77.5899, 'HSR Layout', 76, 'filling', 'organic')
) AS v (label, latitude, longitude, locality, fill_level, status, bin_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bins b WHERE b.label = v.label
);

-- -----------------------------------------------------------------------------
-- Active demo route (requires a driver user)
-- -----------------------------------------------------------------------------
INSERT INTO public.routes (name, assigned_driver_id, vehicle_number, status, bin_ids, shift_date)
SELECT
  'Demo Koramangala Loop',
  d.id,
  'KA-01-DEMO',
  'active'::public.route_status,
  COALESCE(
    (
      SELECT array_agg(b.id ORDER BY b.label)
      FROM public.bins b
      WHERE b.locality = 'Koramangala'
      LIMIT 5
    ),
    '{}'::uuid[]
  ),
  CURRENT_DATE
FROM public.users d
WHERE d.role = 'driver'
  AND NOT EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.name = 'Demo Koramangala Loop'
      AND r.shift_date = CURRENT_DATE
  )
ORDER BY d.created_at
LIMIT 1;

-- Seed initial driver position on the demo route
INSERT INTO public.driver_locations (driver_id, route_id, latitude, longitude, updated_at)
SELECT
  r.assigned_driver_id,
  r.id,
  b.latitude,
  b.longitude,
  now()
FROM public.routes r
JOIN LATERAL (
  SELECT latitude, longitude
  FROM public.bins
  WHERE id = ANY (r.bin_ids)
  ORDER BY label
  LIMIT 1
) b ON true
WHERE r.name = 'Demo Koramangala Loop'
  AND r.shift_date = CURRENT_DATE
  AND r.assigned_driver_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.driver_locations dl
    WHERE dl.driver_id = r.assigned_driver_id
  );
