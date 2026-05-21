-- Smart Waste Management System — initial schema, RLS, triggers, realtime, storage
-- Run in Supabase SQL Editor or via `supabase db push`

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'driver', 'citizen');

CREATE TYPE public.bin_status AS ENUM ('empty', 'filling', 'full', 'collected');

CREATE TYPE public.bin_type AS ENUM ('general', 'organic', 'recyclable');

CREATE TYPE public.route_status AS ENUM ('pending', 'active', 'completed');

CREATE TYPE public.complaint_type AS ENUM ('overflow', 'illegal_dumping', 'dead_animal', 'other');

CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved');

CREATE TYPE public.bag_type AS ENUM ('recyclable', 'organic');

CREATE TYPE public.facility_waste_type AS ENUM ('general', 'organic', 'recyclable');

CREATE TYPE public.batch_status AS ENUM ('decomposing', 'ready', 'utilized');

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'citizen',
  phone text,
  eco_points integer NOT NULL DEFAULT 0,
  locality text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  label text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  locality text,
  fill_level integer NOT NULL DEFAULT 0 CHECK (
    fill_level >= 0
    AND fill_level <= 100
  ),
  status public.bin_status NOT NULL DEFAULT 'empty',
  bin_type public.bin_type NOT NULL DEFAULT 'general',
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bins_locality ON public.bins (locality);

CREATE INDEX idx_bins_status ON public.bins (status);

CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  name text NOT NULL,
  assigned_driver_id uuid REFERENCES public.users (id),
  vehicle_number text,
  status public.route_status NOT NULL DEFAULT 'pending',
  bin_ids uuid[] NOT NULL DEFAULT '{}',
  shift_date date NOT NULL,
  created_by uuid REFERENCES public.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_routes_driver ON public.routes (assigned_driver_id);

CREATE INDEX idx_routes_shift ON public.routes (shift_date);

CREATE INDEX idx_routes_status ON public.routes (status);

CREATE TABLE public.pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  route_id uuid NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  bin_id uuid NOT NULL REFERENCES public.bins (id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  picked_up_at timestamptz NOT NULL DEFAULT now(),
  driver_latitude double precision,
  driver_longitude double precision,
  notes text
);

CREATE INDEX idx_pickups_route ON public.pickups (route_id);

CREATE INDEX idx_pickups_bin ON public.pickups (bin_id);

CREATE INDEX idx_pickups_driver ON public.pickups (driver_id);

CREATE TABLE public.facility_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  route_id uuid NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  facility_name text NOT NULL,
  waste_type public.facility_waste_type NOT NULL,
  weight_kg real NOT NULL CHECK (weight_kg >= 0),
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  latitude double precision,
  longitude double precision,
  notes text
);

CREATE INDEX idx_facility_checkins_route ON public.facility_checkins (route_id);

CREATE INDEX idx_facility_checkins_driver ON public.facility_checkins (driver_id);

CREATE TABLE public.decomposition_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  facility_checkin_id uuid NOT NULL REFERENCES public.facility_checkins (id) ON DELETE CASCADE,
  batch_label text NOT NULL,
  deposited_at timestamptz NOT NULL DEFAULT now(),
  estimated_ready_at timestamptz NOT NULL,
  status public.batch_status NOT NULL DEFAULT 'decomposing',
  notified boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_decomposition_status ON public.decomposition_batches (status);

CREATE INDEX idx_decomposition_ready ON public.decomposition_batches (estimated_ready_at);

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  reported_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  complaint_type public.complaint_type NOT NULL,
  description text,
  latitude double precision,
  longitude double precision,
  photo_url text,
  status public.complaint_status NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_status ON public.complaints (status);

CREATE INDEX idx_complaints_reported_by ON public.complaints (reported_by);

CREATE TABLE public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  citizen_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  code_string text NOT NULL UNIQUE,
  bag_type public.bag_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  scanned_at timestamptz,
  scanned_by_driver_id uuid REFERENCES public.users (id),
  eco_points_awarded integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_qr_citizen ON public.qr_codes (citizen_id);

