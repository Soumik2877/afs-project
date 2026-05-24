-- Citizen on-demand pickup: pin location → truck detours → confirm → resume route

CREATE TYPE public.citizen_pickup_status AS ENUM (
  'pending',
  'en_route',
  'arrived',
  'completed',
  'cancelled'
);

CREATE TABLE public.citizen_pickup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  citizen_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  status public.citizen_pickup_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  arrived_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX idx_citizen_pickup_citizen ON public.citizen_pickup_requests (citizen_id);

CREATE INDEX idx_citizen_pickup_route ON public.citizen_pickup_requests (route_id);

CREATE INDEX idx_citizen_pickup_status ON public.citizen_pickup_requests (status);

CREATE UNIQUE INDEX idx_citizen_pickup_one_active_per_route ON public.citizen_pickup_requests (route_id)
WHERE
  status IN ('pending', 'en_route', 'arrived');

ALTER TABLE public.citizen_pickup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "citizen_pickup_select_own_or_admin" ON public.citizen_pickup_requests FOR
SELECT
  TO authenticated USING (
    citizen_id = (SELECT auth.uid ())
    OR public.is_admin ((SELECT auth.uid ()))
  );

CREATE POLICY "citizen_pickup_insert_own" ON public.citizen_pickup_requests FOR INSERT TO authenticated
WITH
  CHECK (
    citizen_id = (SELECT auth.uid ())
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid ()) AND u.role = 'citizen'
    )
  );

CREATE POLICY "citizen_pickup_update_own_arrived" ON public.citizen_pickup_requests
FOR UPDATE
  TO authenticated USING (citizen_id = (SELECT auth.uid ()))
WITH
  CHECK (citizen_id = (SELECT auth.uid ()));

CREATE POLICY "citizen_pickup_admin_all" ON public.citizen_pickup_requests FOR ALL TO authenticated USING (
  public.is_admin ((SELECT auth.uid ()))
)
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

ALTER PUBLICATION supabase_realtime ADD TABLE public.citizen_pickup_requests;
