-- Services vertical: skilled trades (welders, turners, fitters, draftsmen, electricians...)
-- offered to businesses on demand. Starts in Peenya, Bangalore.
-- Public users never touch these tables directly: they call the SECURITY DEFINER RPCs below.
-- Admins (public.is_super_admin()) manage everything.

-- 1. Trades lookup (add new trades as data, not migrations)
CREATE TABLE IF NOT EXISTS public.service_trades (
  slug        text PRIMARY KEY,
  label       text NOT NULL,
  description text,
  sort_order  int  NOT NULL DEFAULT 100,
  is_active   boolean NOT NULL DEFAULT true
);

INSERT INTO public.service_trades (slug, label, description, sort_order) VALUES
  ('welder',               'Welder',                'MIG / TIG / arc welding, structural and sheet metal',        10),
  ('turner',               'Turner (Lathe)',        'Conventional lathe turning, threading, job work',            20),
  ('fitter',               'Fitter',                'Mechanical fitting, assembly, alignment, maintenance',       30),
  ('machinist',            'CNC / VMC Operator',    'CNC and VMC setting and operation, milling, grinding',       40),
  ('sheet_metal',          'Sheet Metal Fabricator','Cutting, bending, punching, enclosure and panel fabrication',50),
  ('electrician',          'Electrician',           'Industrial wiring, installation, testing, troubleshooting',  60),
  ('panel_wireman',        'Panel Wireman',         'Control and power panel wiring, ferruling, dressing',        70),
  ('maintenance_tech',     'Maintenance Technician','Breakdown and preventive maintenance of plant equipment',    80),
  ('draftsman',            'Draftsman',             'AutoCAD / SolidWorks drawings, panel layouts, GA and BOM',   90),
  ('other',                'Other trade',           'Anything else; tell us in the scope',                       999)
ON CONFLICT (slug) DO NOTHING;

-- 2. Providers (the workers)
CREATE TABLE IF NOT EXISTS public.service_providers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  full_name        text NOT NULL,
  phone            text NOT NULL UNIQUE,
  trades           text[] NOT NULL,
  skills           text,
  experience_years int,
  area             text NOT NULL DEFAULT 'Peenya',
  languages        text[] NOT NULL DEFAULT '{}',
  owns_tools       boolean NOT NULL DEFAULT false,
  day_rate_inr     int,
  availability     text,
  id_proof_type    text,
  id_verified      boolean NOT NULL DEFAULT false,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','verified','active','paused','rejected')),
  jobs_completed   int NOT NULL DEFAULT 0,
  rating_avg       numeric(3,2),
  admin_notes      text,
  source           text NOT NULL DEFAULT 'web',
  user_id          uuid
);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON public.service_providers(status);
CREATE INDEX IF NOT EXISTS idx_service_providers_trades ON public.service_providers USING gin (trades);

-- 3. Requests (businesses needing work done)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number   text NOT NULL UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  requester_name   text NOT NULL,
  requester_company text,
  requester_phone  text NOT NULL,
  requester_email  text,
  trade            text NOT NULL REFERENCES public.service_trades(slug),
  scope            text NOT NULL,
  headcount        int NOT NULL DEFAULT 1 CHECK (headcount BETWEEN 1 AND 50),
  duration_days    numeric(6,1),
  area             text NOT NULL DEFAULT 'Peenya',
  address          text,
  start_date       date,
  urgency          text NOT NULL DEFAULT 'flexible'
                   CHECK (urgency IN ('today','this_week','flexible')),
  budget_note      text,
  status           text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','matching','confirmed','in_progress','completed','cancelled')),
  admin_notes      text,
  source           text NOT NULL DEFAULT 'web',
  buyer_user_id    uuid
);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_buyer ON public.service_requests(buyer_user_id);