CREATE TABLE public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  driver_id uuid NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes (id) ON DELETE SET NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_locations_route ON public.driver_locations (route_id);

CREATE TABLE public.bin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  bin_id uuid NOT NULL REFERENCES public.bins (id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_bin_alerts_bin ON public.bin_alerts (bin_id);

CREATE INDEX idx_bin_alerts_ack ON public.bin_alerts (acknowledged);

CREATE TABLE public.anomaly_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  driver_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes (id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'warning',
  reason text NOT NULL,
  details jsonb,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomaly_driver ON public.anomaly_alerts (driver_id);

CREATE INDEX idx_anomaly_ack ON public.anomaly_alerts (acknowledged);

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin (uid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET
  search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT
      1
    FROM
      public.users
    WHERE
      id = uid
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_driver (uid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET
  search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT
      1
    FROM
      public.users
    WHERE
      id = uid
      AND role = 'driver'
  );
$$;

-- New auth user → profile row (default citizen; promote via admin)
CREATE OR REPLACE FUNCTION public.handle_new_user () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role, phone, locality, eco_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'citizen',
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    NULL,
    0
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user ();

-- Bin fill ≥80% → bin_alerts (crossing threshold upward)
CREATE OR REPLACE FUNCTION public.trg_bin_fill_alert () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $$
BEGIN
  IF NEW.fill_level >= 80 THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.bin_alerts (bin_id)
        VALUES (NEW.id);
    ELSIF TG_OP = 'UPDATE'
    AND (
      OLD.fill_level IS NULL
      OR OLD.fill_level < 80
    )
    AND NEW.fill_level >= 80 THEN
    INSERT INTO public.bin_alerts (bin_id)
      VALUES (NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bins_fill_level_alert
AFTER INSERT
OR
UPDATE OF fill_level ON public.bins FOR EACH ROW
EXECUTE FUNCTION public.trg_bin_fill_alert ();

-- Organic facility check-in → decomposition batch (90 days)
CREATE OR REPLACE FUNCTION public.trg_facility_organic_batch () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public AS $$
DECLARE
  lbl text;
BEGIN
  IF NEW.waste_type = 'organic' THEN
    lbl := 'Batch ' || to_char(NEW.checked_in_at, 'YYYY-MM-DD') || ' — ' || left(NEW.id::text, 8);

    INSERT INTO public.decomposition_batches (
      facility_checkin_id,
      batch_label,
      deposited_at,
      estimated_ready_at,
      status
    )
    VALUES (
      NEW.id,
      lbl,
      NEW.checked_in_at,
      NEW.checked_in_at + interval '90 days',
      'decomposing'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER facility_checkin_organic_batch
AFTER INSERT ON public.facility_checkins FOR EACH ROW
EXECUTE FUNCTION public.trg_facility_organic_batch ();

-- Keep bins.last_updated in sync
CREATE OR REPLACE FUNCTION public.trg_bins_touch_updated () RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_updated := now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER bins_touch_last_updated
BEFORE
UPDATE ON public.bins FOR EACH ROW
EXECUTE FUNCTION public.trg_bins_touch_updated ();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.facility_checkins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.decomposition_batches ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bin_alerts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own_or_admin" ON public.users FOR
SELECT
  TO authenticated USING (
    id = (SELECT auth.uid ())
    OR public.is_admin ((SELECT auth.uid ()))
  );

CREATE POLICY "users_select_drivers_read_citizens" ON public.users FOR
SELECT
  TO authenticated USING (
    public.is_driver ((SELECT auth.uid ()))
    AND role = 'citizen'
  );

CREATE POLICY "users_update_own_non_admin_fields" ON public.users
FOR UPDATE
  TO authenticated USING (id = (SELECT auth.uid ()))
WITH
  CHECK (
    id = (SELECT auth.uid ())
    AND role = (
      SELECT
        u.role
      FROM
        public.users u
      WHERE
        u.id = (SELECT auth.uid ())
    )
  );

CREATE POLICY "users_admin_update_all" ON public.users
FOR UPDATE
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())))
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "users_admin_insert" ON public.users FOR INSERT TO authenticated
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

-- bins: all authenticated read; admin write
CREATE POLICY "bins_select_authenticated" ON public.bins FOR
SELECT
  TO authenticated USING (true);

CREATE POLICY "bins_admin_insert" ON public.bins FOR INSERT TO authenticated
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "bins_admin_update" ON public.bins
FOR UPDATE
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())))
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "bins_admin_delete" ON public.bins FOR DELETE TO authenticated USING (public.is_admin ((SELECT auth.uid ())));

