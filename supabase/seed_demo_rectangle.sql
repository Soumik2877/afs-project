-- Kalaikunda demo: 5 bins + active looping route (see lib/demo/demo-bin-placements.json)

INSERT INTO public.bins (label, latitude, longitude, locality, fill_level, status, bin_type)
SELECT v.label, v.latitude, v.longitude, v.locality, v.fill_level, v.status::public.bin_status, v.bin_type::public.bin_type
FROM (
  VALUES
    ('BIN-DEMO-01', 22.335974, 87.220821, 'Kalaikunda', 35, 'filling', 'general'),
    ('BIN-DEMO-02', 22.334092, 87.225045, 'Kalaikunda', 52, 'filling', 'organic'),
    ('BIN-DEMO-03', 22.334016, 87.222901, 'Kalaikunda', 68, 'filling', 'recyclable'),
    ('BIN-DEMO-04', 22.331409, 87.224041, 'Kalaikunda', 81, 'full',    'general'),
    ('BIN-DEMO-05', 22.331001, 87.221671, 'Kalaikunda', 44, 'filling', 'organic')
) AS v (label, latitude, longitude, locality, fill_level, status, bin_type)
WHERE NOT EXISTS (SELECT 1 FROM public.bins b WHERE b.label = v.label);

UPDATE public.bins b
SET
  latitude = v.latitude,
  longitude = v.longitude,
  locality = v.locality,
  fill_level = v.fill_level,
  status = v.status::public.bin_status,
  bin_type = v.bin_type::public.bin_type
FROM (
  VALUES
    ('BIN-DEMO-01', 22.335974, 87.220821, 'Kalaikunda', 35, 'filling', 'general'),
    ('BIN-DEMO-02', 22.334092, 87.225045, 'Kalaikunda', 52, 'filling', 'organic'),
    ('BIN-DEMO-03', 22.334016, 87.222901, 'Kalaikunda', 68, 'filling', 'recyclable'),
    ('BIN-DEMO-04', 22.331409, 87.224041, 'Kalaikunda', 81, 'full',    'general'),
    ('BIN-DEMO-05', 22.331001, 87.221671, 'Kalaikunda', 44, 'filling', 'organic')
) AS v (label, latitude, longitude, locality, fill_level, status, bin_type)
WHERE b.label = v.label;

-- Remove legacy Koramangala / old demo routes and bins
DELETE FROM public.pickups
WHERE route_id IN (
  SELECT id FROM public.routes
  WHERE name IN ('Demo Koramangala Loop', 'Demo Rectangle Loop', 'Koramangala Loop')
);

DELETE FROM public.routes
WHERE name IN ('Demo Koramangala Loop', 'Demo Rectangle Loop', 'Koramangala Loop');

DELETE FROM public.pickups
WHERE bin_id IN (SELECT id FROM public.bins WHERE label LIKE 'BIN-KR-%' OR label LIKE 'BIN-IN-%' OR label LIKE 'BIN-HS-%');

DELETE FROM public.bin_alerts
WHERE bin_id IN (SELECT id FROM public.bins WHERE label LIKE 'BIN-KR-%' OR label LIKE 'BIN-IN-%' OR label LIKE 'BIN-HS-%');

DELETE FROM public.bins
WHERE label LIKE 'BIN-KR-%' OR label LIKE 'BIN-IN-%' OR label LIKE 'BIN-HS-%';

UPDATE public.routes SET status = 'completed' WHERE name IS DISTINCT FROM 'Kalaikunda';

DELETE FROM public.pickups
WHERE route_id IN (SELECT id FROM public.routes WHERE name = 'Kalaikunda');

INSERT INTO public.routes (name, assigned_driver_id, vehicle_number, status, bin_ids, shift_date)
SELECT
  'Kalaikunda',
  d.id,
  'KA-DEMO-01',
  'active'::public.route_status,
  (SELECT COALESCE(array_agg(b.id ORDER BY b.label), '{}'::uuid[]) FROM public.bins b WHERE b.label LIKE 'BIN-DEMO-%'),
  CURRENT_DATE
FROM (SELECT id FROM public.users WHERE role = 'driver' ORDER BY created_at LIMIT 1) d
WHERE d.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.routes r WHERE r.name = 'Kalaikunda' AND r.shift_date = CURRENT_DATE);

UPDATE public.routes r
SET status = 'active', shift_date = CURRENT_DATE, bin_ids = (
  SELECT COALESCE(array_agg(b.id ORDER BY b.label), '{}'::uuid[])
  FROM public.bins b WHERE b.label LIKE 'BIN-DEMO-%'
)
WHERE r.name = 'Kalaikunda';

INSERT INTO public.driver_locations (driver_id, route_id, latitude, longitude, updated_at)
SELECT r.assigned_driver_id, r.id, 22.335974, 87.220821, now()
FROM public.routes r
WHERE r.name = 'Kalaikunda' AND r.status = 'active' AND r.assigned_driver_id IS NOT NULL
ON CONFLICT (driver_id) DO UPDATE SET
  route_id = EXCLUDED.route_id,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = EXCLUDED.updated_at;