-- 4. Assignments (a provider offered / booked on a request)
CREATE TABLE IF NOT EXISTS public.service_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_id      uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE RESTRICT,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  status           text NOT NULL DEFAULT 'offered'
                   CHECK (status IN ('offered','accepted','declined','confirmed','completed','no_show','cancelled')),
  agreed_rate_inr  int,
  rate_unit        text NOT NULL DEFAULT 'day' CHECK (rate_unit IN ('hour','day','job')),
  platform_fee_inr int,
  completed_at     timestamptz,
  buyer_rating     int CHECK (buyer_rating BETWEEN 1 AND 5),
  buyer_review     text,
  notes            text,
  UNIQUE (request_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_service_assignments_provider ON public.service_assignments(provider_id);

-- 5. updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_service_providers_touch ON public.service_providers;
CREATE TRIGGER trg_service_providers_touch BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_service_requests_touch ON public.service_requests;
CREATE TRIGGER trg_service_requests_touch BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_service_assignments_touch ON public.service_assignments;
CREATE TRIGGER trg_service_assignments_touch BEFORE UPDATE ON public.service_assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Keep provider jobs_completed / rating_avg in sync with assignments
CREATE OR REPLACE FUNCTION public.refresh_provider_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid := COALESCE(NEW.provider_id, OLD.provider_id);
BEGIN
  UPDATE public.service_providers p SET
    jobs_completed = (SELECT COUNT(*) FROM public.service_assignments a
                      WHERE a.provider_id = pid AND a.status = 'completed'),
    rating_avg = (SELECT ROUND(AVG(a.buyer_rating)::numeric, 2) FROM public.service_assignments a
                  WHERE a.provider_id = pid AND a.buyer_rating IS NOT NULL)
  WHERE p.id = pid;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_service_assignments_stats ON public.service_assignments;
CREATE TRIGGER trg_service_assignments_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.service_assignments
  FOR EACH ROW EXECUTE FUNCTION public.refresh_provider_stats();

-- 7. RLS
ALTER TABLE public.service_trades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active trades" ON public.service_trades;
CREATE POLICY "Anyone can read active trades" ON public.service_trades
  FOR SELECT TO anon, authenticated USING (is_active);

DROP POLICY IF EXISTS "Admins manage trades" ON public.service_trades;
CREATE POLICY "Admins manage trades" ON public.service_trades
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins manage service providers" ON public.service_providers;
CREATE POLICY "Admins manage service providers" ON public.service_providers
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins manage service requests" ON public.service_requests;
CREATE POLICY "Admins manage service requests" ON public.service_requests
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Buyers read own service requests" ON public.service_requests;
CREATE POLICY "Buyers read own service requests" ON public.service_requests
  FOR SELECT TO authenticated USING (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage service assignments" ON public.service_assignments;
CREATE POLICY "Admins manage service assignments" ON public.service_assignments
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 8. Public submission RPCs (no direct table access for anon)
CREATE OR REPLACE FUNCTION public.generate_service_request_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prefix text := 'SVC-' || to_char(now(), 'YYYYMMDD') || '-'; v_count int;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.service_requests WHERE request_number LIKE v_prefix || '%';
  RETURN v_prefix || LPAD(v_count::text, 4, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN regexp_replace(p, '\D', '', 'g') ~ '^91[6-9]\d{9}$' THEN regexp_replace(p, '\D', '', 'g')
    WHEN regexp_replace(p, '\D', '', 'g') ~ '^[6-9]\d{9}$'   THEN '91' || regexp_replace(p, '\D', '', 'g')
    ELSE NULL END;
$$;

CREATE OR REPLACE FUNCTION public.submit_service_request(
  p_name text, p_company text, p_phone text, p_email text,
  p_trade text, p_scope text, p_headcount int, p_duration_days numeric,
  p_area text, p_address text, p_start_date date, p_urgency text, p_budget_note text,
  p_source text DEFAULT 'web'
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text := public.normalize_phone(p_phone); v_number text;
BEGIN
  IF v_phone IS NULL THEN RAISE EXCEPTION 'Enter a valid 10-digit Indian mobile number'; END IF;
  IF length(trim(coalesce(p_name,''))) < 2 THEN RAISE EXCEPTION 'Name is required'; END IF;
  IF length(trim(coalesce(p_scope,''))) < 10 THEN RAISE EXCEPTION 'Describe the work in a few words'; END IF;
  IF length(p_scope) > 2000 THEN RAISE EXCEPTION 'Scope is too long'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_trades WHERE slug = p_trade AND is_active) THEN
    RAISE EXCEPTION 'Unknown trade';
  END IF;
  -- cheap duplicate guard: same phone + trade within 10 minutes
  IF EXISTS (SELECT 1 FROM public.service_requests
             WHERE requester_phone = v_phone AND trade = p_trade
               AND created_at > now() - interval '10 minutes') THEN
    RAISE EXCEPTION 'We already have your request. We will contact you shortly.';
  END IF;

  v_number := public.generate_service_request_number();
  INSERT INTO public.service_requests (
    request_number, requester_name, requester_company, requester_phone, requester_email,
    trade, scope, headcount, duration_days, area, address, start_date, urgency, budget_note,
    source, buyer_user_id
  ) VALUES (
    v_number, trim(p_name), nullif(trim(p_company),''), v_phone, nullif(trim(p_email),''),
    p_trade, trim(p_scope), greatest(1, least(coalesce(p_headcount,1), 50)), p_duration_days,
    coalesce(nullif(trim(p_area),''), 'Peenya'), nullif(trim(p_address),''), p_start_date,
    CASE WHEN p_urgency IN ('today','this_week','flexible') THEN p_urgency ELSE 'flexible' END,
    nullif(trim(p_budget_note),''), coalesce(p_source,'web'), auth.uid()
  );
  RETURN v_number;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_service_provider(
  p_name text, p_phone text, p_trades text[], p_skills text, p_experience_years int,
  p_area text, p_languages text[], p_owns_tools boolean, p_day_rate_inr int,
  p_availability text, p_source text DEFAULT 'web'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text := public.normalize_phone(p_phone);
BEGIN
  IF v_phone IS NULL THEN RAISE EXCEPTION 'Enter a valid 10-digit Indian mobile number'; END IF;
  IF length(trim(coalesce(p_name,''))) < 2 THEN RAISE EXCEPTION 'Name is required'; END IF;
  IF p_trades IS NULL OR array_length(p_trades,1) IS NULL THEN RAISE EXCEPTION 'Select at least one trade'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_trades) t WHERE t NOT IN (SELECT slug FROM public.service_trades WHERE is_active)) THEN
    RAISE EXCEPTION 'Unknown trade';
  END IF;
  IF p_day_rate_inr IS NOT NULL AND (p_day_rate_inr < 100 OR p_day_rate_inr > 20000) THEN
    RAISE EXCEPTION 'Day rate looks wrong';
  END IF;

  -- Re-submitting with the same phone refreshes the profile but never changes verification state
  INSERT INTO public.service_providers (
    full_name, phone, trades, skills, experience_years, area, languages, owns_tools,
    day_rate_inr, availability, source
  ) VALUES (
    trim(p_name), v_phone, p_trades, nullif(trim(p_skills),''), p_experience_years,
    coalesce(nullif(trim(p_area),''), 'Peenya'), coalesce(p_languages,'{}'), coalesce(p_owns_tools,false),
    p_day_rate_inr, nullif(trim(p_availability),''), coalesce(p_source,'web')
  )
  ON CONFLICT (phone) DO UPDATE SET
    full_name = EXCLUDED.full_name, trades = EXCLUDED.trades, skills = EXCLUDED.skills,
    experience_years = EXCLUDED.experience_years, area = EXCLUDED.area, languages = EXCLUDED.languages,
    owns_tools = EXCLUDED.owns_tools, day_rate_inr = EXCLUDED.day_rate_inr,
    availability = EXCLUDED.availability;
END; $$;

-- Honest public supply counts per trade (verified/active providers only)
CREATE OR REPLACE FUNCTION public.service_trade_supply()
RETURNS TABLE (trade text, providers bigint)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT t AS trade, COUNT(*) AS providers
  FROM public.service_providers p, unnest(p.trades) AS t
  WHERE p.status IN ('verified','active')
  GROUP BY t;
$$;

GRANT EXECUTE ON FUNCTION public.submit_service_request(text,text,text,text,text,text,int,numeric,text,text,date,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_service_provider(text,text,text[],text,int,text,text[],boolean,int,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_trade_supply() TO anon, authenticated;