-- routes
CREATE POLICY "routes_admin_all" ON public.routes FOR ALL TO authenticated USING (
  public.is_admin ((SELECT auth.uid ()))
)
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "routes_driver_select_assigned" ON public.routes FOR
SELECT
  TO authenticated USING (
    assigned_driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
  );

CREATE POLICY "routes_citizen_select_locality" ON public.routes FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.users u
      WHERE
        u.id = (SELECT auth.uid ())
        AND u.role = 'citizen'
    )
    AND status IN ('pending', 'active')
    AND (
      EXISTS (
        SELECT
          1
        FROM
          public.bins b
        WHERE
          b.id = ANY (bin_ids)
          AND (
            b.locality IS NOT DISTINCT FROM (
              SELECT
                ul.locality
              FROM
                public.users ul
              WHERE
                ul.id = (SELECT auth.uid ())
            )
          )
      )
      OR (
        SELECT
          uz.locality
        FROM
          public.users uz
        WHERE
          uz.id = (SELECT auth.uid ())
      ) IS NULL
    )
  );

-- pickups
CREATE POLICY "pickups_admin_select" ON public.pickups FOR
SELECT
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "pickups_driver_select_own" ON public.pickups FOR
SELECT
  TO authenticated USING (driver_id = (SELECT auth.uid ()));

CREATE POLICY "pickups_driver_insert_own_route" ON public.pickups FOR INSERT TO authenticated
WITH
  CHECK (
    driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
    AND EXISTS (
      SELECT
        1
      FROM
        public.routes r
      WHERE
        r.id = route_id
        AND r.assigned_driver_id = (SELECT auth.uid ())
    )
  );

-- facility_checkins
CREATE POLICY "facility_admin_select_update" ON public.facility_checkins FOR
SELECT
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "facility_admin_update" ON public.facility_checkins
FOR UPDATE
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())))
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "facility_driver_select_own" ON public.facility_checkins FOR
SELECT
  TO authenticated USING (driver_id = (SELECT auth.uid ()));

CREATE POLICY "facility_driver_insert_own" ON public.facility_checkins FOR INSERT TO authenticated
WITH
  CHECK (
    driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
  );

-- decomposition_batches
CREATE POLICY "decomposition_admin_manage" ON public.decomposition_batches FOR ALL TO authenticated USING (
  public.is_admin ((SELECT auth.uid ()))
)
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "decomposition_driver_select_via_checkin" ON public.decomposition_batches FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.facility_checkins fc
      WHERE
        fc.id = facility_checkin_id
        AND fc.driver_id = (SELECT auth.uid ())
    )
  );

-- complaints (admin manage + citizens insert/read own)
CREATE POLICY "complaints_select_own_or_admin" ON public.complaints FOR
SELECT
  TO authenticated USING (
    reported_by = (SELECT auth.uid ())
    OR public.is_admin ((SELECT auth.uid ()))
  );

CREATE POLICY "complaints_insert_own" ON public.complaints FOR INSERT TO authenticated
WITH
  CHECK (reported_by = (SELECT auth.uid ()));

CREATE POLICY "complaints_admin_update" ON public.complaints
FOR UPDATE
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())))
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "complaints_admin_delete" ON public.complaints FOR DELETE TO authenticated USING (public.is_admin ((SELECT auth.uid ())));

-- qr_codes
CREATE POLICY "qr_admin_select" ON public.qr_codes FOR
SELECT
  TO authenticated USING (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "qr_driver_select" ON public.qr_codes FOR
SELECT
  TO authenticated USING (public.is_driver ((SELECT auth.uid ())));

CREATE POLICY "qr_citizen_own" ON public.qr_codes FOR
SELECT
  TO authenticated USING (citizen_id = (SELECT auth.uid ()));

CREATE POLICY "qr_citizen_insert" ON public.qr_codes FOR INSERT TO authenticated
WITH
  CHECK (citizen_id = (SELECT auth.uid ()));

CREATE POLICY "qr_citizen_update_own" ON public.qr_codes
FOR UPDATE
  TO authenticated USING (citizen_id = (SELECT auth.uid ()))
WITH
  CHECK (citizen_id = (SELECT auth.uid ()));

CREATE POLICY "qr_driver_update_scan" ON public.qr_codes
FOR UPDATE
  TO authenticated USING (public.is_driver ((SELECT auth.uid ())))
WITH
  CHECK (public.is_driver ((SELECT auth.uid ())));

-- driver_locations
CREATE POLICY "driver_loc_select_all_auth" ON public.driver_locations FOR
SELECT
  TO authenticated USING (true);

CREATE POLICY "driver_loc_upsert_own" ON public.driver_locations FOR INSERT TO authenticated
WITH
  CHECK (
    driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
  );

CREATE POLICY "driver_loc_update_own" ON public.driver_locations
FOR UPDATE
  TO authenticated USING (
    driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
  )
WITH
  CHECK (
    driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
  );

-- bin_alerts
CREATE POLICY "bin_alerts_admin" ON public.bin_alerts FOR ALL TO authenticated USING (
  public.is_admin ((SELECT auth.uid ()))
)
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

-- anomaly_alerts
CREATE POLICY "anomaly_admin" ON public.anomaly_alerts FOR ALL TO authenticated USING (
  public.is_admin ((SELECT auth.uid ()))
)
WITH
  CHECK (public.is_admin ((SELECT auth.uid ())));

CREATE POLICY "anomaly_driver_own_read" ON public.anomaly_alerts FOR
SELECT
  TO authenticated USING (
    driver_id = (SELECT auth.uid ())
    AND public.is_driver ((SELECT auth.uid ()))
  );

-- -----------------------------------------------------------------------------
-- REALTIME
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.bins;

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;

ALTER PUBLICATION supabase_realtime ADD TABLE public.routes;

-- -----------------------------------------------------------------------------
-- STORAGE BUCKETS
-- -----------------------------------------------------------------------------
INSERT INTO
  storage.buckets (id, name, public)
VALUES
  ('complaint-photos', 'complaint-photos', true),
  ('report-exports', 'report-exports', false)
ON CONFLICT (id) DO NOTHING;

-- complaint-photos: authenticated users upload to folder = their uid; public read
CREATE POLICY "complaint_photos_public_read" ON storage.objects FOR
SELECT
  TO public USING (bucket_id = 'complaint-photos');

CREATE POLICY "complaint_photos_authenticated_upload" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'complaint-photos'
    AND (storage.foldername (name)) [1] = (SELECT auth.uid ())::text
  );

CREATE POLICY "complaint_photos_owner_update" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'complaint-photos'
    AND owner = (SELECT auth.uid ())
  )
WITH
  CHECK (
    bucket_id = 'complaint-photos'
    AND owner = (SELECT auth.uid ())
  );

-- report-exports: service role only in app; optional admin via service—no anon policies
CREATE POLICY "report_exports_service" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'report-exports')
WITH
  CHECK (bucket_id = 'report-exports');

-- Allow authenticated admin to read own exports if uploaded with service (skip) — service_role bypasses RLS in Supabase client
